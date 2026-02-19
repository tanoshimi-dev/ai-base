import { spawnSync } from 'node:child_process';

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

const ANSI_ESCAPE = /\x1b\[[0-9;]*m/g;

function stripAnsi(str: string): string {
  return str.replace(ANSI_ESCAPE, '');
}

export function run(
  command: string,
  options: {
    cwd?: string;
    timeout?: number;
    env?: NodeJS.ProcessEnv;
  } = {},
): ShellResult {
  const { cwd, timeout = 10_000, env = process.env } = options;

  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd' : 'sh';
  const shellFlag = isWindows ? '/c' : '-c';

  try {
    const result = spawnSync(shell, [shellFlag, command], {
      cwd,
      timeout,
      env,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    const stdout = stripAnsi(result.stdout ?? '');
    const stderr = stripAnsi(result.stderr ?? '');
    const exitCode = result.status ?? 1;

    return { stdout, stderr, exitCode, success: exitCode === 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { stdout: '', stderr: message, exitCode: 1, success: false };
  }
}

export function commandExists(cmd: string): boolean {
  const isWindows = process.platform === 'win32';
  const checkCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
  const result = run(checkCmd);
  return result.success && result.stdout.trim().length > 0;
}

export function getVersion(cmd: string, versionFlag = '--version'): string | null {
  const result = run(`${cmd} ${versionFlag}`);
  if (!result.success) return null;
  const output = result.stdout || result.stderr;
  return output.trim().split('\n')[0] ?? null;
}
