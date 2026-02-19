import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadIndex } from "../storage/index-manager.js";
import { readTranscript } from "../storage/vault.js";

interface SearchResult {
  id: string;
  summary: string;
  match_context: string;
  score: number;
}

function extractContext(
  content: string,
  query: string,
  contextLines: number = 2,
): string | null {
  const lines = content.split("\n");
  const lowerQuery = query.toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lowerQuery)) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length, i + contextLines + 1);
      return lines.slice(start, end).join("\n");
    }
  }
  return null;
}

export function registerSearchConversations(server: McpServer): void {
  server.tool(
    "search_conversations",
    "Search saved conversations by content and metadata",
    {
      query: z
        .string()
        .describe("Search query (full-text)"),
      project: z
        .string()
        .optional()
        .describe("Filter by project name"),
      tag: z
        .string()
        .optional()
        .describe("Filter by tag"),
      date_from: z
        .string()
        .optional()
        .describe("Filter by start date (ISO format)"),
      date_to: z
        .string()
        .optional()
        .describe("Filter by end date (ISO format)"),
    },
    async (args) => {
      try {
        const index = await loadIndex();
        let entries = index.entries;
        const lowerQuery = args.query.toLowerCase();

        // Apply pre-filters
        if (args.project) {
          const proj = args.project.toLowerCase();
          entries = entries.filter(
            (e) => e.project.toLowerCase() === proj,
          );
        }

        if (args.tag) {
          const tag = args.tag.toLowerCase();
          entries = entries.filter((e) =>
            e.tags.some((t) => t.toLowerCase() === tag),
          );
        }

        if (args.date_from) {
          const from = new Date(args.date_from).getTime();
          entries = entries.filter(
            (e) => new Date(e.saved_at).getTime() >= from,
          );
        }

        if (args.date_to) {
          const to = new Date(args.date_to).getTime();
          entries = entries.filter(
            (e) => new Date(e.saved_at).getTime() <= to,
          );
        }

        // Score and search
        const results: SearchResult[] = [];

        for (const entry of entries) {
          let score = 0;
          let matchContext = "";

          // Metadata matches (higher score)
          if (entry.summary.toLowerCase().includes(lowerQuery)) {
            score += 3;
            matchContext = entry.summary;
          }
          if (entry.note.toLowerCase().includes(lowerQuery)) {
            score += 2;
            matchContext = matchContext || entry.note;
          }
          if (
            entry.tags.some((t) => t.toLowerCase().includes(lowerQuery))
          ) {
            score += 2;
            matchContext =
              matchContext || `Tags: ${entry.tags.join(", ")}`;
          }

          // Content match (scan .md file)
          if (score === 0 || !matchContext) {
            try {
              const content = await readTranscript({
                project_path: entry.project_path,
                transcript_file: entry.transcript_file,
              });
              const context = extractContext(content, args.query);
              if (context) {
                score += 1;
                matchContext = matchContext || context;
              }
            } catch {
              // File read error — skip content search for this entry
            }
          }

          if (score > 0) {
            results.push({
              id: entry.id,
              summary: entry.summary,
              match_context: matchContext,
              score,
            });
          }
        }

        // Sort by score descending
        results.sort((a, b) => b.score - a.score);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { results, total: results.length },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching conversations: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
