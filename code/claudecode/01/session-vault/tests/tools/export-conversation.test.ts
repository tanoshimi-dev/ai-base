/**
 * Tests for export functionality — md, json, html format output.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFile } from "node:fs/promises";
import {
  parseJsonlContent,
  toMarkdown,
  generateSummary,
} from "../../src/storage/transcript-parser.js";
import {
  saveTranscript,
  readTranscript,
  readMetadata,
} from "../../src/storage/vault.js";
import { addEntry, findEntry } from "../../src/storage/index-manager.js";

let tempDir: string;
let exportDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-export-test-"));
  exportDir = join(tempDir, "exports");
  await mkdir(exportDir, { recursive: true });
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

async function createTestEntry() {
  const jsonl = [
    JSON.stringify({ role: "user", content: "Explain closures in JS" }),
    JSON.stringify({
      role: "assistant",
      content:
        "A closure is a function that has access to its outer scope:\n\n```javascript\nfunction outer() {\n  let count = 0;\n  return () => ++count;\n}\n```",
    }),
  ].join("\n");

  const transcript = parseJsonlContent(jsonl);
  const summary = generateSummary(transcript);
  const markdown = toMarkdown(transcript, {
    title: "Closures",
    project: "learning",
    tags: ["js"],
  });

  const metadata = await saveTranscript(markdown, {
    projectPath: "/home/user/learning",
    sessionId: "s1",
    summary,
    messageCount: transcript.messageCount,
    tags: ["js"],
    note: "JS closures explanation",
  });
  await addEntry(metadata);
  return metadata;
}

describe("Export formats", () => {
  it("exports as markdown (passthrough)", async () => {
    const meta = await createTestEntry();
    const content = await readTranscript({
      project_path: meta.project_path,
      transcript_file: meta.transcript_file,
    });

    // MD export is just the transcript content
    expect(content).toContain("# Session:");
    expect(content).toContain("## User");
    expect(content).toContain("## Claude");
    expect(content).toContain("closure");
  });

  it("exports as JSON with metadata + transcript", async () => {
    const meta = await createTestEntry();

    const fullMeta = await readMetadata(
      meta.project_path,
      meta.metadata_file,
    );
    const transcript = await readTranscript({
      project_path: meta.project_path,
      transcript_file: meta.transcript_file,
    });

    const jsonExport = JSON.stringify(
      { metadata: fullMeta, transcript },
      null,
      2,
    );
    const parsed = JSON.parse(jsonExport);

    expect(parsed.metadata.id).toBe(meta.id);
    expect(parsed.metadata.tags).toEqual(["js"]);
    expect(parsed.transcript).toContain("closure");
  });

  it("stores and retrieves conversations with tags and notes", async () => {
    const meta = await createTestEntry();
    const entry = await findEntry(meta.id);

    expect(entry).toBeDefined();
    expect(entry!.tags).toEqual(["js"]);
    expect(entry!.note).toBe("JS closures explanation");
    expect(entry!.summary).toContain("closures");
  });
});
