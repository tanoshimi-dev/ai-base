import { createServer, type Server } from "node:http";
import { readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getVaultDir } from "../utils/config.js";
import { handleApiRequest } from "./api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedHtml: string | null = null;

async function loadAppHtml(): Promise<string> {
  if (cachedHtml) return cachedHtml;

  // Try multiple candidate paths — __dirname may be dist/ or dist/viewer/
  // depending on bundler code splitting
  const candidates = [
    join(__dirname, "app.html"),
    join(__dirname, "viewer", "app.html"),
    join(__dirname, "..", "viewer", "app.html"),
    join(__dirname, "..", "dist", "viewer", "app.html"),
    join(__dirname, "..", "..", "src", "viewer", "app.html"),
  ];

  for (const candidate of candidates) {
    try {
      cachedHtml = await readFile(candidate, "utf-8");
      return cachedHtml;
    } catch {
      // Try next candidate
    }
  }

  throw new Error(
    "Could not find app.html. Searched:\n" + candidates.join("\n"),
  );
}

function getPidPath(): string {
  return join(getVaultDir(), ".viewer.pid");
}

export async function writePid(pid: number): Promise<void> {
  await mkdir(getVaultDir(), { recursive: true });
  await writeFile(getPidPath(), String(pid), "utf-8");
}

export async function readPid(): Promise<number | null> {
  try {
    const raw = await readFile(getPidPath(), "utf-8");
    const pid = parseInt(raw.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

export async function removePid(): Promise<void> {
  await rm(getPidPath(), { force: true });
}

export function createViewerServer(): Server {
  const server = createServer(async (req, res) => {
    try {
      // Try API routes first
      const handled = await handleApiRequest(req, res);
      if (handled) return;

      // Serve the SPA for all non-API routes
      const html = await loadAppHtml();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(html);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "Internal server error",
          code: 500,
        }),
      );
    }
  });

  return server;
}

export interface ViewerStartResult {
  status: "started" | "already_running";
  url: string;
  pid: number;
}

export interface ViewerStopResult {
  status: "stopped" | "not_running";
}

export async function startViewer(
  port: number = 3777,
): Promise<ViewerStartResult> {
  // Check if already running
  const existingPid = await readPid();
  if (existingPid !== null) {
    try {
      process.kill(existingPid, 0); // Test if process exists
      return {
        status: "already_running",
        url: `http://localhost:${port}`,
        pid: existingPid,
      };
    } catch {
      // Process doesn't exist — stale PID file, clean up
      await removePid();
    }
  }

  const server = createViewerServer();

  return new Promise((resolve, reject) => {
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });

    server.listen(port, "127.0.0.1", async () => {
      const pid = process.pid;
      await writePid(pid);

      // Graceful shutdown
      const shutdown = async () => {
        server.close();
        await removePid();
      };
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);

      resolve({
        status: "started",
        url: `http://localhost:${port}`,
        pid,
      });
    });
  });
}

export async function stopViewer(): Promise<ViewerStopResult> {
  const pid = await readPid();
  if (pid === null) {
    return { status: "not_running" };
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // Process already gone
  }

  await removePid();
  return { status: "stopped" };
}
