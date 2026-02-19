import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_CODE_SNIPPETS } from '../patterns/rn-snippets.js';

export function registerSnippetTool(server: McpServer): void {
  server.tool(
    'generate_snippet',
    'Get ready-to-use code snippets for common React Native patterns. Covers navigation, API clients, custom hooks, forms, notifications, auth, storage, and UI components.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "navigation setup", "axios", "form validation", "push notification", "auth flow", "bottom sheet")',
        ),
      category: z
        .enum(['navigation', 'api', 'hooks', 'forms', 'notifications', 'storage', 'auth', 'ui'])
        .optional()
        .describe('Filter by snippet category.'),
    },
    async ({ query, category }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_CODE_SNIPPETS;
      if (category) {
        candidates = candidates.filter((s) => s.category === category);
      }

      const matches = candidates.filter(
        (s) =>
          s.id === q ||
          s.category === q ||
          s.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((s) => `${s.id}: ${s.name} [${s.category}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching snippet for "${query}".`, availableSnippets: available },
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
