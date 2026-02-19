import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_DEEPLINK_GUIDES } from '../patterns/rn-deeplinks.js';

export function registerDeeplinkTool(server: McpServer): void {
  server.tool(
    'guide_deeplink',
    'Get guides for implementing deep linking in React Native apps. Covers React Navigation linking, iOS Universal Links, Android App Links, dynamic links, and Expo linking.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "universal links", "app links", "react navigation", "dynamic links", "expo")',
        ),
      platform: z
        .enum(['ios', 'android', 'common'])
        .optional()
        .describe('Filter by platform.'),
    },
    async ({ query, platform }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_DEEPLINK_GUIDES;
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
                { found: false, query, message: `No matching deep link guide for "${query}".`, availableGuides: available },
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
