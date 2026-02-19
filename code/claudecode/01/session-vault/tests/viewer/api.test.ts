/**
 * Tests for the REST API handlers.
 * Creates an HTTP server, sends real requests, and validates responses.
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import http from "node:http";
import {
  parseJsonlContent,
  toMarkdown,
  generateSummary,
} from "../../src/storage/transcript-parser.js";
import { saveTranscript } from "../../src/storage/vault.js";
import { addEntry } from "../../src/storage/index-manager.js";
import { createViewerServer } from "../../src/viewer/server.js";

let tempDir: string;
let server: http.Server;
let port: number;

function fetch(path: string, method: string = "GET"): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, path, method },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let body: any;
          try {
            body = JSON.parse(data);
          } catch {
            body = data;
          }
          resolve({ status: res.statusCode || 0, body });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function seedConversation(opts: {
  project: string;
  tags: string[];
  content: string;
  note?: string;
}) {
  const jsonl = [
    JSON.stringify({ role: "user", content: opts.content }),
    JSON.stringify({ role: "assistant", content: "Response to: " + opts.content }),
  ].join("\n");

  const transcript = parseJsonlContent(jsonl);
  const summary = generateSummary(transcript);
  const md = toMarkdown(transcript, {
    title: summary.slice(0, 60),
    project: opts.project,
    tags: opts.tags,
  });

  const meta = await saveTranscript(md, {
    projectPath: `/home/user/${opts.project}`,
    sessionId: "test-" + Math.random().toString(36).slice(2),
    summary,
    messageCount: transcript.messageCount,
    tags: opts.tags,
    note: opts.note || "",
  });
  await addEntry(meta);
  return meta;
}

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-api-test-"));
  process.env.VAULT_DIR = tempDir;

  server = createViewerServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      port = typeof addr === "object" && addr ? addr.port : 0;
      resolve();
    });
  });
});

afterAll(async () => {
  server.close();
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("GET /api/stats", () => {
  it("returns empty stats initially", async () => {
    const { status, body } = await fetch("/api/stats");
    expect(status).toBe(200);
    expect(body.total_conversations).toBe(0);
  });
});

describe("Full API lifecycle", () => {
  let savedId: string;

  it("seeds test data", async () => {
    const m1 = await seedConversation({
      project: "app-one",
      tags: ["auth", "security"],
      content: "How to implement JWT authentication?",
      note: "JWT auth approach",
    });
    savedId = m1.id;

    await seedConversation({
      project: "app-one",
      tags: ["refactor"],
      content: "Refactor the database layer",
    });

    await seedConversation({
      project: "app-two",
      tags: ["auth"],
      content: "Add OAuth2 login flow",
    });
  });

  it("GET /api/conversations returns all", async () => {
    const { status, body } = await fetch("/api/conversations");
    expect(status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.conversations).toHaveLength(3);
  });

  it("GET /api/conversations?project=app-one filters", async () => {
    const { status, body } = await fetch("/api/conversations?project=app-one");
    expect(status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.conversations.every((c: any) => c.project === "app-one")).toBe(true);
  });

  it("GET /api/conversations?tag=auth filters", async () => {
    const { status, body } = await fetch("/api/conversations?tag=auth");
    expect(status).toBe(200);
    expect(body.total).toBe(2);
  });

  it("GET /api/conversations?q=JWT searches", async () => {
    const { status, body } = await fetch("/api/conversations?q=JWT");
    expect(status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.conversations[0].summary).toContain("JWT");
  });

  it("GET /api/conversations?limit=1&offset=1 paginates", async () => {
    const { status, body } = await fetch("/api/conversations?limit=1&offset=1");
    expect(status).toBe(200);
    expect(body.conversations).toHaveLength(1);
    expect(body.total).toBe(3);
  });

  it("GET /api/conversations/:id returns detail", async () => {
    const { status, body } = await fetch(`/api/conversations/${savedId}`);
    expect(status).toBe(200);
    expect(body.metadata.id).toBe(savedId);
    expect(body.transcript).toContain("JWT");
    expect(body.metadata.tags).toContain("auth");
  });

  it("GET /api/conversations/:id returns 404 for missing", async () => {
    const { status, body } = await fetch("/api/conversations/nonexistent");
    expect(status).toBe(404);
    expect(body.error).toBe("Conversation not found");
  });

  it("GET /api/tags returns aggregated tags", async () => {
    const { status, body } = await fetch("/api/tags");
    expect(status).toBe(200);
    expect(body.tags.length).toBeGreaterThanOrEqual(2);
    const authTag = body.tags.find((t: any) => t.name === "auth");
    expect(authTag).toBeDefined();
    expect(authTag.count).toBe(2);
  });

  it("GET /api/projects returns aggregated projects", async () => {
    const { status, body } = await fetch("/api/projects");
    expect(status).toBe(200);
    expect(body.projects.length).toBe(2);
    const p1 = body.projects.find((p: any) => p.name === "app-one");
    expect(p1).toBeDefined();
    expect(p1.count).toBe(2);
  });

  it("GET /api/stats returns correct stats", async () => {
    const { status, body } = await fetch("/api/stats");
    expect(status).toBe(200);
    expect(body.total_conversations).toBe(3);
    expect(body.total_messages).toBe(6); // 2 msgs per conversation
    expect(body.projects_count).toBe(2);
    expect(body.date_range).toBeDefined();
  });

  it("DELETE /api/conversations/:id removes entry", async () => {
    const { status, body } = await fetch(`/api/conversations/${savedId}`, "DELETE");
    expect(status).toBe(200);
    expect(body.deleted).toBe(true);

    // Verify it's gone
    const check = await fetch(`/api/conversations/${savedId}`);
    expect(check.status).toBe(404);

    // Total is now 2
    const list = await fetch("/api/conversations");
    expect(list.body.total).toBe(2);
  });
});

describe("SPA serving", () => {
  it("serves HTML for non-API routes", async () => {
    return new Promise<void>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          expect(res.statusCode).toBe(200);
          expect(res.headers["content-type"]).toContain("text/html");
          expect(data).toContain("Session Vault");
          resolve();
        });
        res.on("error", reject);
      });
    });
  });
});

describe("Unknown API routes", () => {
  it("returns 404 for unknown API paths", async () => {
    const { status, body } = await fetch("/api/unknown");
    expect(status).toBe(404);
    expect(body.error).toBe("Not found");
  });
});
