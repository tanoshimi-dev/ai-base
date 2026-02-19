import type { MonorepoGuide } from '../types.js';

export const RN_MONOREPO_GUIDES: MonorepoGuide[] = [
  {
    id: 'turborepo-rn',
    name: 'Turborepo + React Native Setup',
    description: 'Set up a Turborepo monorepo with React Native, shared packages, and efficient caching.',
    keywords: ['turborepo', 'turbo', 'vercel', 'monorepo', 'cache', 'pipeline'],
    tool: 'turborepo',
    steps: [
      {
        order: 1,
        title: 'Create Turborepo project',
        description: 'Initialize a new Turborepo workspace.',
        commands: ['npx create-turbo@latest my-monorepo'],
      },
      {
        order: 2,
        title: 'Structure workspace packages',
        description: 'Organize packages for mobile, web, and shared code.',
        tips: [
          'apps/mobile — React Native app',
          'apps/web — Next.js or web app',
          'packages/ui — shared components',
          'packages/api — shared API client',
          'packages/config — shared tsconfig, eslint',
        ],
      },
      {
        order: 3,
        title: 'Configure Metro for monorepo',
        description: 'Metro needs to resolve packages from the workspace root.',
        commands: ['npm install -D @react-native/metro-config'],
        tips: [
          'Set watchFolders to include workspace root',
          'Set nodeModulesPaths to resolve hoisted packages',
          'Use blockList to exclude other apps node_modules',
        ],
      },
      {
        order: 4,
        title: 'Configure turbo.json pipeline',
        description: 'Define build and dev tasks with correct dependencies.',
        tips: [
          'Mobile builds depend on shared packages being built first',
          'Use "dependsOn": ["^build"] for transitive dependencies',
          'Cache Metro bundle output for faster rebuilds',
        ],
      },
      {
        order: 5,
        title: 'Handle CocoaPods in monorepo',
        description: 'iOS Pods need to resolve packages from the monorepo root.',
        tips: [
          'Use node_require in Podfile to resolve from correct location',
          'Set PODS_ROOT relative to the monorepo root if needed',
        ],
      },
    ],
    commonPitfalls: [
      'Metro cannot find packages hoisted to root node_modules — configure watchFolders',
      'CocoaPods cannot resolve node_modules — update Podfile paths',
      'Gradle cannot find React Native autolinking — update settings.gradle paths',
      'TypeScript path aliases not resolving — sync tsconfig paths with Metro resolver',
      'Hot reload not working across packages — ensure watchFolders includes all source dirs',
    ],
  },
  {
    id: 'nx-rn',
    name: 'Nx + React Native Setup',
    description: 'Set up an Nx monorepo with React Native using @nx/react-native plugin for integrated development.',
    keywords: ['nx', 'nrwl', 'monorepo', 'plugin', 'generator', 'affected'],
    tool: 'nx',
    steps: [
      {
        order: 1,
        title: 'Create Nx workspace',
        description: 'Initialize Nx workspace with React Native preset.',
        commands: ['npx create-nx-workspace@latest my-org --preset=react-native'],
      },
      {
        order: 2,
        title: 'Generate apps and libraries',
        description: 'Use Nx generators for consistent project scaffolding.',
        commands: [
          'nx generate @nx/react-native:application mobile',
          'nx generate @nx/js:library shared-utils',
          'nx generate @nx/react-native:library ui-components',
        ],
      },
      {
        order: 3,
        title: 'Configure project dependencies',
        description: 'Nx auto-detects dependencies via import analysis. Use project.json for explicit task dependencies.',
        tips: ['Run nx graph to visualize the dependency graph'],
      },
      {
        order: 4,
        title: 'Use affected commands',
        description: 'Only build/test projects affected by changes.',
        commands: ['nx affected:test', 'nx affected:build', 'nx affected:lint'],
        tips: ['Dramatically reduces CI time for large monorepos'],
      },
      {
        order: 5,
        title: 'Configure caching',
        description: 'Nx caches task outputs locally and optionally remotely with Nx Cloud.',
        commands: ['npx nx connect-to-nx-cloud'],
        tips: ['Remote cache shares build results across team and CI'],
      },
    ],
    commonPitfalls: [
      'React Native autolinking may not find libraries in non-standard locations',
      'Nx generators may create configs that need Metro adjustments',
      'iOS Pods path resolution needs workspace-aware configuration',
      'Jest module resolution may need rootDir adjustments for shared packages',
    ],
  },
  {
    id: 'yarn-workspaces-rn',
    name: 'Yarn Workspaces + React Native',
    description: 'Set up a Yarn Workspaces monorepo with React Native, handling hoisting and native build tool quirks.',
    keywords: ['yarn', 'workspaces', 'monorepo', 'hoist', 'nohoist', 'berry', 'classic'],
    tool: 'yarn-workspaces',
    steps: [
      {
        order: 1,
        title: 'Initialize workspace root',
        description: 'Set up package.json with workspaces configuration.',
        tips: [
          'root package.json: "workspaces": ["apps/*", "packages/*"]',
          'Each workspace gets its own package.json',
        ],
      },
      {
        order: 2,
        title: 'Configure nohoist for React Native',
        description: 'React Native and its native dependencies must NOT be hoisted to prevent build failures.',
        tips: [
          'In apps/mobile/package.json: "nohoist": ["react-native", "react-native/**"]',
          'This ensures native autolinking finds dependencies in the app\'s node_modules',
        ],
      },
      {
        order: 3,
        title: 'Configure Metro resolver',
        description: 'Metro needs to know where to find packages across the workspace.',
        tips: [
          'watchFolders: include monorepo root',
          'nodeModulesPaths: include both app-level and root-level node_modules',
          'extraNodeModules: map shared packages to their filesystem locations',
        ],
      },
      {
        order: 4,
        title: 'Fix iOS Podfile resolution',
        description: 'CocoaPods must resolve packages relative to the app, not the root.',
        tips: [
          'Use require("react-native/scripts/react_native_pods") with correct node_modules path',
          'Set ENV["REACT_NATIVE_PATH"] if pods cannot find react-native',
        ],
      },
      {
        order: 5,
        title: 'Fix Android Gradle resolution',
        description: 'Update settings.gradle and build.gradle to resolve from the correct node_modules.',
        tips: [
          'settings.gradle: set reactNativeDir to the nohoist node_modules location',
          'Autolinking in RN 0.73+ reads from react-native.config.js',
        ],
      },
    ],
    commonPitfalls: [
      'Missing nohoist config causes native build tools to fail',
      'Hoisted react-native version conflicts with app-level version',
      'Symlinks in node_modules break Metro watchman',
      'Yarn Berry (v2+) PnP mode is NOT compatible with React Native — use nodeLinker: node-modules',
    ],
  },
  {
    id: 'pnpm-workspaces-rn',
    name: 'pnpm Workspaces + React Native',
    description: 'Set up a pnpm monorepo with React Native, handling the content-addressable store and symlink structure.',
    keywords: ['pnpm', 'workspaces', 'monorepo', 'content-addressable', 'symlink', 'shamefully-hoist'],
    tool: 'pnpm-workspaces',
    steps: [
      {
        order: 1,
        title: 'Initialize pnpm workspace',
        description: 'Create pnpm-workspace.yaml at the root.',
        tips: ['packages:\n  - "apps/*"\n  - "packages/*"'],
      },
      {
        order: 2,
        title: 'Configure .npmrc for React Native compatibility',
        description: 'pnpm uses a different node_modules structure that React Native tools do not understand by default.',
        tips: [
          'Add to .npmrc: node-linker=hoisted',
          'OR use shamefully-hoist=true for maximum compatibility',
          'This creates a flat node_modules similar to npm/yarn',
        ],
      },
      {
        order: 3,
        title: 'Configure Metro for pnpm',
        description: 'Metro needs to resolve symlinked packages correctly.',
        tips: [
          'Set watchFolders to include workspace root',
          'Enable Metro symlink support: resolver.unstable_enableSymlinks: true',
          'Set nodeModulesPaths appropriately',
        ],
      },
      {
        order: 4,
        title: 'Install and build',
        description: 'Install all workspace dependencies and verify native builds.',
        commands: ['pnpm install', 'pnpm --filter mobile run ios', 'pnpm --filter mobile run android'],
      },
    ],
    commonPitfalls: [
      'Default pnpm structure (content-addressable symlinks) breaks React Native autolinking',
      'node-linker=hoisted is almost always required for RN projects',
      'Metro symlink resolution may need explicit configuration',
      'CocoaPods may not follow pnpm symlinks — ensure hoisted layout',
    ],
  },
  {
    id: 'monorepo-shared-code',
    name: 'Sharing Code Between Mobile & Web in Monorepo',
    description: 'Patterns for sharing business logic, types, API clients, and UI components across React Native and web apps.',
    keywords: ['shared', 'code sharing', 'web', 'mobile', 'cross-platform', 'universal', 'common'],
    tool: 'general',
    steps: [
      {
        order: 1,
        title: 'Identify shareable code',
        description: 'Business logic, API clients, types, utils, and state management can be shared. UI components need platform abstractions.',
        tips: [
          'packages/shared — pure TypeScript (no React Native imports)',
          'packages/ui — cross-platform components using React Native for Web or Tamagui',
          'packages/api — API client + TanStack Query hooks',
        ],
      },
      {
        order: 2,
        title: 'Use platform-agnostic abstractions',
        description: 'Write shared code that does not import platform-specific modules directly.',
        tips: [
          'Use dependency injection for platform-specific implementations',
          'Use .native.ts / .web.ts extensions for platform-specific files',
          'React Native for Web provides many RN primitives for web',
        ],
      },
      {
        order: 3,
        title: 'Configure TypeScript path aliases',
        description: 'Use path aliases to import shared packages cleanly.',
        tips: [
          'tsconfig.json: "paths": { "@my-org/shared": ["../../packages/shared/src"] }',
          'Configure Metro and webpack/Next.js to resolve these aliases',
        ],
      },
      {
        order: 4,
        title: 'Consider Solito for navigation sharing',
        description: 'Solito provides cross-platform navigation primitives that work with both React Navigation and Next.js.',
        commands: ['npm install solito'],
      },
    ],
    commonPitfalls: [
      'Importing react-native modules in shared code breaks web builds',
      'TypeScript path aliases must be configured in both Metro and bundler (webpack/Next.js)',
      'CSS-in-JS libraries may not work cross-platform — use StyleSheet or Tamagui/Nativewind',
      'Testing shared code needs mock resolution for both platforms',
    ],
  },
];
