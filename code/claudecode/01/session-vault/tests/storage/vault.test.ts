import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ensureVaultDir,
  saveTranscript,
  readTranscript,
  deleteEntry,
} from "../../src/storage/vault.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "session-vault-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("ensureVaultDir", () => {
  it("creates project directory", async () => {
    const dir = await ensureVaultDir("/home/user/my-project");
    expect(dir).toContain("home-user-my-project");
  });

  it("is idempotent", async () => {
    const dir1 = await ensureVaultDir("/home/user/my-project");
    const dir2 = await ensureVaultDir("/home/user/my-project");
    expect(dir1).toBe(dir2);
  });
});

describe("saveTranscript + readTranscript", () => {
  it("saves and reads back markdown transcript", async () => {
    const markdown = "# Session: Test\n\n## User\nHello\n\n## Claude\nHi!\n";

    const metadata = await saveTranscript(markdown, {
      projectPath: "/home/user/test-project",
      sessionId: "session-123",
      summary: "Test conversation",
      messageCount: 2,
      tags: ["test"],
      note: "A test note",
    });

    expect(metadata.id).toBeTruthy();
    expect(metadata.project).toBe("test-project");
    expect(metadata.tags).toEqual(["test"]);
    expect(metadata.message_count).toBe(2);

    const content = await readTranscript(metadata);
    expect(content).toBe(markdown);
  });

  it("generates unique IDs for each save", async () => {
    const md = "# Test\n";
    const opts = {
      projectPath: "/test",
      sessionId: "s1",
      summary: "test",
      messageCount: 1,
    };

    const m1 = await saveTranscript(md, opts);
    const m2 = await saveTranscript(md, opts);
    expect(m1.id).not.toBe(m2.id);
    expect(m1.transcript_file).not.toBe(m2.transcript_file);
  });
});

describe("deleteEntry", () => {
  it("deletes both transcript and metadata files", async () => {
    const markdown = "# Test\n";
    const metadata = await saveTranscript(markdown, {
      projectPath: "/home/user/test",
      sessionId: "s1",
      summary: "test",
      messageCount: 1,
    });

    // Should not throw
    await deleteEntry(metadata);

    // Reading should now fail
    await expect(readTranscript(metadata)).rejects.toThrow();
  });

  it("does not throw if files already deleted", async () => {
    await expect(
      deleteEntry({
        project_path: "/nonexistent",
        transcript_file: "nope.md",
        metadata_file: "nope.meta.json",
      }),
    ).resolves.not.toThrow();
  });
});
