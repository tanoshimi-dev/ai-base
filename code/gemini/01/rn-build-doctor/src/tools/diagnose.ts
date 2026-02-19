import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { IOS_ERROR_PATTERNS } from '../patterns/ios-errors.js';
import { ANDROID_ERROR_PATTERNS } from '../patterns/android-errors.js';
import { COMMON_ERROR_PATTERNS } from '../patterns/common-errors.js';
import { parseLog, detectPlatform } from '../utils/log-parser.js';

const ALL_PATTERNS = [
  ...IOS_ERROR_PATTERNS,
  ...ANDROID_ERROR_PATTERNS,
  ...COMMON_ERROR_PATTERNS,
];

export function registerDiagnoseTool(server: McpServer): void {
  server.tool(
    'diagnose_build_error',
    'Analyze a React Native build error log and return diagnosed errors with severity, causes, and fix instructions',
    {
      log: z.string().describe('The full build error log output'),
      platform: z
        .enum(['ios', 'android', 'auto'])
        .default('auto')
        .describe('Target platform; "auto" detects from log content'),
    },
    async ({ log, platform }) => {
      const resolvedPlatform =
        platform === 'auto' ? detectPlatform(log) : platform;
      const diagnosed = parseLog(log, ALL_PATTERNS, resolvedPlatform);

      const criticalCount = diagnosed.filter(
        (e) => e.severity === 'critical',
      ).length;
      const warningCount = diagnosed.filter(
        (e) => e.severity === 'warning',
      ).length;

      const output = {
        platform: resolvedPlatform,
        errorCount: diagnosed.length,
        errors: diagnosed,
        summary:
          diagnosed.length === 0
            ? 'No known error patterns detected. The error may be project-specific.'
            : `Found ${diagnosed.length} issue(s): ${criticalCount} critical, ${warningCount} warning`,
      };

      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(output, null, 2) },
        ],
      };
    },
  );
}
