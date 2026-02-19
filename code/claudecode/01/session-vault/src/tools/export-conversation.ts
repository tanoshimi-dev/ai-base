import { z } from "zod";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadIndex, findEntry } from "../storage/index-manager.js";
import { readTranscript, readMetadata } from "../storage/vault.js";

function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Line breaks → paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  // Fenced code blocks
  html = html.replace(
    /```(\w*)<br>([\s\S]*?)```/g,
    (_match, lang: string, code: string) => {
      const cleanCode = code.replace(/<br>/g, "\n").replace(/<\/?p>/g, "");
      return `<pre><code class="language-${lang || "text"}">${cleanCode}</code></pre>`;
    },
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Session Vault Export</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
  h1 { border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
  h2 { color: #555; margin-top: 2rem; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
  code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.9em; }
  pre code { background: none; padding: 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
</style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
}

export function registerExportConversation(server: McpServer): void {
  server.tool(
    "export_conversation",
    "Export a saved conversation to a file in Markdown, JSON, or HTML format",
    {
      id: z
        .string()
        .describe('Conversation ID, or "all" to export everything'),
      format: z
        .enum(["md", "json", "html"])
        .default("md")
        .describe("Export format"),
      output_dir: z
        .string()
        .optional()
        .describe(
          "Output directory (defaults to current working directory)",
        ),
    },
    async (args) => {
      try {
        const outputDir = args.output_dir || process.cwd();
        const exportedFiles: string[] = [];

        const idsToExport: string[] = [];
        if (args.id === "all") {
          const index = await loadIndex();
          idsToExport.push(...index.entries.map((e) => e.id));
        } else {
          idsToExport.push(args.id);
        }

        if (idsToExport.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No conversations to export.",
              },
            ],
          };
        }

        for (const id of idsToExport) {
          const entry = await findEntry(id);
          if (!entry) {
            continue;
          }

          const transcript = await readTranscript({
            project_path: entry.project_path,
            transcript_file: entry.transcript_file,
          });

          const safeName = `${entry.saved_at.slice(0, 10)}_${id.slice(0, 8)}`;
          let filePath: string;
          let fileContent: string;

          switch (args.format) {
            case "json": {
              const meta = await readMetadata(
                entry.project_path,
                entry.metadata_file,
              );
              fileContent = JSON.stringify(
                { metadata: meta, transcript },
                null,
                2,
              );
              filePath = join(outputDir, `${safeName}.json`);
              break;
            }
            case "html": {
              fileContent = markdownToHtml(transcript);
              filePath = join(outputDir, `${safeName}.html`);
              break;
            }
            default: {
              fileContent = transcript;
              filePath = join(outputDir, `${safeName}.md`);
              break;
            }
          }

          await writeFile(filePath, fileContent, "utf-8");
          exportedFiles.push(filePath);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  exported_count: exportedFiles.length,
                  files: exportedFiles,
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
              text: `Error exporting conversation: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
