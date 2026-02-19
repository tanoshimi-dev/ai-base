import { z } from "zod";
import { exec } from "node:child_process";
import { platform } from "node:os";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { startViewer, stopViewer } from "../viewer/server.js";

function openBrowser(url: string): void {
  const plat = platform();
  const cmd =
    plat === "darwin"
      ? `open "${url}"`
      : plat === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  exec(cmd, (error) => {
    if (error) {
      // Non-fatal — browser just won't auto-open
    }
  });
}

export function registerStartViewer(server: McpServer): void {
  server.tool(
    "start_viewer",
    "Start or stop the Session Vault browser viewer",
    {
      port: z
        .number()
        .int()
        .min(1024)
        .max(65535)
        .default(3777)
        .describe("Port to bind the viewer server"),
      action: z
        .enum(["start", "stop"])
        .default("start")
        .describe("Start or stop the viewer"),
    },
    async (args) => {
      try {
        if (args.action === "stop") {
          const result = await stopViewer();
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        const result = await startViewer(args.port);

        if (result.status === "started") {
          openBrowser(result.url);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error with viewer: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
