import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_FEATURES } from '../patterns/rn-features.js';

export function registerRecommendTool(server: McpServer): void {
  server.tool(
    'recommend_library',
    'Find recommended React Native libraries for a given feature (e.g., camera, notifications, maps). Returns library options with setup steps, permissions, and Expo compatibility.',
    {
      feature: z
        .string()
        .describe(
          'Feature keyword to search for (e.g., "camera", "push notification", "maps", "storage")',
        ),
      use_expo: z
        .boolean()
        .default(false)
        .describe('If true, filter results to only Expo-compatible libraries'),
    },
    async ({ feature, use_expo }) => {
      const query = feature.toLowerCase().trim();

      // Find matching categories by id or keywords
      const matches = RN_FEATURES.filter(
        (cat) =>
          cat.id === query ||
          cat.keywords.some((kw) => query.includes(kw) || kw.includes(query)),
      );

      if (matches.length === 0) {
        const available = RN_FEATURES.map(
          (cat) => `${cat.id}: ${cat.name}`,
        ).join('\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  found: false,
                  query: feature,
                  message: `No matching feature found for "${feature}".`,
                  availableFeatures: available,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const results = matches.map((cat) => {
        const libs = use_expo
          ? cat.libraries.filter((lib) => lib.expoSupported)
          : cat.libraries;

        return {
          feature: cat.name,
          description: cat.description,
          libraryCount: libs.length,
          libraries: libs.map((lib) => ({
            name: lib.name,
            npmPackage: lib.npmPackage,
            description: lib.description,
            platforms: lib.platforms,
            expoSupported: lib.expoSupported,
            setupSteps: lib.setupSteps,
            permissions: lib.permissions ?? [],
            links: lib.links,
          })),
        };
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                found: true,
                query: feature,
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
