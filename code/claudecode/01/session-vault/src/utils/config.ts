import { z } from "zod";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const RedactionRuleSchema = z.object({
  pattern: z.string(),
  replacement: z.string().default("[REDACTED]"),
});

export const ConfigSchema = z.object({
  auto_save: z.boolean().default(false),
  auto_save_min_messages: z.number().int().min(1).default(5),
  max_transcript_size_mb: z.number().positive().default(10),
  redaction_rules: z.array(RedactionRuleSchema).default([]),
  viewer_port: z.number().int().min(1024).max(65535).default(3777),
  default_export_format: z.enum(["md", "json", "html"]).default("md"),
});

export type Config = z.infer<typeof ConfigSchema>;
export type RedactionRule = z.infer<typeof RedactionRuleSchema>;

const DEFAULT_CONFIG: Config = {
  auto_save: false,
  auto_save_min_messages: 5,
  max_transcript_size_mb: 10,
  redaction_rules: [],
  viewer_port: 3777,
  default_export_format: "md",
};

export function getVaultDir(): string {
  return (
    process.env.VAULT_DIR ||
    join(process.env.HOME || process.env.USERPROFILE || homedir(), ".session-vault")
  );
}

export function getConfigPath(): string {
  return join(getVaultDir(), "config.json");
}

export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return ConfigSchema.parse(parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const vaultDir = getVaultDir();
  await mkdir(vaultDir, { recursive: true });
  const configPath = getConfigPath();
  const validated = ConfigSchema.parse(config);
  await writeFile(configPath, JSON.stringify(validated, null, 2), "utf-8");
}

export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG };
}
