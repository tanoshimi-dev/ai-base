import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RN_COMPATIBILITY_RULES } from '../patterns/rn-compatibility.js';

export function registerCompatibilityTool(server: McpServer): void {
  server.tool(
    'check_compatibility',
    'Check if a library version is compatible with a specific React Native version. Finds known incompatibilities and provides fixes.',
    {
      library: z
        .string()
        .optional()
        .describe('Library name to check (e.g., "react-native-reanimated", "firebase")'),
      rnVersion: z
        .string()
        .optional()
        .describe('React Native version to check against (e.g., "0.74", "0.76")'),
      query: z
        .string()
        .optional()
        .describe('General search term (e.g., "reanimated", "java", "gradle")'),
    },
    async ({ library, rnVersion, query }) => {
      let rules = RN_COMPATIBILITY_RULES;

      if (library) {
        const lib = library.toLowerCase().trim();
        rules = rules.filter(
          (r) =>
            r.library.toLowerCase().includes(lib) ||
            r.keywords.some((kw) => lib.includes(kw) || kw.includes(lib)),
        );
      }

      if (rnVersion) {
        const ver = rnVersion.trim();
        rules = rules.filter((r) => {
          if (r.rnVersionMin && ver >= r.rnVersionMin) return true;
          if (r.rnVersionMax && ver <= r.rnVersionMax) return true;
          if (!r.rnVersionMin && !r.rnVersionMax) return true;
          return false;
        });
      }

      if (query) {
        const q = query.toLowerCase().trim();
        rules = rules.filter(
          (r) =>
            r.id.includes(q) ||
            r.library.toLowerCase().includes(q) ||
            r.keywords.some((kw) => q.includes(kw) || kw.includes(q)),
        );
      }

      if (rules.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  found: false,
                  message: 'No compatibility issues found for the given criteria.',
                  totalRulesInDatabase: RN_COMPATIBILITY_RULES.length,
                },
                null, 2,
              ),
            },
          ],
        };
      }

      const results = rules.map((r) => ({
        id: r.id,
        library: r.library,
        libraryVersion: r.libraryVersion,
        rnVersionMin: r.rnVersionMin,
        rnVersionMax: r.rnVersionMax,
        severity: r.severity,
        description: r.description,
        fix: r.fix,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { found: true, issueCount: results.length, results },
              null, 2,
            ),
          },
        ],
      };
    },
  );
}
