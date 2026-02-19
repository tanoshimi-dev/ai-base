import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getVaultDir } from "../utils/config.js";
import { pathToSlug, projectName } from "../utils/slug.js";

export interface ConversationMetadata {
  id: string;
  project: string;
  project_path: string;
  session_id: string;
  created_at: string;
  saved_at: string;
  git_branch: string | null;
  git_commit: string | null;
  tags: string[];
  note: string;
  summary: string;
  message_count: number;
  source: "manual" | "auto";
  transcript_file: string;
  metadata_file: string;
}

/**
 * Ensure the vault directory exists for a given project path.
 * Returns the project-specific vault directory.
 */
export async function ensureVaultDir(projectPath: string): Promise<string> {
  const slug = pathToSlug(projectPath);
  const dir = join(getVaultDir(), "projects", slug);
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Generate a unique filename prefix based on date and short ID.
 */
function generateFilePrefix(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const shortId = randomUUID().slice(0, 8);
  return `${date}_${shortId}`;
}

/**
 * Save a transcript and its metadata to the vault.
 * Returns the full metadata object for the saved entry.
 */
export async function saveTranscript(
  markdown: string,
  opts: {
    projectPath: string;
    sessionId: string;
    createdAt?: string;
    gitBranch?: string | null;
    gitCommit?: string | null;
    tags?: string[];
    note?: string;
    summary: string;
    messageCount: number;
    source?: "manual" | "auto";
  },
): Promise<ConversationMetadata> {
  const dir = await ensureVaultDir(opts.projectPath);
  const prefix = generateFilePrefix();
  const transcriptFile = `${prefix}.md`;
  const metadataFile = `${prefix}.meta.json`;
  const id = randomUUID();

  const metadata: ConversationMetadata = {
    id,
    project: projectName(opts.projectPath),
    project_path: opts.projectPath,
    session_id: opts.sessionId,
    created_at: opts.createdAt || new Date().toISOString(),
    saved_at: new Date().toISOString(),
    git_branch: opts.gitBranch ?? null,
    git_commit: opts.gitCommit ?? null,
    tags: opts.tags || [],
    note: opts.note || "",
    summary: opts.summary,
    message_count: opts.messageCount,
    source: opts.source || "manual",
    transcript_file: transcriptFile,
    metadata_file: metadataFile,
  };

  await writeFile(join(dir, transcriptFile), markdown, "utf-8");
  await writeFile(
    join(dir, metadataFile),
    JSON.stringify(metadata, null, 2),
    "utf-8",
  );

  return metadata;
}

/**
 * Read a transcript markdown file by metadata.
 */
export async function readTranscript(
  metadata: Pick<ConversationMetadata, "project_path" | "transcript_file">,
): Promise<string> {
  const slug = pathToSlug(metadata.project_path);
  const filePath = join(
    getVaultDir(),
    "projects",
    slug,
    metadata.transcript_file,
  );
  return readFile(filePath, "utf-8");
}

/**
 * Read metadata JSON file by project path and metadata filename.
 */
export async function readMetadata(
  projectPath: string,
  metadataFile: string,
): Promise<ConversationMetadata> {
  const slug = pathToSlug(projectPath);
  const filePath = join(getVaultDir(), "projects", slug, metadataFile);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as ConversationMetadata;
}

/**
 * Delete a conversation entry (both transcript and metadata files).
 */
export async function deleteEntry(
  metadata: Pick<
    ConversationMetadata,
    "project_path" | "transcript_file" | "metadata_file"
  >,
): Promise<void> {
  const slug = pathToSlug(metadata.project_path);
  const dir = join(getVaultDir(), "projects", slug);

  await rm(join(dir, metadata.transcript_file), { force: true });
  await rm(join(dir, metadata.metadata_file), { force: true });
}
