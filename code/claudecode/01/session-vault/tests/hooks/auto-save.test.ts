import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  mkdtemp,
  rm,
  writeFile,
  mkdir,
  readFile,
  readdir,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";

let tempDir: string;
let vaultDir: string;
let transcriptDir: string;

/**
 * Create a fake .jsonl transcript file with the given number of message pairs.
 */
async function createTranscript(
  messagePairs: number,
  dir?: string,
): Promise<string> {
  const targetDir = dir || transcriptDir;
  await mkdir(targetDir, { recursive: true });
  const filePath = join(targetDir, "test-session.jsonl");
  const lines: string[] = [];

  for (let i = 0; i < messagePairs; i++) {
    lines.push(JSON.stringify({ role: "user", content: `User message ${i + 1}` }));
    lines.push(
      JSON.stringify({ role: "assistant", content: `Assistant response ${i + 1}` }),
    );
  }

  await writeFile(filePath, lines.join("\n"), "utf-8");
  return filePath;
}

/**
 * Run the auto-save hook as a child process with the given stdin JSON.
 * Returns { code, stdout, stderr }.
 */
function runHook(
  stdinData: string,
  env?: Record<string, string>,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const hookPath = join(
      __dirname,
      "..",
      "..",
      "dist",
      "hooks",
      "auto-save.js",
    );
    const child = execFile(
      "node",
      [hookPath],
      {
        env: { ...process.env, VAULT_DIR: vaultDir, ...env },
        timeout: 10000,
      },
      (error, stdout, stderr) => {
        resolve({
          code: error ? error.code ?? 1 : 0,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        });
      },
    );
    if (child.stdin) {
      child.stdin.write(stdinData);
      child.stdin.end();
    }
  });
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "session-vault-hook-test-"));
  vaultDir = join(tempDir, "vault");
  transcriptDir = join(tempDir, "transcripts");
  await mkdir(vaultDir, { recursive: true });
  await mkdir(transcriptDir, { recursive: true });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("auto-save hook", () => {
  it("saves conversation when auto_save is enabled and threshold met", async () => {
    // Enable auto-save with threshold of 2 messages
    await writeFile(
      join(vaultDir, "config.json"),
      JSON.stringify({ auto_save: true, auto_save_min_messages: 2 }),
      "utf-8",
    );

    // Create transcript with 3 message pairs (6 messages)
    const transcriptPath = await createTranscript(3);

    const input = JSON.stringify({
      session_id: "test-session-123",
      transcript_path: transcriptPath,
      cwd: tempDir,
      hook_event_name: "SessionEnd",
      reason: "other",
    });

    const result = await runHook(input);
    expect(result.code).toBe(0);

    // Verify index was created
    const indexPath = join(vaultDir, "index.json");
    const indexRaw = await readFile(indexPath, "utf-8");
    const index = JSON.parse(indexRaw);
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].tags).toContain("auto");
    expect(index.entries[0].source).toBe("auto");
  });

  it("skips when auto_save is false", async () => {
    await writeFile(
      join(vaultDir, "config.json"),
      JSON.stringify({ auto_save: false }),
      "utf-8",
    );

    const transcriptPath = await createTranscript(5);
    const input = JSON.stringify({
      session_id: "test-session",
      transcript_path: transcriptPath,
      cwd: tempDir,
      hook_event_name: "SessionEnd",
    });

    const result = await runHook(input);
    expect(result.code).toBe(1);
  });

  it("skips when no config exists (default auto_save is false)", async () => {
    const transcriptPath = await createTranscript(5);
    const input = JSON.stringify({
      session_id: "test-session",
      transcript_path: transcriptPath,
      cwd: tempDir,
      hook_event_name: "SessionEnd",
    });

    const result = await runHook(input);
    expect(result.code).toBe(1);
  });

  it("skips when message count is below threshold", async () => {
    await writeFile(
      join(vaultDir, "config.json"),
      JSON.stringify({ auto_save: true, auto_save_min_messages: 10 }),
      "utf-8",
    );

    // Only 2 message pairs = 4 messages, below threshold of 10
    const transcriptPath = await createTranscript(2);
    const input = JSON.stringify({
      session_id: "test-session",
      transcript_path: transcriptPath,
      cwd: tempDir,
      hook_event_name: "SessionEnd",
    });

    const result = await runHook(input);
    expect(result.code).toBe(1);
  });

  it("skips when transcript file does not exist", async () => {
    await writeFile(
      join(vaultDir, "config.json"),
      JSON.stringify({ auto_save: true, auto_save_min_messages: 1 }),
      "utf-8",
    );

    const input = JSON.stringify({
      session_id: "test-session",
      transcript_path: "/nonexistent/path/session.jsonl",
      cwd: tempDir,
      hook_event_name: "SessionEnd",
    });

    const result = await runHook(input);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("transcript not found");
  });

  it("skips when stdin is empty", async () => {
    const result = await runHook("");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("no input on stdin");
  });

  it("skips when stdin is invalid JSON", async () => {
    const result = await runHook("not json {{{");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("failed to parse stdin");
  });
});
