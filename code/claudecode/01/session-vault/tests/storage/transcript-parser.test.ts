import { describe, it, expect } from "vitest";
import {
  parseJsonlContent,
  toMarkdown,
  generateSummary,
  applyRedactions,
} from "../../src/storage/transcript-parser.js";

const SAMPLE_JSONL = [
  JSON.stringify({
    role: "system",
    content: "You are Claude, an AI assistant.",
  }),
  JSON.stringify({
    role: "user",
    content: "How do I fix a segfault in my C program?",
  }),
  JSON.stringify({
    role: "assistant",
    content:
      "A segfault typically occurs when your program accesses memory it shouldn't. Here are common causes:\n\n1. Dereferencing a null pointer\n2. Buffer overflow\n3. Using freed memory",
  }),
  JSON.stringify({
    role: "user",
    content: [
      { type: "tool_result", tool_use_id: "123", content: "OK" },
    ],
  }),
  JSON.stringify({
    role: "user",
    content: "Thanks! Can you show me how to use valgrind?",
  }),
  JSON.stringify({
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Sure! Run `valgrind ./your_program` to check for memory errors.",
      },
    ],
  }),
].join("\n");

// Real Claude Code wrapped format — messages nested inside a "message" field
const WRAPPED_JSONL = [
  JSON.stringify({
    type: "file-history-snapshot",
    messageId: "snap-001",
    snapshot: { messageId: "snap-001", trackedFileBackups: {}, timestamp: "2026-02-19T06:57:12.364Z" },
    isSnapshotUpdate: false,
  }),
  JSON.stringify({
    parentUuid: null,
    isSidechain: false,
    userType: "external",
    cwd: "E:\\dev\\project",
    sessionId: "abc-123",
    version: "2.1.47",
    gitBranch: "main",
    type: "user",
    message: { role: "user", content: "How do I fix a segfault?" },
  }),
  JSON.stringify({
    parentUuid: "msg-001",
    isSidechain: false,
    type: "assistant",
    message: {
      role: "assistant",
      content: "A segfault occurs when accessing invalid memory.",
    },
  }),
  JSON.stringify({
    parentUuid: "msg-002",
    isSidechain: false,
    type: "user",
    message: {
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tool-1", content: "OK" }],
    },
  }),
  JSON.stringify({
    parentUuid: "msg-003",
    isSidechain: false,
    type: "user",
    message: { role: "user", content: "Thanks, can you show me valgrind?" },
  }),
  JSON.stringify({
    parentUuid: "msg-004",
    isSidechain: false,
    type: "assistant",
    message: {
      role: "assistant",
      content: [{ type: "text", text: "Run `valgrind ./your_program` to check for errors." }],
    },
  }),
].join("\n");

describe("parseJsonlContent", () => {
  it("parses user and assistant messages", () => {
    const result = parseJsonlContent(SAMPLE_JSONL);
    expect(result.messages).toHaveLength(4);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[1].role).toBe("assistant");
  });

  it("skips system messages", () => {
    const result = parseJsonlContent(SAMPLE_JSONL);
    const systemMessages = result.messages.filter(
      (m) => (m as { role: string }).role === "system",
    );
    expect(systemMessages).toHaveLength(0);
  });

  it("skips tool_result-only user messages", () => {
    const result = parseJsonlContent(SAMPLE_JSONL);
    // The tool_result message should be skipped, so we should have 2 user messages
    const userMessages = result.messages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0].content).toContain("segfault");
    expect(userMessages[1].content).toContain("valgrind");
  });

  it("extracts text from content block arrays", () => {
    const result = parseJsonlContent(SAMPLE_JSONL);
    const lastAssistant = result.messages.filter(
      (m) => m.role === "assistant",
    );
    expect(lastAssistant[1].content).toContain("valgrind");
  });

  it("handles empty input", () => {
    const result = parseJsonlContent("");
    expect(result.messages).toHaveLength(0);
    expect(result.messageCount).toBe(0);
  });

  it("handles invalid JSON lines gracefully", () => {
    const input = [
      "not valid json",
      JSON.stringify({ role: "user", content: "hello" }),
      "also invalid {{{",
    ].join("\n");
    const result = parseJsonlContent(input);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe("hello");
  });
});

describe("parseJsonlContent — wrapped Claude Code format", () => {
  it("parses wrapped user and assistant messages", () => {
    const result = parseJsonlContent(WRAPPED_JSONL);
    expect(result.messages).toHaveLength(4);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toContain("segfault");
    expect(result.messages[1].role).toBe("assistant");
    expect(result.messages[1].content).toContain("invalid memory");
  });

  it("skips file-history-snapshot and other non-message lines", () => {
    const result = parseJsonlContent(WRAPPED_JSONL);
    // Should only have 4 real messages, not the snapshot
    expect(result.messageCount).toBe(4);
  });

  it("skips wrapped tool_result-only user messages", () => {
    const result = parseJsonlContent(WRAPPED_JSONL);
    const userMessages = result.messages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0].content).toContain("segfault");
    expect(userMessages[1].content).toContain("valgrind");
  });

  it("extracts text from wrapped content block arrays", () => {
    const result = parseJsonlContent(WRAPPED_JSONL);
    const assistants = result.messages.filter((m) => m.role === "assistant");
    expect(assistants[1].content).toContain("valgrind");
  });
});

describe("toMarkdown", () => {
  it("generates valid markdown with header and messages", () => {
    const transcript = parseJsonlContent(SAMPLE_JSONL);
    const md = toMarkdown(transcript, {
      title: "Debug Segfault",
      date: "2026-02-19 12:00 UTC",
      project: "my-app",
      branch: "main",
      tags: ["debug", "c"],
    });

    expect(md).toContain("# Session: Debug Segfault");
    expect(md).toContain("**Date:** 2026-02-19 12:00 UTC");
    expect(md).toContain("**Project:** my-app");
    expect(md).toContain("**Branch:** main");
    expect(md).toContain("**Tags:** debug, c");
    expect(md).toContain("## User");
    expect(md).toContain("## Claude");
    expect(md).toContain("segfault");
  });

  it("applies redaction rules", () => {
    const transcript = parseJsonlContent(
      JSON.stringify({ role: "user", content: "My API key is sk-abc123xyz" }),
    );
    const md = toMarkdown(transcript, { title: "Test" }, [
      { pattern: "sk-[a-zA-Z0-9]+", replacement: "[API_KEY_REDACTED]" },
    ]);
    expect(md).not.toContain("sk-abc123xyz");
    expect(md).toContain("[API_KEY_REDACTED]");
  });
});

describe("generateSummary", () => {
  it("uses first user message as summary", () => {
    const transcript = parseJsonlContent(SAMPLE_JSONL);
    const summary = generateSummary(transcript);
    expect(summary).toContain("segfault");
  });

  it("truncates long messages", () => {
    const longMessage = "a".repeat(200);
    const transcript = parseJsonlContent(
      JSON.stringify({ role: "user", content: longMessage }),
    );
    const summary = generateSummary(transcript);
    expect(summary.length).toBeLessThanOrEqual(124); // 120 + "..."
  });

  it("returns default for empty transcript", () => {
    const transcript = parseJsonlContent("");
    const summary = generateSummary(transcript);
    expect(summary).toBe("Empty conversation");
  });
});

describe("applyRedactions", () => {
  it("applies multiple rules", () => {
    const text = "password=secret123 and token=abc456";
    const result = applyRedactions(text, [
      { pattern: "password=[^ ]+", replacement: "password=[REDACTED]" },
      { pattern: "token=[^ ]+", replacement: "token=[REDACTED]" },
    ]);
    expect(result).toBe("password=[REDACTED] and token=[REDACTED]");
  });

  it("returns original text when no rules", () => {
    expect(applyRedactions("hello", [])).toBe("hello");
  });
});
