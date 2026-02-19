import { execFile } from "node:child_process";

function exec(
  command: string,
  args: string[],
  cwd?: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(command, args, { cwd, timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(stdout.trim() || null);
    });
  });
}

/**
 * Get the current git branch name.
 * Returns null if not in a git repo or git is not available.
 */
export async function getCurrentBranch(cwd?: string): Promise<string | null> {
  return exec("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd);
}

/**
 * Get the current short commit hash.
 * Returns null if not in a git repo or git is not available.
 */
export async function getCurrentCommit(cwd?: string): Promise<string | null> {
  return exec("git", ["rev-parse", "--short", "HEAD"], cwd);
}
