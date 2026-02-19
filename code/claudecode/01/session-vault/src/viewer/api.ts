import type { IncomingMessage, ServerResponse } from "node:http";
import { loadIndex, removeEntry } from "../storage/index-manager.js";
import { readTranscript, readMetadata, deleteEntry } from "../storage/vault.js";

interface ApiError {
  error: string;
  code: number;
}

function jsonResponse(
  res: ServerResponse,
  data: unknown,
  status: number = 200,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function errorResponse(
  res: ServerResponse,
  error: string,
  code: number = 500,
): void {
  jsonResponse(res, { error, code } satisfies ApiError, code);
}

function parseQuery(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/** GET /api/conversations?q=&tag=&project=&from=&to=&limit=&offset= */
async function listConversations(
  query: Record<string, string>,
  res: ServerResponse,
): Promise<void> {
  const index = await loadIndex();
  let entries = [...index.entries];

  // Sort by saved_at descending
  entries.sort(
    (a, b) =>
      new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
  );

  // Filters
  if (query.project) {
    const proj = query.project.toLowerCase();
    entries = entries.filter((e) => e.project.toLowerCase() === proj);
  }
  if (query.tag) {
    const tag = query.tag.toLowerCase();
    entries = entries.filter((e) =>
      e.tags.some((t) => t.toLowerCase() === tag),
    );
  }
  if (query.from) {
    const from = new Date(query.from).getTime();
    entries = entries.filter((e) => new Date(e.saved_at).getTime() >= from);
  }
  if (query.to) {
    const to = new Date(query.to).getTime();
    entries = entries.filter((e) => new Date(e.saved_at).getTime() <= to);
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.summary.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.project.toLowerCase().includes(q),
    );
  }

  const total = entries.length;
  const limit = Math.min(parseInt(query.limit || "20", 10) || 20, 100);
  const offset = parseInt(query.offset || "0", 10) || 0;
  entries = entries.slice(offset, offset + limit);

  jsonResponse(res, { conversations: entries, total });
}

/** GET /api/conversations/:id */
async function getConversation(
  id: string,
  res: ServerResponse,
): Promise<void> {
  const index = await loadIndex();
  const entry = index.entries.find((e) => e.id === id);
  if (!entry) {
    errorResponse(res, "Conversation not found", 404);
    return;
  }

  const [transcript, metadata] = await Promise.all([
    readTranscript({
      project_path: entry.project_path,
      transcript_file: entry.transcript_file,
    }),
    readMetadata(entry.project_path, entry.metadata_file),
  ]);

  jsonResponse(res, { transcript, metadata });
}

/** DELETE /api/conversations/:id */
async function deleteConversation(
  id: string,
  res: ServerResponse,
): Promise<void> {
  const index = await loadIndex();
  const entry = index.entries.find((e) => e.id === id);
  if (!entry) {
    errorResponse(res, "Conversation not found", 404);
    return;
  }

  await deleteEntry({
    project_path: entry.project_path,
    transcript_file: entry.transcript_file,
    metadata_file: entry.metadata_file,
  });
  await removeEntry(id);

  jsonResponse(res, { deleted: true, id });
}

/** GET /api/tags */
async function getTags(res: ServerResponse): Promise<void> {
  const index = await loadIndex();
  const tagCounts = new Map<string, number>();

  for (const entry of index.entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  jsonResponse(res, { tags });
}

/** GET /api/projects */
async function getProjects(res: ServerResponse): Promise<void> {
  const index = await loadIndex();
  const projectMap = new Map<
    string,
    { count: number; earliest: string; latest: string }
  >();

  for (const entry of index.entries) {
    const existing = projectMap.get(entry.project);
    if (existing) {
      existing.count++;
      if (entry.saved_at < existing.earliest)
        existing.earliest = entry.saved_at;
      if (entry.saved_at > existing.latest)
        existing.latest = entry.saved_at;
    } else {
      projectMap.set(entry.project, {
        count: 1,
        earliest: entry.saved_at,
        latest: entry.saved_at,
      });
    }
  }

  const projects = Array.from(projectMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  jsonResponse(res, { projects });
}

/** GET /api/stats */
async function getStats(res: ServerResponse): Promise<void> {
  const index = await loadIndex();
  const entries = index.entries;

  if (entries.length === 0) {
    jsonResponse(res, {
      total_conversations: 0,
      total_messages: 0,
      date_range: null,
      projects_count: 0,
      tags_count: 0,
    });
    return;
  }

  const dates = entries.map((e) => e.saved_at).sort();
  const projects = new Set(entries.map((e) => e.project));
  const tags = new Set(entries.flatMap((e) => e.tags));

  jsonResponse(res, {
    total_conversations: entries.length,
    total_messages: entries.reduce((sum, e) => sum + e.message_count, 0),
    date_range: { earliest: dates[0], latest: dates[dates.length - 1] },
    projects_count: projects.size,
    tags_count: tags.size,
  });
}

/**
 * Route an API request to the appropriate handler.
 * Returns true if the request was handled, false if no route matched.
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const path = url.pathname;
  const method = req.method || "GET";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3777");
  res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (!path.startsWith("/api/")) {
    return false;
  }

  try {
    // GET /api/conversations
    if (path === "/api/conversations" && method === "GET") {
      await listConversations(parseQuery(url), res);
      return true;
    }

    // GET|DELETE /api/conversations/:id
    const convoMatch = path.match(/^\/api\/conversations\/([^/]+)$/);
    if (convoMatch) {
      const id = decodeURIComponent(convoMatch[1]);
      if (method === "GET") {
        await getConversation(id, res);
        return true;
      }
      if (method === "DELETE") {
        await deleteConversation(id, res);
        return true;
      }
    }

    // GET /api/tags
    if (path === "/api/tags" && method === "GET") {
      await getTags(res);
      return true;
    }

    // GET /api/projects
    if (path === "/api/projects" && method === "GET") {
      await getProjects(res);
      return true;
    }

    // GET /api/stats
    if (path === "/api/stats" && method === "GET") {
      await getStats(res);
      return true;
    }

    errorResponse(res, "Not found", 404);
    return true;
  } catch (error) {
    errorResponse(
      res,
      error instanceof Error ? error.message : "Internal server error",
      500,
    );
    return true;
  }
}
