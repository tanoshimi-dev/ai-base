import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { run, getVersion } from '../utils/shell.js';
import type { EnvCheckResult } from '../types.js';

export function registerDoctorTool(server: McpServer): void {
  server.tool(
    'check_rn_environment',
    'Check the React Native development environment health: Node, npm/yarn/pnpm, RN CLI, Xcode, CocoaPods, Android SDK, Java, Gradle, etc.',
    {},
    async () => {
      const results: EnvCheckResult[] = [];

      // Node.js
      const nodeVersion = getVersion('node');
      results.push({
        name: 'Node.js',
        status: nodeVersion ? parseNodeStatus(nodeVersion) : 'not-installed',
        value: nodeVersion ?? undefined,
        expected: '>=18.0.0',
      });

      // Package managers
      for (const pm of ['npm', 'yarn', 'pnpm'] as const) {
        const v = getVersion(pm);
        results.push({
          name: pm,
          status: v ? 'ok' : 'not-installed',
          value: v ?? undefined,
        });
      }

      // React Native CLI
      const rnCliResult = run('npx react-native --version', { timeout: 15_000 });
      results.push({
        name: 'React Native CLI',
        status: rnCliResult.success ? 'ok' : 'warning',
        value: rnCliResult.stdout.trim() || undefined,
        message: rnCliResult.success
          ? undefined
          : 'RN CLI not found globally; npx will download on demand',
      });

      // Watchman
      const watchman = getVersion('watchman', '-v');
      results.push({
        name: 'Watchman',
        status: watchman ? 'ok' : 'warning',
        value: watchman ?? undefined,
        message: watchman ? undefined : 'Watchman not installed — Metro may be slow',
      });

      // iOS checks (macOS only)
      if (process.platform === 'darwin') {
        const xcode = run('xcodebuild -version');
        results.push({
          name: 'Xcode',
          status: xcode.success ? parseXcodeStatus(xcode.stdout) : 'not-installed',
          value: xcode.success ? xcode.stdout.split('\n')[0] : undefined,
          expected: '>=15.0',
        });

        const pods = getVersion('pod');
        results.push({
          name: 'CocoaPods',
          status: pods ? 'ok' : 'not-installed',
          value: pods ?? undefined,
        });

        const ruby = getVersion('ruby');
        results.push({
          name: 'Ruby',
          status: ruby ? parseRubyStatus(ruby) : 'not-installed',
          value: ruby ?? undefined,
        });
      }

      // Android checks
      const androidHome = process.env['ANDROID_HOME'] || process.env['ANDROID_SDK_ROOT'];
      results.push({
        name: 'ANDROID_HOME',
        status: androidHome ? 'ok' : 'error',
        value: androidHome,
        message: androidHome
          ? undefined
          : 'ANDROID_HOME is not set. Add it to your shell profile.',
      });

      const java = getVersion('java', '-version');
      results.push({
        name: 'Java',
        status: java ? parseJavaStatus(java) : 'not-installed',
        value: java ?? undefined,
        expected: '>=17 (for RN 0.73+)',
      });

      const overallStatus = results.some((r) => r.status === 'error')
        ? 'error'
        : results.some((r) => r.status === 'warning')
          ? 'warning'
          : 'ok';

      const output = {
        overall: overallStatus,
        checks: results,
        summary: buildSummary(results),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
      };
    },
  );
}

function parseNodeStatus(version: string): EnvCheckResult['status'] {
  const match = version.match(/v?(\d+)/);
  if (!match) return 'warning';
  return parseInt(match[1]) >= 18 ? 'ok' : 'warning';
}

function parseXcodeStatus(stdout: string): EnvCheckResult['status'] {
  const match = stdout.match(/Xcode (\d+)/);
  if (!match) return 'warning';
  return parseInt(match[1]) >= 15 ? 'ok' : 'warning';
}

function parseRubyStatus(version: string): EnvCheckResult['status'] {
  const match = version.match(/(\d+)\.(\d+)/);
  if (!match) return 'warning';
  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  return major >= 3 || (major === 2 && minor >= 7) ? 'ok' : 'warning';
}

function parseJavaStatus(version: string): EnvCheckResult['status'] {
  const match = version.match(/version "?(\d+)/);
  if (!match) return 'warning';
  return parseInt(match[1]) >= 17 ? 'ok' : 'warning';
}

function buildSummary(results: EnvCheckResult[]): string {
  const ok = results.filter((r) => r.status === 'ok').map((r) => r.name);
  const warnings = results.filter((r) => r.status === 'warning').map((r) => r.name);
  const errors = results.filter((r) => r.status === 'error').map((r) => r.name);
  const missing = results.filter((r) => r.status === 'not-installed').map((r) => r.name);
  return [
    ok.length ? `OK: ${ok.join(', ')}` : '',
    warnings.length ? `Warnings: ${warnings.join(', ')}` : '',
    errors.length ? `Errors: ${errors.join(', ')}` : '',
    missing.length ? `Not installed: ${missing.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
