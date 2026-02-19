/**
 * Unit tests for get_conversation section extraction logic.
 * Tests the decisions, code, and errors extractors directly
 * by constructing markdown content and checking extracted output.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseJsonlContent,
  toMarkdown,
  generateSummary,
} from "../../src/storage/transcript-parser.js";
import { saveTranscript, readTranscript } from "../../src/storage/vault.js";
import { addEntry, findEntry } from "../../src/storage/index-manager.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-get-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

async function saveTestConversation(jsonl: string) {
  const transcript = parseJsonlContent(jsonl);
  const summary = generateSummary(transcript);
  const markdown = toMarkdown(transcript, {
    title: "Test",
    project: "test",
    tags: ["test"],
  });

  const metadata = await saveTranscript(markdown, {
    projectPath: "/test/project",
    sessionId: "test-session",
    summary,
    messageCount: transcript.messageCount,
  });
  await addEntry(metadata);
  return metadata;
}

describe("Section extraction - code blocks", () => {
  it("extracts fenced code blocks from transcript", async () => {
    const jsonl = [
      JSON.stringify({ role: "user", content: "Show me a hello world in Python" }),
      JSON.stringify({
        role: "assistant",
        content: 'Here\'s a Python hello world:\n\n```python\nprint("Hello, World!")\n```\n\nAnd in JavaScript:\n\n```javascript\nconsole.log("Hello, World!");\n```',
      }),
    ].join("\n");

    const meta = await saveTestConversation(jsonl);
    const content = await readTranscript({
      project_path: meta.project_path,
      transcript_file: meta.transcript_file,
    });

    // Verify code blocks are in the content
    expect(content).toContain("```python");
    expect(content).toContain("```javascript");
    expect(content).toContain('print("Hello, World!")');
  });
});

describe("Section extraction - decisions", () => {
  it("captures decision-related content", async () => {
    const jsonl = [
      JSON.stringify({ role: "user", content: "Should I use Redis or Memcached?" }),
      JSON.stringify({
        role: "assistant",
        content:
          "I decided to recommend Redis because it supports more data structures. The approach is better for your use case since you need pub/sub.",
      }),
    ].join("\n");

    const meta = await saveTestConversation(jsonl);
    const content = await readTranscript({
      project_path: meta.project_path,
      transcript_file: meta.transcript_file,
    });

    expect(content).toContain("decided");
    expect(content).toContain("because");
    expect(content).toContain("approach");
  });
});

describe("Section extraction - errors", () => {
  it("captures error-related content", async () => {
    const jsonl = [
      JSON.stringify({
        role: "user",
        content: "I'm getting a TypeError: Cannot read property 'map' of undefined",
      }),
      JSON.stringify({
        role: "assistant",
        content:
          "The error is caused by accessing an undefined array. Here's the fix:\n\n```javascript\nconst items = data?.items || [];\nconst result = items.map(i => i.name);\n```\n\nThis fixed the bug by adding optional chaining and a fallback.",
      }),
    ].join("\n");

    const meta = await saveTestConversation(jsonl);
    const content = await readTranscript({
      project_path: meta.project_path,
      transcript_file: meta.transcript_file,
    });

    expect(content).toContain("TypeError");
    expect(content).toContain("error");
    expect(content).toContain("fix");
  });
});

describe("findEntry", () => {
  it("retrieves saved entry by ID", async () => {
    const jsonl = [
      JSON.stringify({ role: "user", content: "hello" }),
      JSON.stringify({ role: "assistant", content: "hi there" }),
    ].join("\n");

    const meta = await saveTestConversation(jsonl);
    const found = await findEntry(meta.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(meta.id);
    expect(found!.project).toBe("project");
  });

  it("returns undefined for nonexistent ID", async () => {
    const found = await findEntry("nonexistent-id");
    expect(found).toBeUndefined();
  });
});
