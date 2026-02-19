import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_PERFORMANCE_GUIDES } from '../patterns/rn-performance.js';

export function registerPerformanceTool(server: McpServer): void {
  server.tool(
    'guide_performance',
    'Get performance optimization guides for React Native apps. Covers rendering, lists, images, navigation, startup time, memory, and bridge optimization.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "flatlist", "re-render", "startup", "memory leak", "bridge")',
        ),
      category: z
        .enum(['rendering', 'lists', 'images', 'navigation', 'startup', 'memory', 'bridge'])
        .optional()
        .describe('Filter by performance category.'),
    },
    async ({ query, category }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_PERFORMANCE_GUIDES;
      if (category) {
        candidates = candidates.filter((g) => g.category === category);
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.category === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((g) => `${g.id}: ${g.name} [${g.category}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching guide for "${query}".`, availableGuides: available },
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
