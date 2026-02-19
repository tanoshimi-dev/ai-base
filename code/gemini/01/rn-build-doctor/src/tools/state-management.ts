import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_STATE_MANAGEMENT_GUIDES } from '../patterns/rn-state-management.js';

export function registerStateManagementTool(server: McpServer): void {
  server.tool(
    'guide_state_management',
    'Compare state management solutions for React Native. Covers Zustand, Redux Toolkit, Jotai, MobX, React Context, and Legend State with code examples, pros/cons, and bundle sizes.',
    {
      query: z
        .string()
        .describe(
          'Search term (e.g., "zustand", "redux", "jotai", "mobx", "context", "simple", "lightweight")',
        ),
    },
    async ({ query }) => {
      const q = query.toLowerCase().trim();

      const matches = RN_STATE_MANAGEMENT_GUIDES.filter(
        (g) =>
          g.id === q ||
          g.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const summary = RN_STATE_MANAGEMENT_GUIDES.map((g) => ({
          id: g.id,
          name: g.name,
          bundleSize: g.bundleSize,
          learningCurve: g.learningCurve,
          bestFor: g.bestFor,
        }));
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query, message: `No exact match for "${query}". Here are all options:`, allOptions: summary },
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
