import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_MIGRATION_GUIDES } from '../patterns/rn-migrations.js';

export function registerMigrationTool(server: McpServer): void {
  server.tool(
    'guide_migration',
    'Get step-by-step migration guides for moving between Expo managed, Expo bare/prebuild, and bare React Native workflows.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "expo to bare", "bare to expo", "prebuild", "eject", "class to hooks")',
        ),
      direction: z
        .enum(['expo-to-bare', 'bare-to-expo', 'expo-prebuild', 'eject'])
        .optional()
        .describe('Filter by migration direction.'),
    },
    async ({ query, direction }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_MIGRATION_GUIDES;
      if (direction) {
        candidates = candidates.filter((g) => g.direction === direction);
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.direction === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((g) => `${g.id}: ${g.name} [${g.direction}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching migration guide for "${query}".`, availableGuides: available },
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
