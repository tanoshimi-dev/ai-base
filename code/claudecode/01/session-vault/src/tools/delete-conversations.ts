import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadIndex, removeEntry } from "../storage/index-manager.js";
import { deleteEntry } from "../storage/vault.js";
import type { IndexEntry } from "../storage/index-manager.js";

function parseOlderThan(value: string): number | null {
  const match = value.match(/^(\d+)([dhm])$/);
  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms =
    unit === "d"
      ? amount * 86400000
      : unit === "h"
        ? amount * 3600000
        : amount * 2592000000; // 'm' = months (30 days)

  return Date.now() - ms;
}

export function registerDeleteConversations(server: McpServer): void {
  server.tool(
    "delete_conversations",
    "Delete saved conversations by ID, age, or tag. Requires confirm: true to execute.",
    {
      ids: z
        .array(z.string())
        .optional()
        .describe("Specific conversation IDs to delete"),
      older_than: z
        .string()
        .optional()
        .describe('Delete conversations older than this (e.g., "30d", "6m")'),
      tag: z
        .string()
        .optional()
        .describe("Delete conversations with this tag"),
      confirm: z
        .boolean()
        .describe(
          "Must be true to execute deletion. Set to false to preview what would be deleted.",
        ),
    },
    async (args) => {
      try {
        const index = await loadIndex();
        let toDelete: IndexEntry[] = [];

        if (args.ids && args.ids.length > 0) {
          const idSet = new Set(args.ids);
          toDelete = index.entries.filter((e) => idSet.has(e.id));
        } else {
          toDelete = [...index.entries];

          if (args.older_than) {
            const cutoff = parseOlderThan(args.older_than);
            if (cutoff === null) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Invalid older_than format: "${args.older_than}". Use "30d", "6m", etc.`,
                  },
                ],
                isError: true,
              };
            }
            toDelete = toDelete.filter(
              (e) => new Date(e.saved_at).getTime() < cutoff,
            );
          }

          if (args.tag) {
            const tag = args.tag.toLowerCase();
            toDelete = toDelete.filter((e) =>
              e.tags.some((t) => t.toLowerCase() === tag),
            );
          }
        }

        if (toDelete.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No conversations match the given filter.",
              },
            ],
          };
        }

        // Preview mode
        if (!args.confirm) {
          const preview = toDelete.map((e) => ({
            id: e.id,
            summary: e.summary,
            project: e.project,
            saved_at: e.saved_at,
            tags: e.tags,
          }));
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    preview: true,
                    would_delete: preview,
                    count: preview.length,
                    message:
                      "Set confirm: true to execute deletion.",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Execute deletion
        const deletedIds: string[] = [];
        for (const entry of toDelete) {
          await deleteEntry({
            project_path: entry.project_path,
            transcript_file: entry.transcript_file,
            metadata_file: entry.metadata_file,
          });
          await removeEntry(entry.id);
          deletedIds.push(entry.id);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  deleted_count: deletedIds.length,
                  deleted_ids: deletedIds,
                },
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
              text: `Error deleting conversations: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
