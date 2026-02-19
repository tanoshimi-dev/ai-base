import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  loadConfig,
  saveConfig,
  getDefaultConfig,
  ConfigSchema,
} from "../../src/utils/config.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "session-vault-config-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("getDefaultConfig", () => {
  it("returns sensible defaults", () => {
    const config = getDefaultConfig();
    expect(config.auto_save).toBe(false);
    expect(config.auto_save_min_messages).toBe(5);
    expect(config.max_transcript_size_mb).toBe(10);
    expect(config.redaction_rules).toEqual([]);
    expect(config.viewer_port).toBe(3777);
    expect(config.default_export_format).toBe("md");
  });
});

describe("loadConfig", () => {
  it("returns defaults when no config file exists", async () => {
    const config = await loadConfig();
    expect(config.auto_save).toBe(false);
    expect(config.viewer_port).toBe(3777);
  });

  it("loads config from file", async () => {
    await writeFile(
      join(tempDir, "config.json"),
      JSON.stringify({ auto_save: true, viewer_port: 4000 }),
      "utf-8",
    );

    const config = await loadConfig();
    expect(config.auto_save).toBe(true);
    expect(config.viewer_port).toBe(4000);
  });

  it("returns defaults for corrupted config", async () => {
    await writeFile(join(tempDir, "config.json"), "not json {{{", "utf-8");

    const config = await loadConfig();
    expect(config.auto_save).toBe(false);
  });
});

describe("saveConfig", () => {
  it("saves and round-trips config", async () => {
    const config = getDefaultConfig();
    config.auto_save = true;
    config.viewer_port = 5000;

    await saveConfig(config);
    const loaded = await loadConfig();

    expect(loaded.auto_save).toBe(true);
    expect(loaded.viewer_port).toBe(5000);
  });
});

describe("ConfigSchema", () => {
  it("validates valid config", () => {
    const result = ConfigSchema.safeParse({
      auto_save: true,
      auto_save_min_messages: 3,
      redaction_rules: [{ pattern: "sk-.*", replacement: "[KEY]" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid port", () => {
    const result = ConfigSchema.safeParse({ viewer_port: 80 });
    expect(result.success).toBe(false);
  });

  it("applies defaults for missing fields", () => {
    const result = ConfigSchema.parse({});
    expect(result.auto_save).toBe(false);
    expect(result.viewer_port).toBe(3777);
  });
});
