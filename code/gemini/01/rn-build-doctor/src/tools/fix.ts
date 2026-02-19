import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { run } from '../utils/shell.js';
import type { FixAction } from '../types.js';

const FIX_ACTIONS: Record<string, FixAction> = {
  'ios-pod-install': {
    id: 'ios-pod-install',
    title: 'Reinstall CocoaPods Dependencies',
    description:
      'Deintegrates and reinstalls all iOS CocoaPods dependencies',
    commands: ['cd ios && pod deintegrate', 'cd ios && pod install'],
    executable: true,
    caution: 'safe',
  },
  'ios-clean-derived-data': {
    id: 'ios-clean-derived-data',
    title: 'Clean Xcode DerivedData',
    description:
      'Removes Xcode build cache. Safe to delete at any time.',
    commands: ['rm -rf ~/Library/Developer/Xcode/DerivedData'],
    executable: true,
    caution: 'safe',
  },
  'metro-cache-reset': {
    id: 'metro-cache-reset',
    title: 'Reset Metro Bundler Cache',
    description:
      'Clears Metro cache. Run the printed command to start Metro with a clean cache.',
    commands: ['npx react-native start --reset-cache'],
    executable: false,
    caution: 'safe',
  },
  'android-clean': {
    id: 'android-clean',
    title: 'Clean Android Gradle Build',
    description: 'Runs gradlew clean to remove Android build artifacts',
    commands: ['cd android && ./gradlew clean'],
    executable: true,
    caution: 'safe',
  },
  'node-modules-reinstall': {
    id: 'node-modules-reinstall',
    title: 'Reinstall node_modules',
    description:
      'Deletes node_modules and reinstalls from package.json',
    commands: ['rm -rf node_modules', 'npm install'],
    executable: true,
    caution: 'safe',
  },
};

export function registerFixTool(server: McpServer): void {
  server.tool(
    'apply_fix',
    'Execute a predefined fix action for a diagnosed React Native build error. Use dry_run: true (default) to preview commands before executing.',
    {
      fix_id: z
        .string()
        .describe(
          'The fix identifier from a diagnosed error (e.g., "ios-pod-install")',
        ),
      project_path: z
        .string()
        .describe('Absolute path to the React Native project root'),
      dry_run: z
        .boolean()
        .default(true)
        .describe(
          'If true (default), only show what would be executed without running it',
        ),
    },
    async ({ fix_id, project_path, dry_run }) => {
      const action = FIX_ACTIONS[fix_id];

      if (!action) {
        const available = Object.keys(FIX_ACTIONS).join(', ');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: false,
                  error: `Unknown fix_id: "${fix_id}". Available: ${available}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (dry_run || !action.executable) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  dry_run: true,
                  fix: action.title,
                  description: action.description,
                  commands: action.commands,
                  caution: action.caution,
                  message: action.executable
                    ? 'Pass dry_run: false to execute these commands'
                    : 'This fix requires manual execution (interactive command)',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const results: { command: string; success: boolean; output: string }[] =
        [];

      for (const command of action.commands) {
        const result = run(command, { cwd: project_path, timeout: 120_000 });
        results.push({
          command,
          success: result.success,
          output: (result.stdout || result.stderr).slice(0, 5000),
        });
        if (!result.success) break;
      }

      const allSucceeded = results.every((r) => r.success);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: allSucceeded,
                fix: action.title,
                results,
                message: allSucceeded
                  ? 'Fix applied successfully. Try building again.'
                  : 'Fix partially failed. See results for details.',
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
