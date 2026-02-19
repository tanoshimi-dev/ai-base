import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findEntry } from "../storage/index-manager.js";
import { readTranscript } from "../storage/vault.js";

const DECISION_KEYWORDS = [
  "decided",
  "chose",
  "chosen",
  "approach",
  "because",
  "instead of",
  "opted for",
  "going with",
  "let's go with",
  "decision",
  "trade-off",
  "tradeoff",
];

const ERROR_KEYWORDS = [
  "error",
  "exception",
  "failed",
  "failure",
  "bug",
  "issue",
  "crash",
  "fix",
  "fixed",
  "broken",
  "stacktrace",
  "stack trace",
  "traceback",
  "TypeError",
  "ReferenceError",
  "SyntaxError",
];

function extractDecisions(content: string): string {
  const lines = content.split("\n");
  const relevant: string[] = [];
  let inRelevantBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();

    if (lower.startsWith("## ")) {
      // Section header — include it for context
      if (inRelevantBlock) {
        relevant.push(""); // blank line separator
      }
      inRelevantBlock = false;
    }

    const hasKeyword = DECISION_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasKeyword) {
      if (!inRelevantBlock) {
        // Include the nearest section header
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].startsWith("## ")) {
            relevant.push(lines[j]);
            break;
          }
        }
      }
      inRelevantBlock = true;
    }

    if (inRelevantBlock) {
      relevant.push(lines[i]);
      // Stop block after a blank line following the keyword line
      if (lines[i].trim() === "" && i > 0 && lines[i - 1].trim() !== "") {
        inRelevantBlock = false;
      }
    }
  }

  return relevant.length > 0
    ? relevant.join("\n")
    : "No decision-related content found.";
}

function extractCodeBlocks(content: string): string {
  const blocks: string[] = [];
  const lines = content.split("\n");
  let inBlock = false;
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inBlock) {
        currentBlock.push(line);
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
        inBlock = false;
      } else {
        inBlock = true;
        currentBlock = [line];
      }
    } else if (inBlock) {
      currentBlock.push(line);
    }
  }

  return blocks.length > 0
    ? blocks.join("\n\n")
    : "No code blocks found.";
}

function extractErrors(content: string): string {
  const lines = content.split("\n");
  const relevant: string[] = [];
  let inRelevantBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();

    if (lower.startsWith("## ")) {
      if (inRelevantBlock) {
        relevant.push("");
      }
      inRelevantBlock = false;
    }

    const hasKeyword = ERROR_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasKeyword) {
      if (!inRelevantBlock) {
        for (let j = i - 1; j >= 0; j--) {
          if (lines[j].startsWith("## ")) {
            relevant.push(lines[j]);
            break;
          }
        }
      }
      inRelevantBlock = true;
    }

    if (inRelevantBlock) {
      relevant.push(lines[i]);
      if (lines[i].trim() === "" && i > 0 && lines[i - 1].trim() !== "") {
        inRelevantBlock = false;
      }
    }
  }

  return relevant.length > 0
    ? relevant.join("\n")
    : "No error-related content found.";
}

export function registerGetConversation(server: McpServer): void {
  server.tool(
    "get_conversation",
    "Retrieve a saved conversation by ID, optionally extracting specific sections",
    {
      id: z.string().describe("Conversation ID"),
      section: z
        .enum(["full", "decisions", "code", "errors"])
        .default("full")
        .describe(
          "Section to extract: full transcript, decisions, code blocks, or errors",
        ),
    },
    async (args) => {
      try {
        const entry = await findEntry(args.id);
        if (!entry) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Conversation not found: ${args.id}`,
              },
            ],
            isError: true,
          };
        }

        const content = await readTranscript({
          project_path: entry.project_path,
          transcript_file: entry.transcript_file,
        });

        let extracted: string;
        switch (args.section) {
          case "decisions":
            extracted = extractDecisions(content);
            break;
          case "code":
            extracted = extractCodeBlocks(content);
            break;
          case "errors":
            extracted = extractErrors(content);
            break;
          default:
            extracted = content;
        }

        const metadata = {
          id: entry.id,
          project: entry.project,
          summary: entry.summary,
          tags: entry.tags,
          saved_at: entry.saved_at,
          message_count: entry.message_count,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { content: extracted, metadata },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        let hint = "";

        if (msg.includes("ENOENT")) {
          hint = "\n\nThe transcript file may have been deleted from disk. " +
            "Try running a vault index rebuild or use list_conversations to check available entries.";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Error retrieving conversation: ${msg}${hint}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
