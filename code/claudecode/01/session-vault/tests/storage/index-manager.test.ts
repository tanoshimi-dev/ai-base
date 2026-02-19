import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadIndex,
  addEntry,
  removeEntry,
  rebuildIndex,
  findEntry,
} from "../../src/storage/index-manager.js";
import type { ConversationMetadata } from "../../src/storage/vault.js";

let tempDir: string;

function makeMetadata(
  overrides: Partial<ConversationMetadata> = {},
): ConversationMetadata {
  return {
    id: "test-id-1",
    project: "my-project",
    project_path: "/home/user/my-project",
    session_id: "session-1",
    created_at: "2026-02-19T12:00:00Z",
    saved_at: "2026-02-19T12:30:00Z",
    git_branch: "main",
    git_commit: "abc1234",
    tags: ["test"],
    note: "Test note",
    summary: "Test summary",
    message_count: 10,
    source: "manual",
    transcript_file: "2026-02-19_abc12345.md",
    metadata_file: "2026-02-19_abc12345.meta.json",
    ...overrides,
  };
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "session-vault-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("loadIndex", () => {
  it("returns empty index when file does not exist", async () => {
    const index = await loadIndex();
    expect(index.version).toBe(1);
    expect(index.entries).toHaveLength(0);
  });

  it("loads existing index", async () => {
    const indexData = {
      version: 1,
      entries: [
        {
          id: "test-1",
          project: "test",
          project_path: "/test",
          summary: "Test",
          tags: [],
          note: "",
          saved_at: "2026-02-19T00:00:00Z",
          message_count: 5,
          source: "manual",
          transcript_file: "test.md",
          metadata_file: "test.meta.json",
        },
      ],
    };
    await writeFile(
      join(tempDir, "index.json"),
      JSON.stringify(indexData),
      "utf-8",
    );

    const index = await loadIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("test-1");
  });
});

describe("addEntry", () => {
  it("adds entry to empty index", async () => {
    const meta = makeMetadata();
    await addEntry(meta);

    const index = await loadIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("test-id-1");
    expect(index.entries[0].summary).toBe("Test summary");
  });

  it("appends to existing index", async () => {
    await addEntry(makeMetadata({ id: "first" }));
    await addEntry(makeMetadata({ id: "second" }));

    const index = await loadIndex();
    expect(index.entries).toHaveLength(2);
  });
});

describe("removeEntry", () => {
  it("removes entry by ID", async () => {
    await addEntry(makeMetadata({ id: "to-remove" }));
    await addEntry(makeMetadata({ id: "to-keep" }));

    const removed = await removeEntry("to-remove");
    expect(removed).toBe(true);

    const index = await loadIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("to-keep");
  });

  it("returns false if entry not found", async () => {
    const removed = await removeEntry("nonexistent");
    expect(removed).toBe(false);
  });
});

describe("findEntry", () => {
  it("finds entry by ID", async () => {
    await addEntry(makeMetadata({ id: "find-me", summary: "Found it" }));

    const entry = await findEntry("find-me");
    expect(entry).toBeDefined();
    expect(entry!.summary).toBe("Found it");
  });

  it("returns undefined if not found", async () => {
    const entry = await findEntry("nonexistent");
    expect(entry).toBeUndefined();
  });
});

describe("rebuildIndex", () => {
  it("rebuilds from .meta.json files", async () => {
    // Create project directory with meta files
    const projectDir = join(tempDir, "projects", "my-project");
    await mkdir(projectDir, { recursive: true });

    const meta1 = makeMetadata({ id: "rebuilt-1", saved_at: "2026-02-18T00:00:00Z" });
    const meta2 = makeMetadata({ id: "rebuilt-2", saved_at: "2026-02-19T00:00:00Z" });

    await writeFile(
      join(projectDir, "2026-02-18_aaa.meta.json"),
      JSON.stringify(meta1),
      "utf-8",
    );
    await writeFile(
      join(projectDir, "2026-02-19_bbb.meta.json"),
      JSON.stringify(meta2),
      "utf-8",
    );

    const index = await rebuildIndex();
    expect(index.entries).toHaveLength(2);
    // Should be sorted by saved_at descending
    expect(index.entries[0].id).toBe("rebuilt-2");
    expect(index.entries[1].id).toBe("rebuilt-1");
  });

  it("returns empty index when no projects exist", async () => {
    const index = await rebuildIndex();
    expect(index.entries).toHaveLength(0);
  });

  it("skips corrupted meta files", async () => {
    const projectDir = join(tempDir, "projects", "test");
    await mkdir(projectDir, { recursive: true });

    await writeFile(
      join(projectDir, "good.meta.json"),
      JSON.stringify(makeMetadata({ id: "good" })),
      "utf-8",
    );
    await writeFile(
      join(projectDir, "bad.meta.json"),
      "not valid json {{{",
      "utf-8",
    );

    const index = await rebuildIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("good");
  });
});
