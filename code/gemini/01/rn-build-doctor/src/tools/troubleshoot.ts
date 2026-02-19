import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_TROUBLESHOOT_RECIPES } from '../patterns/rn-troubleshoot.js';
import type { Platform } from '../types.js';

export function registerTroubleshootTool(server: McpServer): void {
  server.tool(
    'guide_troubleshoot',
    'Symptom-based troubleshooting recipes for common React Native problems. Describe the symptom (e.g., "white screen", "crash on launch", "fonts not loading") to get a step-by-step diagnostic checklist.',
    {
      symptom: z
        .string()
        .describe('Describe the symptom (e.g., "white screen", "crash release", "slow metro", "images not loading")'),
      platform: z
        .enum(['ios', 'android', 'common'])
        .optional()
        .describe('Filter by platform. Omit to search all.'),
    },
    async ({ symptom, platform }) => {
      const q = symptom.toLowerCase().trim();

      let candidates = RN_TROUBLESHOOT_RECIPES;
      if (platform) {
        candidates = candidates.filter(
          (r) => r.platform === platform || r.platform === 'common',
        );
      }

      const matches = candidates.filter(
        (r) =>
          r.id.includes(q) ||
          r.symptom.toLowerCase().includes(q) ||
          r.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
      );

      if (matches.length === 0) {
        const available = RN_TROUBLESHOOT_RECIPES.map(
          (r) => `${r.id} (${r.platform}): ${r.symptom}`,
        ).join('\n');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { found: false, query: symptom, message: `No matching recipe for "${symptom}".`, availableRecipes: available },
                null, 2,
              ),
            },
          ],
        };
      }

      const results = matches.map((r) => ({
        id: r.id,
        symptom: r.symptom,
        description: r.description,
        platform: r.platform,
        checks: r.checks,
        commonCause: r.commonCause,
        fix: r.fix,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ found: true, query: symptom, resultCount: results.length, results }, null, 2),
          },
        ],
      };
    },
  );
}
