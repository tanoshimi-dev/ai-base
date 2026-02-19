import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_RELEASE_CHECKLIST_GUIDES } from '../patterns/rn-release-checklist.js';

export function registerReleaseChecklistTool(server: McpServer): void {
  server.tool(
    'guide_release_checklist',
    'Get pre-release checklists for submitting React Native apps to the App Store and Google Play. Includes common rejection reasons and fixes.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "ios", "android", "app store", "google play", "checklist", "rejection")',
        ),
      platform: z
        .enum(['ios', 'android', 'common'])
        .optional()
        .describe('Filter by platform.'),
    },
    async ({ query, platform }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_RELEASE_CHECKLIST_GUIDES;
      if (platform) {
        candidates = candidates.filter((g) => g.platform === platform);
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.platform === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((g) => `${g.id}: ${g.name} [${g.platform}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching checklist for "${query}".`, availableChecklists: available },
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
