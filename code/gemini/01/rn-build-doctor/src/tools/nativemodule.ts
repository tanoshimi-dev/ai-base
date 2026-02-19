import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_NATIVE_MODULE_GUIDES } from '../patterns/rn-native-modules.js';

export function registerNativeModuleTool(server: McpServer): void {
  server.tool(
    'guide_native_module',
    'Get guides for creating custom native modules (TurboModules), Fabric components, and migrating from the old bridge to the New Architecture.',
    {
      query: z
        .string()
        .describe('Search term (e.g., "turbo module", "fabric", "ios swift", "android kotlin", "bridge migration")'),
      platform: z
        .enum(['ios', 'android', 'common'])
        .optional()
        .describe('Filter by platform. Omit to search all.'),
    },
    async ({ query, platform }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_NATIVE_MODULE_GUIDES;
      if (platform) {
        candidates = candidates.filter(
          (g) => g.platform === platform || g.platform === 'common',
        );
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = RN_NATIVE_MODULE_GUIDES.map(
          (g) => `${g.id} (${g.platform}): ${g.name}`,
        ).join('\n');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching guide found for "${query}".`, availableGuides: available },
                null, 2,
              ),
            },
          ],
        };
      }

      const results = matches.map((g) => ({
        id: g.id,
        platform: g.platform,
        name: g.name,
        description: g.description,
        steps: g.steps,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ found: true, query, resultCount: results.length, results }, null, 2),
          },
        ],
      };
    },
  );
}
