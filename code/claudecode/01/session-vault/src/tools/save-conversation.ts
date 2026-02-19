import { z } from "zod";
import { access, constants } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  parseSessionFile,
  toMarkdown,
  generateSummary,
  TranscriptTooLargeError,
} from "../storage/transcript-parser.js";
import { saveTranscript } from "../storage/vault.js";
import { addEntry } from "../storage/index-manager.js";
import { loadConfig, getVaultDir, resolveProjectSavePath } from "../utils/config.js";
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
      save_path: z
        .string()
        .optional()
        .describe(
          "Custom directory path to save the conversation. " +
            "Overrides the default vault location and project_save_paths config.",
        ),
    },
    async (args) => {
      try {
        // Validate transcript file is readable
        try {
          await access(args.transcript_path, constants.R_OK);
        } catch {
          return {
            content: [
              {
                type: "text" as const,
                text: `Transcript file not found or not readable: ${args.transcript_path}\n\n` +
                  "Ensure the session .jsonl file exists. Claude Code stores transcripts in " +
                  "~/.claude/projects/<project-slug>/<session-id>.jsonl",
              },
            ],
            isError: true,
          };
        }

        const config = await loadConfig();

        // Parse the session JSONL (respects max_transcript_size_mb)
        let transcript;
        try {
          transcript = await parseSessionFile(
            args.transcript_path,
            config.max_transcript_size_mb,
          );
        } catch (parseErr) {
          if (parseErr instanceof TranscriptTooLargeError) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: parseErr.message,
                },
              ],
              isError: true,
            };
          }
          throw parseErr;
        }

        if (transcript.messages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No messages found in the session file. The file may be empty or contain only system/tool messages.",
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

        // Resolve save directory: explicit arg > project config > default vault
        const customDir = resolveProjectSavePath(
          config,
          args.project_path,
          args.save_path,
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
          customDir,
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
                  ...(customDir ? { save_path: customDir } : {}),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        let hint = "";

        if (msg.includes("EACCES") || msg.includes("EPERM")) {
          hint = `\n\nThe vault directory (${getVaultDir()}) is not writable. Check file permissions.`;
        } else if (msg.includes("ENOSPC")) {
          hint = "\n\nDisk is full. Free up space and try again.";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Error saving conversation: ${msg}${hint}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
