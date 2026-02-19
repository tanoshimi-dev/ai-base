import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_TEMPLATES } from '../patterns/rn-templates.js';
import type { TemplateCategoryType } from '../types.js';

export function registerTemplateTool(server: McpServer): void {
  server.tool(
    'guide_template',
    'Get guidance on choosing a React Native project starter template. Covers official starters (Expo, RN CLI), community boilerplates (Ignite, Obytes), full-stack monorepos (T3 Turbo, Solito), and Expo templates.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "expo", "monorepo", "beginner", "ignite", "production")',
        ),
      category: z
        .enum(['official', 'community', 'fullstack', 'expo-template'])
        .optional()
        .describe('Filter by category. Omit to search all categories.'),
    },
    async ({ query, category }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_TEMPLATES;
      if (category) {
        candidates = candidates.filter((cat) => cat.category === category);
      }

      const matches = candidates.filter(
        (cat) =>
          cat.id === q ||
          cat.category === q ||
          cat.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const grouped = groupByCategory(candidates);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  found: false,
                  query,
                  message: `No matching template found for "${query}".`,
                  availableTemplates: grouped,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const results = matches.map((cat) => ({
        id: cat.id,
        category: cat.category,
        name: cat.name,
        description: cat.description,
        entries: cat.entries.map((entry) => ({
          name: entry.name,
          description: entry.description,
          recommended: entry.recommended,
          setupCommands: entry.setupCommands,
          features: entry.features,
          bestFor: entry.bestFor,
          pros: entry.pros,
          cons: entry.cons,
          links: entry.links,
        })),
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                found: true,
                query,
                resultCount: results.length,
                results,
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

function groupByCategory(
  categories: typeof RN_TEMPLATES,
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const cat of categories) {
    if (!grouped[cat.category]) grouped[cat.category] = [];
    grouped[cat.category].push(`${cat.id}: ${cat.name}`);
  }
  return grouped;
}
