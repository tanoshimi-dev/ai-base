import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseSessionFile,
  toMarkdown,
  generateSummary,
} from "../storage/transcript-parser.js";
import { saveTranscript } from "../storage/vault.js";
import { addEntry } from "../storage/index-manager.js";
import { loadConfig } from "../utils/config.js";
import { getCurrentBranch, getCurrentCommit } from "../utils/git.js";
import { projectName } from "../utils/slug.js";

export function registerSaveConversation(server: McpServer): void {
  server.tool(
    "save_conversation",
    "Save a Claude Code conversation to the vault with optional tags and notes",
    {
      transcript_path: z
        .string()
        .describe("Path to the session .jsonl file"),
      project_path: z
        .string()
        .describe("Project working directory path"),
      session_id: z
        .string()
        .optional()
        .describe("Original session ID"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags to attach to the saved conversation"),
      note: z
        .string()
        .optional()
        .describe("A note describing the conversation"),
    },
    async (args) => {
      try {
        const config = await loadConfig();

        // Parse the session JSONL
        const transcript = await parseSessionFile(args.transcript_path);
        if (transcript.messages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No messages found in the session file. Nothing to save.",
              },
            ],
          };
        }

        // Collect git metadata
        const [gitBranch, gitCommit] = await Promise.all([
          getCurrentBranch(args.project_path),
          getCurrentCommit(args.project_path),
        ]);

        // Generate summary and markdown
        const summary = generateSummary(transcript);
        const project = projectName(args.project_path);
        const markdown = toMarkdown(
          transcript,
          {
            title: summary.slice(0, 60),
            date: new Date().toISOString(),
            project,
            branch: gitBranch ?? undefined,
            tags: args.tags,
          },
          config.redaction_rules,
        );

        // Save to vault
        const metadata = await saveTranscript(markdown, {
          projectPath: args.project_path,
          sessionId: args.session_id || "unknown",
          gitBranch,
          gitCommit,
          tags: args.tags || [],
          note: args.note || "",
          summary,
          messageCount: transcript.messageCount,
          source: "manual",
        });

        // Update index
        await addEntry(metadata);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  id: metadata.id,
                  project: metadata.project,
                  summary: metadata.summary,
                  tags: metadata.tags,
                  message_count: metadata.message_count,
                  saved_at: metadata.saved_at,
                  transcript_file: metadata.transcript_file,
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
              text: `Error saving conversation: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
