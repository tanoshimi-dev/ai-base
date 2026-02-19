import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { getVaultDir } from "../utils/config.js";
import type { ConversationMetadata } from "./vault.js";

export interface IndexEntry {
  id: string;
  project: string;
  project_path: string;
  summary: string;
  tags: string[];
  note: string;
  saved_at: string;
  message_count: number;
  source: "manual" | "auto";
  transcript_file: string;
  metadata_file: string;
}

export interface VaultIndex {
  version: number;
  entries: IndexEntry[];
}

function getIndexPath(): string {
  return join(getVaultDir(), "index.json");
}

function toIndexEntry(meta: ConversationMetadata): IndexEntry {
  return {
    id: meta.id,
    project: meta.project,
    project_path: meta.project_path,
    summary: meta.summary,
    tags: meta.tags,
    note: meta.note,
    saved_at: meta.saved_at,
    message_count: meta.message_count,
    source: meta.source,
    transcript_file: meta.transcript_file,
    metadata_file: meta.metadata_file,
  };
}

/**
 * Load the vault index from disk.
 * Returns an empty index if the file doesn't exist or is corrupted.
 */
export async function loadIndex(): Promise<VaultIndex> {
  try {
    const raw = await readFile(getIndexPath(), "utf-8");
    const parsed = JSON.parse(raw) as VaultIndex;
    if (parsed.version === 1 && Array.isArray(parsed.entries)) {
      return parsed;
    }
    return { version: 1, entries: [] };
  } catch {
    return { version: 1, entries: [] };
  }
}

/**
 * Save the vault index to disk.
 */
async function saveIndex(index: VaultIndex): Promise<void> {
  const vaultDir = getVaultDir();
  await mkdir(vaultDir, { recursive: true });
  await writeFile(getIndexPath(), JSON.stringify(index, null, 2), "utf-8");
}

/**
 * Add a new entry to the index.
 */
export async function addEntry(
  metadata: ConversationMetadata,
): Promise<void> {
  const index = await loadIndex();
  index.entries.push(toIndexEntry(metadata));
  await saveIndex(index);
}

/**
 * Remove an entry from the index by ID.
 * Returns true if the entry was found and removed.
 */
export async function removeEntry(id: string): Promise<boolean> {
  const index = await loadIndex();
  const before = index.entries.length;
  index.entries = index.entries.filter((e) => e.id !== id);
  if (index.entries.length === before) {
    return false;
  }
  await saveIndex(index);
  return true;
}

/**
 * Rebuild the entire index by scanning all .meta.json files in the vault.
 * Useful for recovery if index.json is corrupted or missing.
 */
export async function rebuildIndex(): Promise<VaultIndex> {
  const vaultDir = getVaultDir();
  const projectsDir = join(vaultDir, "projects");
  const entries: IndexEntry[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(projectsDir);
  } catch {
    // No projects directory — return empty index
    const index: VaultIndex = { version: 1, entries: [] };
    await saveIndex(index);
    return index;
  }

  for (const slug of projectDirs) {
    const slugDir = join(projectsDir, slug);
    let files: string[];
    try {
      files = await readdir(slugDir);
    } catch {
      continue;
    }

    const metaFiles = files.filter((f) => f.endsWith(".meta.json"));
    for (const metaFile of metaFiles) {
      try {
        const raw = await readFile(join(slugDir, metaFile), "utf-8");
        const meta = JSON.parse(raw) as ConversationMetadata;
        entries.push(toIndexEntry(meta));
      } catch {
        // Skip corrupted metadata files
        continue;
      }
    }
  }

  // Sort by saved_at descending
  entries.sort(
    (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
  );

  const index: VaultIndex = { version: 1, entries };
  await saveIndex(index);
  return index;
}

/**
 * Find an entry in the index by ID.
 */
export async function findEntry(
  id: string,
): Promise<IndexEntry | undefined> {
  const index = await loadIndex();
  return index.entries.find((e) => e.id === id);
}
