import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_PUBLISHING_GUIDES } from '../patterns/rn-publishing.js';

export function registerPublishTool(server: McpServer): void {
  server.tool(
    'guide_publishing',
    'Get step-by-step guides for publishing a React Native app to the iOS App Store or Google Play Store, including code signing, TestFlight, and common rejection reasons.',
    {
      platform: z
        .enum(['ios', 'android', 'both'])
        .default('both')
        .describe('Target platform: "ios", "android", or "both"'),
      topic: z
        .string()
        .optional()
        .describe(
          'Optional specific topic (e.g., "signing", "testflight", "rejection", "keystore")',
        ),
    },
    async ({ platform, topic }) => {
      let guides = RN_PUBLISHING_GUIDES;

      if (platform !== 'both') {
        guides = guides.filter(
          (g) => g.platform === platform || g.platform === 'common',
        );
      }

      if (topic) {
        const query = topic.toLowerCase().trim();
        guides = guides.filter(
          (g) =>
            g.id.includes(query) ||
            g.keywords.some(
              (kw) => query.includes(kw) || kw.includes(query),
            ),
        );
      }

      if (guides.length === 0) {
        const available = RN_PUBLISHING_GUIDES.map(
          (g) => `${g.id} (${g.platform}): ${g.name}`,
        ).join('\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  found: false,
                  message: 'No matching publishing guide found.',
                  availableGuides: available,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const results = guides.map((g) => ({
        id: g.id,
        platform: g.platform,
        name: g.name,
        description: g.description,
        steps: g.steps,
        commonRejections: g.commonRejections ?? [],
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                found: true,
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
