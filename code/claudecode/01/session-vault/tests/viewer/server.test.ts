/**
 * Tests for the viewer server lifecycle: PID management and start/stop logic.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writePid, readPid, removePid } from "../../src/viewer/server.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "sv-server-test-"));
  process.env.VAULT_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.VAULT_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

describe("PID file management", () => {
  it("writes and reads PID", async () => {
    await writePid(12345);
    const pid = await readPid();
    expect(pid).toBe(12345);
  });

  it("returns null when no PID file", async () => {
    const pid = await readPid();
    expect(pid).toBeNull();
  });

  it("removes PID file", async () => {
    await writePid(12345);
    await removePid();
    const pid = await readPid();
    expect(pid).toBeNull();
  });

  it("removePid is idempotent", async () => {
    await removePid();
    await removePid(); // Should not throw
  });
});
