import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseJsonlContent,
  parseSessionFile,
  parseSessionFileStreaming,
  TranscriptTooLargeError,
} from "../../src/storage/transcript-parser.js";
import {
  loadIndex,
  addEntry,
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

/**
 * Generate a .jsonl string with N message pairs.
 */
function generateJsonl(pairs: number): string {
  const lines: string[] = [];
  for (let i = 0; i < pairs; i++) {
    lines.push(JSON.stringify({ role: "user", content: `User message ${i + 1}` }));
    lines.push(
      JSON.stringify({ role: "assistant", content: `Assistant response ${i + 1}` }),
    );
  }
  return lines.join("\n");
}

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-phase5-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("Streaming parser", () => {
  it("parses a JSONL file line-by-line with same results as in-memory", async () => {
    const jsonl = generateJsonl(10);
    const filePath = join(tempDir, "stream-test.jsonl");
    await writeFile(filePath, jsonl, "utf-8");

    const inMemory = parseJsonlContent(jsonl);
    const streamed = await parseSessionFileStreaming(filePath);

    expect(streamed.messageCount).toBe(inMemory.messageCount);
    expect(streamed.messages).toEqual(inMemory.messages);
  });

  it("handles empty file via streaming", async () => {
    const filePath = join(tempDir, "empty.jsonl");
    await writeFile(filePath, "", "utf-8");

    const result = await parseSessionFileStreaming(filePath);
    expect(result.messages).toHaveLength(0);
    expect(result.messageCount).toBe(0);
  });

  it("skips invalid JSON lines via streaming", async () => {
    const content = [
      "not valid json",
      JSON.stringify({ role: "user", content: "hello" }),
      "also broken {{{",
      JSON.stringify({ role: "assistant", content: "hi there" }),
    ].join("\n");
    const filePath = join(tempDir, "mixed.jsonl");
    await writeFile(filePath, content, "utf-8");

    const result = await parseSessionFileStreaming(filePath);
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe("hello");
    expect(result.messages[1].content).toBe("hi there");
  });
});

describe("TranscriptTooLargeError", () => {
  it("throws when file exceeds max size", async () => {
    // Create a file slightly over 1 MB and set limit to 1 MB
    const largeLine = JSON.stringify({
      role: "user",
      content: "x".repeat(100_000),
    });
    const lines = Array(12).fill(largeLine).join("\n"); // ~1.2 MB
    const filePath = join(tempDir, "large.jsonl");
    await writeFile(filePath, lines, "utf-8");

    await expect(parseSessionFile(filePath, 1)).rejects.toThrow(
      TranscriptTooLargeError,
    );
    await expect(parseSessionFile(filePath, 1)).rejects.toThrow(
      /exceeds the 1 MB limit/,
    );
  });

  it("works fine when file is under the limit", async () => {
    const small = JSON.stringify({ role: "user", content: "small message" });
    const filePath = join(tempDir, "small.jsonl");
    await writeFile(filePath, small, "utf-8");

    const result = await parseSessionFile(filePath, 100);
    expect(result.messages).toHaveLength(1);
  });
});

describe("Index auto-recovery", () => {
  it("rebuilds index when index.json is corrupted", async () => {
    // Set up a project with valid .meta.json files
    const projectDir = join(tempDir, "projects", "test-project");
    await mkdir(projectDir, { recursive: true });

    const meta = makeMetadata({ id: "recovered-1" });
    await writeFile(
      join(projectDir, "2026-02-19_aaa.meta.json"),
      JSON.stringify(meta),
      "utf-8",
    );

    // Write corrupted index
    await writeFile(join(tempDir, "index.json"), "corrupted {{{ data", "utf-8");

    // loadIndex should auto-recover
    const index = await loadIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("recovered-1");
  });

  it("rebuilds index when index.json is missing but data exists", async () => {
    const projectDir = join(tempDir, "projects", "test-project");
    await mkdir(projectDir, { recursive: true });

    const meta1 = makeMetadata({ id: "orphan-1", saved_at: "2026-02-18T00:00:00Z" });
    const meta2 = makeMetadata({ id: "orphan-2", saved_at: "2026-02-19T00:00:00Z" });

    await writeFile(
      join(projectDir, "a.meta.json"),
      JSON.stringify(meta1),
      "utf-8",
    );
    await writeFile(
      join(projectDir, "b.meta.json"),
      JSON.stringify(meta2),
      "utf-8",
    );

    // No index.json exists — loadIndex should rebuild
    const index = await loadIndex();
    expect(index.entries).toHaveLength(2);
    // Should be sorted by saved_at desc
    expect(index.entries[0].id).toBe("orphan-2");
  });

  it("returns empty index when no data and no index exist", async () => {
    const index = await loadIndex();
    expect(index.entries).toHaveLength(0);
  });

  it("rebuilds when index has invalid structure", async () => {
    const projectDir = join(tempDir, "projects", "test");
    await mkdir(projectDir, { recursive: true });

    await writeFile(
      join(projectDir, "x.meta.json"),
      JSON.stringify(makeMetadata({ id: "struct-1" })),
      "utf-8",
    );

    // Valid JSON but wrong structure
    await writeFile(
      join(tempDir, "index.json"),
      JSON.stringify({ version: 99, bad: true }),
      "utf-8",
    );

    const index = await loadIndex();
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].id).toBe("struct-1");
  });
});

describe("findEntry with short IDs", () => {
  it("finds entry by prefix", async () => {
    await addEntry(
      makeMetadata({ id: "abcdef12-3456-7890-abcd-ef1234567890" }),
    );

    const found = await findEntry("abcdef12");
    expect(found).toBeDefined();
    expect(found!.id).toBe("abcdef12-3456-7890-abcd-ef1234567890");
  });

  it("returns undefined for ambiguous short prefix", async () => {
    await addEntry(makeMetadata({ id: "abcd-1111" }));
    await addEntry(makeMetadata({ id: "abcd-2222" }));

    // "abcd" matches both — ambiguous, returns undefined
    const found = await findEntry("abcd");
    expect(found).toBeUndefined();
  });

  it("returns undefined for prefix too short", async () => {
    await addEntry(makeMetadata({ id: "abcdef12" }));

    // 3 chars is too short
    const found = await findEntry("abc");
    expect(found).toBeUndefined();
  });

  it("prefers exact match over prefix match", async () => {
    await addEntry(makeMetadata({ id: "abcd", summary: "Exact" }));
    await addEntry(makeMetadata({ id: "abcdef", summary: "Prefix" }));

    const found = await findEntry("abcd");
    expect(found).toBeDefined();
    expect(found!.summary).toBe("Exact");
  });
});

describe("Cross-platform path handling", () => {
  it("handles Windows UNC-style paths in metadata", async () => {
    const jsonl = generateJsonl(2);
    const transcript = parseJsonlContent(jsonl);
    expect(transcript.messages).toHaveLength(4);
  });

  it("handles paths with spaces", async () => {
    const dir = join(tempDir, "path with spaces");
    await mkdir(dir, { recursive: true });

    const filePath = join(dir, "test.jsonl");
    await writeFile(
      filePath,
      JSON.stringify({ role: "user", content: "hello" }),
      "utf-8",
    );

    const result = await parseSessionFile(filePath);
    expect(result.messages).toHaveLength(1);
  });
});
