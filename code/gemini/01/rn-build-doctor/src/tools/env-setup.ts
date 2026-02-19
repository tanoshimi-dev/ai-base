import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_ENV_SETUP_GUIDES } from '../patterns/rn-env-setup.js';

export function registerEnvSetupTool(server: McpServer): void {
  server.tool(
    'guide_env_setup',
    'Get step-by-step environment setup guides for React Native development. Covers macOS, Windows, Linux for iOS and Android development.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "macos ios", "windows android", "linux", "expo quickstart")',
        ),
      os: z
        .enum(['macos', 'windows', 'linux', 'common'])
        .optional()
        .describe('Filter by operating system.'),
    },
    async ({ query, os }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_ENV_SETUP_GUIDES;
      if (os) {
        candidates = candidates.filter((g) => g.os === os);
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.os === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((g) => `${g.id}: ${g.name} [${g.os} → ${g.targetPlatform}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching setup guide for "${query}".`, availableGuides: available },
                null, 2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { found: true, query, resultCount: matches.length, results: matches },
              null, 2,
            ),
          },
        ],
      };
    },
  );
}
