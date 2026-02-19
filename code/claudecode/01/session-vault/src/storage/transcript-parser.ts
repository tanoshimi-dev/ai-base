import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import type { RedactionRule } from "../utils/config.js";

export interface ParsedMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ParsedTranscript {
  messages: ParsedMessage[];
  messageCount: number;
}

/**
 * Extract text content from a message's content field.
 * Claude Code JSONL messages can have content as a string or as an array
 * of content blocks (text, tool_use, tool_result, etc.).
 */
function extractTextContent(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const block of content) {
      if (typeof block === "string") {
        textParts.push(block);
      } else if (block && typeof block === "object" && "type" in block) {
        if (block.type === "text" && typeof block.text === "string") {
          textParts.push(block.text);
        }
      }
    }
    return textParts.length > 0 ? textParts.join("\n") : null;
  }
  return null;
}

/**
 * Unwrap a Claude Code JSONL entry to extract the message object.
 * Claude Code wraps messages like:
 *   {"type":"user","message":{"role":"user","content":"..."}, ...metadata}
 * This function returns the inner message if wrapped, or the entry itself
 * if it already has role/content at the top level.
 */
function unwrapEntry(entry: Record<string, unknown>): Record<string, unknown> {
  if (
    entry.message &&
    typeof entry.message === "object" &&
    !Array.isArray(entry.message) &&
    "role" in (entry.message as Record<string, unknown>)
  ) {
    return entry.message as Record<string, unknown>;
  }
  return entry;
}

/**
 * Parse a Claude Code .jsonl session file into structured messages.
 * Extracts only human and assistant text messages, skipping system
 * messages, tool calls, and other internal entries.
 *
 * Supports both formats:
 * - Bare messages: {"role":"user","content":"..."}
 * - Wrapped messages: {"type":"user","message":{"role":"user","content":"..."}}
 */
export function parseJsonlContent(jsonlContent: string): ParsedTranscript {
  const messages: ParsedMessage[] = [];
  const lines = jsonlContent.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const msg = unwrapEntry(entry);

    const role = msg.role as string | undefined;
    if (role !== "user" && role !== "assistant") {
      continue;
    }

    // Skip tool results (they appear as user messages with tool_result content)
    if (role === "user" && Array.isArray(msg.content)) {
      const hasOnlyToolResults = (msg.content as Array<{ type?: string }>).every(
        (block) => block && typeof block === "object" && block.type === "tool_result",
      );
      if (hasOnlyToolResults) {
        continue;
      }
    }

    const text = extractTextContent(msg.content);
    if (!text || !text.trim()) {
      continue;
    }

    messages.push({
      role: role as "user" | "assistant",
      content: text.trim(),
    });
  }

  return { messages, messageCount: messages.length };
}

/**
 * Parse a line of JSONL into a message, or return null if not a valid message.
 */
function parseLine(line: string): ParsedMessage | null {
  if (!line.trim()) return null;

  let entry: Record<string, unknown>;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }

  const msg = unwrapEntry(entry);

  const role = msg.role as string | undefined;
  if (role !== "user" && role !== "assistant") return null;

  if (role === "user" && Array.isArray(msg.content)) {
    const hasOnlyToolResults = (msg.content as Array<{ type?: string }>).every(
      (block) => block && typeof block === "object" && block.type === "tool_result",
    );
    if (hasOnlyToolResults) return null;
  }

  const text = extractTextContent(msg.content);
  if (!text || !text.trim()) return null;

  return { role: role as "user" | "assistant", content: text.trim() };
}

/**
 * Stream-parse a large .jsonl file line-by-line to avoid loading it entirely into memory.
 */
export async function parseSessionFileStreaming(
  filePath: string,
): Promise<ParsedTranscript> {
  const messages: ParsedMessage[] = [];

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const msg = parseLine(line);
    if (msg) messages.push(msg);
  }

  return { messages, messageCount: messages.length };
}

/**
 * Read and parse a Claude Code .jsonl session file from disk.
 * Uses streaming for files larger than maxSizeMb to avoid memory issues.
 */
export async function parseSessionFile(
  filePath: string,
  maxSizeMb: number = 10,
): Promise<ParsedTranscript> {
  const fileInfo = await stat(filePath);
  const sizeMb = fileInfo.size / (1024 * 1024);

  if (sizeMb > maxSizeMb) {
    throw new TranscriptTooLargeError(filePath, sizeMb, maxSizeMb);
  }

  // Use streaming for files > 5 MB to reduce memory pressure
  if (sizeMb > 5) {
    return parseSessionFileStreaming(filePath);
  }

  const content = await readFile(filePath, "utf-8");
  return parseJsonlContent(content);
}

/**
 * Error thrown when a transcript exceeds the configured size limit.
 */
export class TranscriptTooLargeError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly sizeMb: number,
    public readonly maxSizeMb: number,
  ) {
    super(
      `Transcript too large: ${sizeMb.toFixed(1)} MB exceeds the ${maxSizeMb} MB limit. ` +
      `Increase max_transcript_size_mb in your vault config, or save a shorter session.`,
    );
    this.name = "TranscriptTooLargeError";
  }
}

/**
 * Apply redaction rules to text content.
 */
export function applyRedactions(
  text: string,
  rules: RedactionRule[],
): string {
  let result = text;
  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, "g");
    result = result.replace(regex, rule.replacement);
  }
  return result;
}

/**
 * Convert parsed messages to clean Markdown transcript format.
 */
export function toMarkdown(
  transcript: ParsedTranscript,
  metadata: {
    title?: string;
    date?: string;
    project?: string;
    branch?: string;
    tags?: string[];
  },
  redactionRules: RedactionRule[] = [],
): string {
  const lines: string[] = [];

  // Header
  const title = metadata.title || "Untitled Session";
  lines.push(`# Session: ${title}`);
  lines.push("");

  if (metadata.date) {
    lines.push(`**Date:** ${metadata.date}`);
  }
  if (metadata.project) {
    lines.push(`**Project:** ${metadata.project}`);
  }
  if (metadata.branch) {
    lines.push(`**Branch:** ${metadata.branch}`);
  }
  if (metadata.tags && metadata.tags.length > 0) {
    lines.push(`**Tags:** ${metadata.tags.join(", ")}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  // Messages
  for (const msg of transcript.messages) {
    const roleLabel = msg.role === "user" ? "User" : "Claude";
    let content = msg.content;

    if (redactionRules.length > 0) {
      content = applyRedactions(content, redactionRules);
    }

    lines.push(`## ${roleLabel}`);
    lines.push(content);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate a brief auto-summary from the transcript.
 * Uses the first user message as the summary.
 */
export function generateSummary(transcript: ParsedTranscript): string {
  const firstUserMsg = transcript.messages.find((m) => m.role === "user");
  if (!firstUserMsg) {
    return "Empty conversation";
  }

  const text = firstUserMsg.content;
  // Truncate to ~120 chars at a word boundary
  if (text.length <= 120) {
    return text.replace(/\n/g, " ");
  }
  const truncated = text.slice(0, 120);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated).replace(/\n/g, " ") + "...";
}
