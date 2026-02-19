import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_MONOREPO_GUIDES } from '../patterns/rn-monorepo.js';

export function registerMonorepoTool(server: McpServer): void {
  server.tool(
    'guide_monorepo',
    'Get guides for setting up React Native in monorepo environments. Covers Turborepo, Nx, Yarn Workspaces, pnpm, and code sharing strategies.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "turborepo", "nx", "yarn workspaces", "pnpm", "shared code", "metro")',
        ),
      tool: z
        .enum(['turborepo', 'nx', 'yarn-workspaces', 'pnpm-workspaces', 'general'])
        .optional()
        .describe('Filter by monorepo tool.'),
    },
    async ({ query, tool }) => {
      const q = query.toLowerCase().trim();

      let candidates = RN_MONOREPO_GUIDES;
      if (tool) {
        candidates = candidates.filter((g) => g.tool === tool);
      }

      const matches = candidates.filter(
        (g) =>
          g.id === q ||
          g.tool === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = candidates.map((g) => `${g.id}: ${g.name} [${g.tool}]`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No matching monorepo guide for "${query}".`, availableGuides: available },
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
