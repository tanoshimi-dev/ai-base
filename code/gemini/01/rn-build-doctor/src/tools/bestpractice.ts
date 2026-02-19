import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_BEST_PRACTICES } from '../patterns/rn-best-practices.js';
import type { GuideDomain } from '../types.js';

export function registerBestPracticeTool(server: McpServer): void {
  server.tool(
    'guide_best_practice',
    'Get React Native best practice guidance on architecture, testing, debugging, security, CI/CD, accessibility, styling, and i18n.',
    {
      topic: z
        .string()
        .describe(
          'Topic to search for (e.g., "state management", "e2e testing", "performance", "authentication", "github actions", "fastlane")',
        ),
      domain: z
        .enum(['architecture', 'testing', 'debugging', 'security', 'cicd', 'accessibility', 'styling', 'i18n'])
        .optional()
        .describe('Filter by domain. Omit to search all domains.'),
    },
    async ({ topic, domain }) => {
      const query = topic.toLowerCase().trim();

      let candidates = RN_BEST_PRACTICES;
      if (domain) {
        candidates = candidates.filter((cat) => cat.domain === domain);
      }

      const matches = candidates.filter(
        (cat) =>
          cat.id === query ||
          cat.domain === query ||
          cat.keywords.some(
            (kw) => query.includes(kw) || kw.includes(query),
          ),
      );

      if (matches.length === 0) {
        const grouped = groupByDomain(candidates);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  found: false,
                  query: topic,
                  message: `No matching guide found for "${topic}".`,
                  availableTopics: grouped,
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
        domain: cat.domain,
        name: cat.name,
        description: cat.description,
        entries: cat.entries.map((entry) => ({
          name: entry.name,
          description: entry.description,
          recommended: entry.recommended,
          setupSteps: entry.setupSteps,
          codeExample: entry.codeExample,
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
                query: topic,
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

function groupByDomain(
  categories: typeof RN_BEST_PRACTICES,
): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const cat of categories) {
    if (!grouped[cat.domain]) grouped[cat.domain] = [];
    grouped[cat.domain].push(`${cat.id}: ${cat.name}`);
  }
  return grouped;
}
