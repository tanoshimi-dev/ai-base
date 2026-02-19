/**
 * Integration tests for the MCP tools lifecycle:
 * save → list → search → get → export → delete
 *
 * These tests exercise the tool handler functions directly by calling
 * the same storage layer the tools use, validating the full data flow.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseJsonlContent,
  toMarkdown,
  generateSummary,
} from "../../src/storage/transcript-parser.js";
import { saveTranscript, readTranscript, deleteEntry } from "../../src/storage/vault.js";
import {
  loadIndex,
  addEntry,
  removeEntry,
  findEntry,
} from "../../src/storage/index-manager.js";

let tempDir: string;
let sessionDir: string;

const SAMPLE_JSONL = [
  JSON.stringify({ role: "user", content: "How do I implement JWT auth in Express?" }),
  JSON.stringify({
    role: "assistant",
    content: [
      {
        type: "text",
        text: "I decided to use the `jsonwebtoken` package because it's the most popular approach. Here's the implementation:\n\n```javascript\nconst jwt = require('jsonwebtoken');\n\nfunction authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) return res.status(401).json({ error: 'No token' });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch (err) {\n    res.status(403).json({ error: 'Invalid token' });\n  }\n}\n```",
      },
    ],
  }),
  JSON.stringify({
    role: "user",
    content: "I'm getting an error: TypeError: Cannot read property 'split' of undefined",
  }),
  JSON.stringify({
    role: "assistant",
    content:
      "The error occurs because `req.headers.authorization` is undefined. You need to fix the optional chaining. The issue is fixed in the code above with `?.split`. Make sure your client sends the Authorization header.",
  }),
].join("\n");

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-lifecycle-"));
  sessionDir = join(tempDir, "sessions");
  await mkdir(sessionDir, { recursive: true });
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("Full lifecycle: save → list → search → get → delete", () => {
  it("completes full CRUD cycle", async () => {
    // --- SAVE ---
    const sessionFile = join(sessionDir, "session.jsonl");
    await writeFile(sessionFile, SAMPLE_JSONL, "utf-8");

    const transcript = parseJsonlContent(SAMPLE_JSONL);
    expect(transcript.messages.length).toBe(4);

    const summary = generateSummary(transcript);
    expect(summary).toContain("JWT");

    const markdown = toMarkdown(transcript, {
      title: summary.slice(0, 60),
      date: new Date().toISOString(),
      project: "my-app",
      branch: "main",
      tags: ["auth", "jwt"],
    });

    const metadata = await saveTranscript(markdown, {
      projectPath: "/home/user/my-app",
      sessionId: "test-session-1",
      gitBranch: "main",
      gitCommit: "abc1234",
      tags: ["auth", "jwt"],
      note: "JWT auth implementation",
      summary,
      messageCount: transcript.messageCount,
      source: "manual",
    });

    await addEntry(metadata);

    expect(metadata.id).toBeTruthy();
    expect(metadata.project).toBe("my-app");
    expect(metadata.tags).toEqual(["auth", "jwt"]);

    // --- LIST ---
    const index = await loadIndex();
    expect(index.entries.length).toBe(1);
    expect(index.entries[0].id).toBe(metadata.id);
    expect(index.entries[0].summary).toContain("JWT");

    // --- SEARCH (metadata match) ---
    const entry = index.entries.find((e) =>
      e.summary.toLowerCase().includes("jwt"),
    );
    expect(entry).toBeDefined();
    expect(entry!.id).toBe(metadata.id);

    // --- GET ---
    const found = await findEntry(metadata.id);
    expect(found).toBeDefined();

    const content = await readTranscript({
      project_path: found!.project_path,
      transcript_file: found!.transcript_file,
    });
    expect(content).toContain("## User");
    expect(content).toContain("## Claude");
    expect(content).toContain("JWT");

    // --- DELETE ---
    await deleteEntry({
      project_path: found!.project_path,
      transcript_file: found!.transcript_file,
      metadata_file: found!.metadata_file,
    });
    await removeEntry(metadata.id);

    const afterDelete = await loadIndex();
    expect(afterDelete.entries.length).toBe(0);
  });

  it("handles multiple saves and filtering", async () => {
    // Save two conversations with different tags/projects
    const t1 = parseJsonlContent(
      JSON.stringify({ role: "user", content: "Fix login bug" }) +
        "\n" +
        JSON.stringify({ role: "assistant", content: "Fixed the login bug by checking session." }),
    );
    const t2 = parseJsonlContent(
      JSON.stringify({ role: "user", content: "Add dark mode to settings" }) +
        "\n" +
        JSON.stringify({ role: "assistant", content: "Added dark mode toggle." }),
    );

    const m1 = await saveTranscript(
      toMarkdown(t1, { title: "Fix login", project: "frontend" }),
      {
        projectPath: "/home/user/frontend",
        sessionId: "s1",
        tags: ["bugfix"],
        summary: "Fix login bug",
        messageCount: 2,
      },
    );
    await addEntry(m1);

    const m2 = await saveTranscript(
      toMarkdown(t2, { title: "Dark mode", project: "frontend" }),
      {
        projectPath: "/home/user/frontend",
        sessionId: "s2",
        tags: ["feature", "ui"],
        summary: "Add dark mode to settings",
        messageCount: 2,
      },
    );
    await addEntry(m2);

    const index = await loadIndex();
    expect(index.entries.length).toBe(2);

    // Filter by tag
    const bugfixes = index.entries.filter((e) => e.tags.includes("bugfix"));
    expect(bugfixes.length).toBe(1);
    expect(bugfixes[0].summary).toContain("login");

    const features = index.entries.filter((e) => e.tags.includes("feature"));
    expect(features.length).toBe(1);
    expect(features[0].summary).toContain("dark mode");
  });
});

describe("Edge cases", () => {
  it("handles empty session (no messages)", () => {
    const transcript = parseJsonlContent("");
    expect(transcript.messages.length).toBe(0);
    expect(transcript.messageCount).toBe(0);

    const summary = generateSummary(transcript);
    expect(summary).toBe("Empty conversation");
  });

  it("handles session with only system messages", () => {
    const jsonl = JSON.stringify({
      role: "system",
      content: "You are a helpful assistant.",
    });
    const transcript = parseJsonlContent(jsonl);
    expect(transcript.messages.length).toBe(0);
  });

  it("handles session with only tool results", () => {
    const jsonl = JSON.stringify({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "123", content: "OK" }],
    });
    const transcript = parseJsonlContent(jsonl);
    expect(transcript.messages.length).toBe(0);
  });

  it("handles Windows-style project paths", async () => {
    const transcript = parseJsonlContent(
      JSON.stringify({ role: "user", content: "hello" }) +
        "\n" +
        JSON.stringify({ role: "assistant", content: "hi" }),
    );
    const md = toMarkdown(transcript, { title: "test" });

    const metadata = await saveTranscript(md, {
      projectPath: "C:\\Users\\dev\\my-project",
      sessionId: "win-session",
      summary: "Windows test",
      messageCount: 2,
    });
    await addEntry(metadata);

    const found = await findEntry(metadata.id);
    expect(found).toBeDefined();
    expect(found!.project).toBe("my-project");

    const content = await readTranscript({
      project_path: found!.project_path,
      transcript_file: found!.transcript_file,
    });
    expect(content).toContain("hello");
  });
});
