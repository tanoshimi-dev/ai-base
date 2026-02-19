import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectInfo } from '../types.js';

export function registerEnvInfoTool(server: McpServer): void {
  server.tool(
    'get_project_info',
    'Read React Native project configuration files (package.json, Podfile, build.gradle) and return structured project information',
    {
      project_path: z
        .string()
        .describe('Absolute path to the React Native project root'),
    },
    async ({ project_path }) => {
      const info: ProjectInfo = {
        packageManager: 'unknown',
      };

      // --- package.json ---
      const pkgPath = join(project_path, 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          info.rnVersion = pkg.dependencies?.['react-native'];
          info.reactVersion = pkg.dependencies?.['react'];
          info.packageManager = existsSync(join(project_path, 'yarn.lock'))
            ? 'yarn'
            : existsSync(join(project_path, 'pnpm-lock.yaml'))
              ? 'pnpm'
              : existsSync(join(project_path, 'package-lock.json'))
                ? 'npm'
                : 'unknown';
        } catch {
          // Failed to parse package.json
        }
      }

      // --- iOS: Podfile ---
      const podfilePath = join(project_path, 'ios', 'Podfile');
      if (existsSync(podfilePath)) {
        try {
          const podfile = readFileSync(podfilePath, 'utf-8');
          info.ios = {
            deploymentTarget:
              podfile.match(/platform :ios,\s*['"]([^'"]+)['"]/)?.[1],
            hermesEnabled: /:hermes_enabled\s*=>\s*(true|false)/.test(podfile)
              ? /:hermes_enabled\s*=>\s*true/.test(podfile)
              : undefined,
            flipperEnabled: /use_flipper!/.test(podfile),
            pods: {
              installed: existsSync(join(project_path, 'ios', 'Pods')),
              lockFilePresent: existsSync(
                join(project_path, 'ios', 'Podfile.lock'),
              ),
            },
          };
        } catch {
          // Failed to read Podfile
        }
      }

      // --- iOS: .xcode.env ---
      const xcodeEnvPath = join(project_path, 'ios', '.xcode.env');
      if (existsSync(xcodeEnvPath)) {
        try {
          const xcodeEnv = readFileSync(xcodeEnvPath, 'utf-8');
          if (info.ios) {
            info.ios.newArchEnabled =
              /RN_NEW_ARCH_ENABLED\s*=\s*1/.test(xcodeEnv);
          }
        } catch {
          // Failed to read .xcode.env
        }
      }

      // --- Android: gradle.properties ---
      const gradlePropsPath = join(
        project_path,
        'android',
        'gradle.properties',
      );
      if (existsSync(gradlePropsPath)) {
        try {
          const props = readFileSync(gradlePropsPath, 'utf-8');

          const gradleWrapperPath = join(
            project_path,
            'android',
            'gradle',
            'wrapper',
            'gradle-wrapper.properties',
          );
          const wrapper = existsSync(gradleWrapperPath)
            ? readFileSync(gradleWrapperPath, 'utf-8')
            : '';

          info.android = {
            newArchEnabled: /newArchEnabled\s*=\s*true/i.test(props),
            jetifierEnabled: /android\.enableJetifier\s*=\s*true/i.test(props),
            gradleVersion: wrapper.match(/gradle-([0-9.]+)-/)?.[1],
          };

          // android/build.gradle (project-level)
          const rootGradlePath = join(project_path, 'android', 'build.gradle');
          if (existsSync(rootGradlePath)) {
            const rootGradle = readFileSync(rootGradlePath, 'utf-8');
            info.android.kotlinVersion =
              rootGradle.match(
                /kotlinVersion\s*=\s*["']([^"']+)["']/,
              )?.[1];
            info.android.agpVersion =
              rootGradle.match(
                /com\.android\.tools\.build:gradle:([^"']+)/,
              )?.[1];
          }

          // android/app/build.gradle
          const appGradlePath = join(
            project_path,
            'android',
            'app',
            'build.gradle',
          );
          if (existsSync(appGradlePath)) {
            const appGradle = readFileSync(appGradlePath, 'utf-8');
            info.android.compileSdk =
              parseInt(
                appGradle.match(/compileSdk(?:Version)?\s+(\d+)/)?.[1] ?? '0',
              ) || undefined;
            info.android.targetSdk =
              parseInt(
                appGradle.match(/targetSdk(?:Version)?\s+(\d+)/)?.[1] ?? '0',
              ) || undefined;
            info.android.minSdk =
              parseInt(
                appGradle.match(/minSdk(?:Version)?\s+(\d+)/)?.[1] ?? '0',
              ) || undefined;
            info.android.namespace = appGradle.match(
              /namespace\s+["']([^"']+)["']/,
            )?.[1];
          }
        } catch {
          // Failed to read Android config files
        }
      }

      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(info, null, 2) },
        ],
      };
    },
  );
}
