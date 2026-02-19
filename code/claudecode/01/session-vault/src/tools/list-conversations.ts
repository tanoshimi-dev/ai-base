import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadIndex } from "../storage/index-manager.js";

export function registerListConversations(server: McpServer): void {
  server.tool(
    "list_conversations",
    "List saved conversations with optional filters",
    {
      project: z
        .string()
        .optional()
        .describe("Filter by project name"),
      tag: z
        .string()
        .optional()
        .describe("Filter by tag"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum number of results"),
      offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .describe("Number of results to skip"),
    },
    async (args) => {
      try {
        const index = await loadIndex();
        let entries = index.entries;

        // Sort by saved_at descending
        entries.sort(
          (a, b) =>
            new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
        );

        // Apply filters
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

        const total = entries.length;

        // Apply pagination
        entries = entries.slice(args.offset, args.offset + args.limit);

        const conversations = entries.map((e) => ({
          id: e.id,
          summary: e.summary,
          tags: e.tags,
          saved_at: e.saved_at,
          project: e.project,
          message_count: e.message_count,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ conversations, total }, null, 2),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        let hint = "";

        if (msg.includes("EACCES") || msg.includes("EPERM")) {
          hint = "\n\nThe vault directory is not readable. Check file permissions on ~/.session-vault/";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing conversations: ${msg}${hint}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
