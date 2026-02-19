import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_UPGRADE_GUIDES } from '../patterns/rn-upgrades.js';

export function registerUpgradeTool(server: McpServer): void {
  server.tool(
    'guide_upgrade',
    'Get step-by-step upgrade guides for migrating between React Native versions, including breaking changes, required tool updates, and migration steps.',
    {
      from: z
        .string()
        .optional()
        .describe('Current RN version (e.g., "0.72", "0.73")'),
      to: z
        .string()
        .optional()
        .describe('Target RN version (e.g., "0.74", "0.76")'),
      query: z
        .string()
        .optional()
        .describe('Search term (e.g., "java 17", "namespace", "new architecture")'),
    },
    async ({ from, to, query }) => {
      let guides = RN_UPGRADE_GUIDES;

      if (from) {
        guides = guides.filter((g) => g.from === from);
      }
      if (to) {
        guides = guides.filter((g) => g.to === to);
      }
      if (query) {
        const q = query.toLowerCase().trim();
        guides = guides.filter(
          (g) =>
            g.id.includes(q) ||
            g.keywords.some((kw) => q.includes(kw) || kw.includes(q)) ||
            g.majorChanges.some((mc) => mc.toLowerCase().includes(q)),
        );
      }

      if (guides.length === 0) {
        const available = RN_UPGRADE_GUIDES.map(
          (g) => `${g.from} → ${g.to}: ${g.name}`,
        ).join('\n');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, message: 'No matching upgrade guide found.', availableGuides: available },
                null, 2,
              ),
            },
          ],
        };
      }

      const results = guides.map((g) => ({
        id: g.id,
        from: g.from,
        to: g.to,
        name: g.name,
        description: g.description,
        majorChanges: g.majorChanges,
        steps: g.steps,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ found: true, resultCount: results.length, results }, null, 2),
          },
        ],
      };
    },
  );
}
