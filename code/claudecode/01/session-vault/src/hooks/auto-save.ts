// SessionEnd hook — auto-save conversation to vault
//
// Receives JSON on stdin from Claude Code:
//   { session_id, transcript_path, cwd, hook_event_name, reason, ... }
//
// Exit 0 on success, 1 on skip (disabled / below threshold / error).

import { loadConfig } from "../utils/config.js";
import {
  parseSessionFile,
  toMarkdown,
  generateSummary,
} from "../storage/transcript-parser.js";
import { saveTranscript } from "../storage/vault.js";
import { addEntry } from "../storage/index-manager.js";
import { getCurrentBranch, getCurrentCommit } from "../utils/git.js";
import { projectName } from "../utils/slug.js";
import { stat } from "node:fs/promises";

interface SessionEndInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
  hook_event_name: string;
  reason?: string;
}

/**
 * Read all data from stdin and return as a string.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  // 1. Read and parse stdin
  const raw = await readStdin();
  if (!raw.trim()) {
    console.error("auto-save: no input on stdin");
    process.exit(1);
  }

  let input: SessionEndInput;
  try {
    input = JSON.parse(raw) as SessionEndInput;
  } catch {
    console.error("auto-save: failed to parse stdin as JSON");
    process.exit(1);
  }

  // 2. Load config and check if auto-save is enabled
  const config = await loadConfig();
  if (!config.auto_save) {
    process.exit(1);
  }

  // 3. Validate transcript path exists
  const transcriptPath = input.transcript_path;
  if (!transcriptPath) {
    console.error("auto-save: no transcript_path in input");
    process.exit(1);
  }

  try {
    await stat(transcriptPath);
  } catch {
    console.error(`auto-save: transcript not found: ${transcriptPath}`);
    process.exit(1);
  }

  // 4. Parse the transcript (respects max_transcript_size_mb)
  const transcript = await parseSessionFile(
    transcriptPath,
    config.max_transcript_size_mb,
  );
  if (transcript.messages.length === 0) {
    process.exit(1);
  }

  // 5. Check minimum message threshold
  if (transcript.messageCount < config.auto_save_min_messages) {
    process.exit(1);
  }

  // 6. Collect git metadata
  const projectPath = input.cwd;
  const [gitBranch, gitCommit] = await Promise.all([
    getCurrentBranch(projectPath),
    getCurrentCommit(projectPath),
  ]);

  // 7. Generate summary and markdown
  const summary = generateSummary(transcript);
  const project = projectName(projectPath);
  const markdown = toMarkdown(
    transcript,
    {
      title: summary.slice(0, 60),
      date: new Date().toISOString(),
      project,
      branch: gitBranch ?? undefined,
      tags: ["auto"],
    },
    config.redaction_rules,
  );

  // 8. Save to vault
  const metadata = await saveTranscript(markdown, {
    projectPath,
    sessionId: input.session_id || "unknown",
    gitBranch,
    gitCommit,
    tags: ["auto"],
    note: "Auto-saved on session end",
    summary,
    messageCount: transcript.messageCount,
    source: "auto",
  });

  // 9. Update index
  await addEntry(metadata);
}

main().catch((error) => {
  console.error(
    `auto-save: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
