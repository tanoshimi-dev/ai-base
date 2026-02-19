import type { TemplateCategory } from '../types.js';

export const RN_TEMPLATES: TemplateCategory[] = [
  // ── Official Starters ──────────────────────────────────────────
  {
    id: 'expo-managed',
    category: 'official',
    name: 'Expo (Managed Workflow)',
    description:
      'The recommended way to start a new React Native project. Expo handles native builds, OTA updates, and provides a rich set of APIs.',
    keywords: [
      'expo',
      'managed',
      'beginner',
      'starter',
      'create-expo-app',
      'new project',
      'quick start',
    ],
    entries: [
      {
        name: 'create-expo-app (blank TypeScript)',
        description:
          'Minimal Expo project with TypeScript. The fastest way to start a new React Native app.',
        recommended: true,
        setupCommands: [
          'npx create-expo-app@latest my-app',
          'cd my-app',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'Expo SDK',
          'OTA updates',
          'Expo Go for development',
          'EAS Build for production',
        ],
        bestFor:
          'Beginners, prototyping, most production apps. Best default choice.',
        pros: [
          'Fastest setup (under 1 minute)',
          'No Xcode or Android Studio required for development',
          'OTA updates with expo-updates',
          'Expo SDK provides 50+ well-maintained native APIs',
          'EAS Build handles native compilation in the cloud',
          'Expo Go app for instant development preview',
        ],
        cons: [
          'Some native modules require custom dev client or EAS Build',
          'Slightly larger app size due to Expo runtime',
          'Ejecting (prebuild) needed for custom native code',
        ],
        links: {
          docs: 'https://docs.expo.dev/get-started/create-a-project/',
          github: 'https://github.com/expo/expo',
        },
      },
      {
        name: 'create-expo-app with Expo Router',
        description:
          'Expo starter with file-based routing (similar to Next.js). Includes typed routes and layouts.',
        recommended: false,
        setupCommands: [
          'npx create-expo-app@latest my-app --template tabs',
          'cd my-app',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'Expo Router (file-based routing)',
          'Tab navigation',
          'Typed routes',
          'Layout system',
        ],
        bestFor:
          'Apps needing navigation from day one. Developers familiar with Next.js.',
        pros: [
          'File-based routing like Next.js',
          'Deep linking works automatically',
          'Typed routes with TypeScript',
          'Tab navigation pre-configured',
        ],
        cons: [
          'Opinionated routing approach',
          'Learning curve if unfamiliar with file-based routing',
          'Less flexibility than @react-navigation for complex flows',
        ],
        links: {
          docs: 'https://docs.expo.dev/router/introduction/',
          github: 'https://github.com/expo/expo/tree/main/packages/expo-router',
        },
      },
    ],
  },
  {
    id: 'expo-bare',
    category: 'official',
    name: 'Expo (Bare / Prebuild)',
    description:
      'Full native project access with Expo tooling. Use Continuous Native Generation (CNG) via app.json config plugins.',
    keywords: [
      'expo',
      'bare',
      'prebuild',
      'native',
      'eject',
      'custom native',
      'config plugin',
    ],
    entries: [
      {
        name: 'Expo with prebuild (CNG)',
        description:
          'Start with Expo, use `npx expo prebuild` to generate native projects when you need custom native code. Recommended over full bare workflow.',
        recommended: true,
        setupCommands: [
          'npx create-expo-app@latest my-app',
          'cd my-app',
          'npx expo prebuild',
          'npx expo run:ios   # or run:android',
        ],
        features: [
          'TypeScript',
          'Expo SDK + custom native code',
          'Config plugins for native configuration',
          'EAS Build compatible',
          'Full ios/ and android/ directories',
        ],
        bestFor:
          'Apps needing custom native modules (e.g., Bluetooth, custom TurboModules) while keeping Expo tooling.',
        pros: [
          'Best of both worlds: Expo SDK + full native access',
          'Config plugins automate native config changes',
          'Can regenerate native projects from app.json anytime',
          'EAS Build still works',
        ],
        cons: [
          'Must manage native projects after prebuild',
          'Config plugin ecosystem may not cover all cases',
          'More complex setup than pure managed workflow',
        ],
        links: {
          docs: 'https://docs.expo.dev/workflow/prebuild/',
          github: 'https://github.com/expo/expo',
        },
      },
    ],
  },
  {
    id: 'react-native-cli',
    category: 'official',
    name: 'React Native CLI (Bare)',
    description:
      'The traditional bare React Native setup using @react-native-community/cli. Full control over native projects from the start.',
    keywords: [
      'react-native',
      'cli',
      'bare',
      'vanilla',
      'community cli',
      'init',
      'native',
    ],
    entries: [
      {
        name: 'React Native Community CLI',
        description:
          'Bare React Native project with full native control. No Expo SDK. Suitable when you need maximum native flexibility.',
        recommended: false,
        setupCommands: [
          'npx @react-native-community/cli init MyApp',
          'cd MyApp',
          'npx react-native run-ios   # or run-android',
        ],
        features: [
          'TypeScript',
          'Full native project access',
          'Hermes JS engine',
          'Flipper debugging (pre-0.73)',
          'New Architecture ready',
        ],
        bestFor:
          'Teams with strong native iOS/Android experience. Projects with heavy custom native code.',
        pros: [
          'Full control over native projects from day one',
          'No abstraction layer between you and native code',
          'Smaller app size (no Expo runtime)',
          'Easier integration with existing native libraries',
        ],
        cons: [
          'Requires Xcode and Android Studio setup',
          'Manual native dependency linking sometimes needed',
          'No OTA updates without third-party service',
          'More boilerplate for common tasks (permissions, icons, splash)',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/getting-started-without-a-framework',
          github: 'https://github.com/react-native-community/cli',
        },
      },
    ],
  },

  // ── Community Boilerplates ─────────────────────────────────────
  {
    id: 'ignite',
    category: 'community',
    name: 'Ignite by Infinite Red',
    description:
      'Battle-tested React Native boilerplate used by consultancies and startups. Includes navigation, state management, theming, and generators.',
    keywords: [
      'ignite',
      'infinite red',
      'boilerplate',
      'generator',
      'production',
      'mobx',
      'starter kit',
    ],
    entries: [
      {
        name: 'Ignite',
        description:
          'Full-featured boilerplate with MobX-State-Tree, React Navigation, theming, i18n, and CLI generators for screens/models/components.',
        recommended: true,
        setupCommands: [
          'npx ignite-cli new my-app',
          'cd my-app',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'MobX-State-Tree (state management)',
          'React Navigation',
          'Theming system',
          'i18n (internationalization)',
          'CLI generators (screens, models, components)',
          'Expo compatible',
          'Testing setup (Jest + RNTL)',
        ],
        bestFor:
          'Production apps, consultancy projects, teams wanting a proven architecture.',
        pros: [
          'Battle-tested by 100+ production apps',
          'CLI generators save significant time',
          'Well-documented architecture decisions',
          'Active community and maintenance by Infinite Red',
          'Expo and bare RN support',
        ],
        cons: [
          'Opinionated: MobX-State-Tree may not suit all teams',
          'Learning curve for MST if unfamiliar',
          'Includes many features you may not need',
        ],
        links: {
          docs: 'https://docs.infinite.red/ignite-cli/',
          github: 'https://github.com/infinitered/ignite',
        },
      },
    ],
  },
  {
    id: 'obytes-starter',
    category: 'community',
    name: 'Obytes React Native Starter',
    description:
      'Production-ready starter with modern stack: Expo, TanStack Query, Zustand, Nativewind, and comprehensive testing setup.',
    keywords: [
      'obytes',
      'starter',
      'zustand',
      'nativewind',
      'tanstack',
      'modern',
      'production',
    ],
    entries: [
      {
        name: 'Obytes Starter',
        description:
          'Modern React Native starter with Expo, Zustand, TanStack Query, Nativewind (Tailwind CSS), i18n, and testing setup.',
        recommended: true,
        setupCommands: [
          'npx create-obytes-app my-app',
          'cd my-app',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'Expo + Expo Router',
          'Zustand (state management)',
          'TanStack Query (data fetching)',
          'Nativewind (Tailwind CSS)',
          'i18n',
          'Jest + RNTL testing',
          'Husky + lint-staged',
          'GitHub Actions CI',
        ],
        bestFor:
          'Teams wanting a modern stack with Tailwind-style styling and Zustand.',
        pros: [
          'Modern, well-maintained stack',
          'Nativewind for Tailwind CSS in RN',
          'Comprehensive testing and CI setup',
          'Good documentation',
        ],
        cons: [
          'Opinionated stack (Zustand + Nativewind)',
          'Smaller community compared to Ignite',
        ],
        links: {
          docs: 'https://starter.obytes.com/',
          github: 'https://github.com/obytes/react-native-template-obytes',
        },
      },
    ],
  },
  {
    id: 'rn-boilerplate',
    category: 'community',
    name: 'React Native Boilerplate (TheCodingMachine)',
    description:
      'Scalable boilerplate with Redux Toolkit, dark mode, i18n, and a well-organized folder structure.',
    keywords: [
      'thecodingmachine',
      'boilerplate',
      'redux',
      'redux toolkit',
      'dark mode',
      'i18n',
    ],
    entries: [
      {
        name: 'TheCodingMachine Boilerplate',
        description:
          'Feature-based architecture with Redux Toolkit, i18n, dark mode support, and environment configuration.',
        recommended: false,
        setupCommands: [
          'npx react-native init MyApp --template @thecodingmachine/react-native-boilerplate',
          'cd MyApp',
          'npx react-native run-ios',
        ],
        features: [
          'TypeScript',
          'Redux Toolkit',
          'React Navigation',
          'i18n (react-i18next)',
          'Dark mode',
          'Environment config (.env)',
          'Feature-based folder structure',
        ],
        bestFor:
          'Teams preferring Redux Toolkit for state management.',
        pros: [
          'Well-organized folder structure',
          'Redux Toolkit with RTK Query',
          'Dark mode out of the box',
          'Environment-based configuration',
        ],
        cons: [
          'Based on bare RN CLI (not Expo)',
          'Less actively maintained than Ignite or Obytes',
          'Redux boilerplate can feel heavy for small apps',
        ],
        links: {
          docs: 'https://thecodingmachine.github.io/react-native-boilerplate/',
          github:
            'https://github.com/thecodingmachine/react-native-boilerplate',
        },
      },
    ],
  },

  // ── Full-Stack / Monorepo ──────────────────────────────────────
  {
    id: 'create-t3-turbo',
    category: 'fullstack',
    name: 'create-t3-turbo',
    description:
      'Full-stack monorepo with Next.js web + Expo mobile, using tRPC for type-safe API and Turborepo for build orchestration.',
    keywords: [
      't3',
      'turbo',
      'monorepo',
      'next.js',
      'trpc',
      'prisma',
      'fullstack',
      'full-stack',
      'web and mobile',
    ],
    entries: [
      {
        name: 'create-t3-turbo',
        description:
          'Turborepo monorepo with Next.js (web) + Expo (mobile) + tRPC + NextAuth + Prisma/Drizzle. Type-safe from DB to mobile UI.',
        recommended: true,
        setupCommands: [
          'npx create-turbo@latest -e https://github.com/t3-oss/create-t3-turbo',
          'cd my-app',
          'pnpm install',
          'pnpm dev',
        ],
        features: [
          'TypeScript',
          'Turborepo (monorepo)',
          'Next.js (web app)',
          'Expo (mobile app)',
          'tRPC (type-safe API)',
          'NextAuth (authentication)',
          'Prisma or Drizzle (ORM)',
          'Tailwind CSS (web) + Nativewind (mobile)',
        ],
        bestFor:
          'Teams building both web and mobile with shared backend. Full-stack TypeScript developers.',
        pros: [
          'End-to-end type safety (DB → API → UI)',
          'Shared code between web and mobile',
          'Modern stack with best-in-class tools',
          'Active T3 community',
        ],
        cons: [
          'Complex setup with many moving parts',
          'Steep learning curve (tRPC, Turborepo, Prisma)',
          'Requires understanding of monorepo tooling',
          'Overkill for mobile-only projects',
        ],
        links: {
          docs: 'https://create.t3.gg/',
          github: 'https://github.com/t3-oss/create-t3-turbo',
        },
      },
    ],
  },
  {
    id: 'solito',
    category: 'fullstack',
    name: 'Solito',
    description:
      'Shared navigation between Next.js and Expo using a unified API. Cross-platform routing made simple.',
    keywords: [
      'solito',
      'next.js',
      'expo',
      'shared navigation',
      'cross-platform',
      'universal',
      'web and mobile',
    ],
    entries: [
      {
        name: 'Solito Starter',
        description:
          'Monorepo with Next.js + Expo sharing navigation and screens. Uses solito for unified routing API.',
        recommended: false,
        setupCommands: [
          'npx create-solito-app@latest my-app',
          'cd my-app',
          'yarn install',
          'yarn web   # start Next.js',
          'yarn native # start Expo',
        ],
        features: [
          'TypeScript',
          'Next.js (web)',
          'Expo (mobile)',
          'Solito (shared navigation)',
          'Monorepo (yarn workspaces)',
        ],
        bestFor:
          'Teams wanting to share screens/navigation between web and mobile with minimal abstraction.',
        pros: [
          'Simple unified navigation API',
          'Share screen components between web and mobile',
          'Less opinionated than T3 Turbo',
          'Good documentation by Fernando Rojo',
        ],
        cons: [
          'Focused on navigation sharing only (no backend)',
          'Smaller community than T3',
          'Still need to choose state management, data fetching, etc.',
        ],
        links: {
          docs: 'https://solito.dev/',
          github: 'https://github.com/nandorojo/solito',
        },
      },
    ],
  },
  {
    id: 'tamagui-starter',
    category: 'fullstack',
    name: 'Tamagui Starter',
    description:
      'Universal UI starter with Tamagui component library, Expo, and optional Next.js. Optimized for cross-platform styling.',
    keywords: [
      'tamagui',
      'universal',
      'ui',
      'cross-platform',
      'styling',
      'design system',
      'web and mobile',
    ],
    entries: [
      {
        name: 'Tamagui Starter',
        description:
          'Cross-platform starter with Tamagui UI components that compile to optimized native views and CSS.',
        recommended: false,
        setupCommands: [
          'npm create tamagui@latest',
          'cd my-app',
          'yarn install',
          'yarn start',
        ],
        features: [
          'TypeScript',
          'Tamagui (universal UI)',
          'Expo (mobile)',
          'Next.js (web, optional)',
          'Optimizing compiler',
          'Theme system',
        ],
        bestFor:
          'Teams building a design system that works across web and mobile with optimized performance.',
        pros: [
          'Excellent cross-platform UI components',
          'Optimizing compiler for near-native performance',
          'Powerful theme system',
          'Works with Expo and Next.js',
        ],
        cons: [
          'Learning curve for Tamagui API',
          'Younger project, ecosystem still growing',
          'Compiler setup can be complex',
        ],
        links: {
          docs: 'https://tamagui.dev/',
          github: 'https://github.com/tamagui/tamagui',
        },
      },
    ],
  },

  // ── Expo Templates (Specific Use Cases) ────────────────────────
  {
    id: 'expo-blank-ts',
    category: 'expo-template',
    name: 'Expo Blank TypeScript',
    description:
      'Minimal Expo template with just TypeScript. Clean slate for building from scratch.',
    keywords: [
      'expo',
      'blank',
      'typescript',
      'minimal',
      'clean',
      'empty',
      'scratch',
    ],
    entries: [
      {
        name: 'expo-template-blank-typescript',
        description:
          'The most minimal Expo starter. Just App.tsx and TypeScript config. Build everything from scratch.',
        recommended: true,
        setupCommands: [
          'npx create-expo-app@latest my-app --template blank-typescript',
          'cd my-app',
          'npx expo start',
        ],
        features: ['TypeScript', 'Expo SDK', 'Minimal boilerplate'],
        bestFor:
          'Developers who want full control over architecture decisions from the start.',
        pros: [
          'Zero opinionated decisions',
          'Smallest possible starting point',
          'Add only what you need',
        ],
        cons: [
          'Must set up navigation, state management, etc. manually',
          'More initial work for production apps',
        ],
        links: {
          docs: 'https://docs.expo.dev/get-started/create-a-project/',
          github: 'https://github.com/expo/expo/tree/main/templates/expo-template-blank-typescript',
        },
      },
    ],
  },
  {
    id: 'expo-tabs',
    category: 'expo-template',
    name: 'Expo Tabs Template',
    description:
      'Expo template with tab-based navigation pre-configured using Expo Router.',
    keywords: [
      'expo',
      'tabs',
      'navigation',
      'tab bar',
      'bottom tabs',
      'expo router',
    ],
    entries: [
      {
        name: 'expo-template-tabs',
        description:
          'Expo starter with bottom tab navigation, Expo Router, and example screens. Ready for apps with tabbed interfaces.',
        recommended: false,
        setupCommands: [
          'npx create-expo-app@latest my-app --template tabs',
          'cd my-app',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'Expo Router',
          'Bottom tab navigation',
          'Example screens',
          'File-based routing',
        ],
        bestFor:
          'Apps with tab-based navigation (social, e-commerce, dashboard style).',
        pros: [
          'Navigation ready out of the box',
          'Good starting point for multi-tab apps',
          'Expo Router with typed routes',
        ],
        cons: [
          'Tab layout may not suit all app types',
          'Must restructure if you need drawer or stack-only navigation',
        ],
        links: {
          docs: 'https://docs.expo.dev/router/introduction/',
          github: 'https://github.com/expo/expo/tree/main/templates/expo-template-tabs',
        },
      },
    ],
  },
  {
    id: 'expo-with-router',
    category: 'expo-template',
    name: 'Expo Router (File-based Routing)',
    description:
      'Expo template focused on file-based routing with layouts, nested routes, and deep linking.',
    keywords: [
      'expo router',
      'file-based routing',
      'routing',
      'deep linking',
      'layouts',
      'nested routes',
    ],
    entries: [
      {
        name: 'Expo Router template',
        description:
          'Full Expo Router setup with layout routes, nested navigation, and automatic deep linking. Similar to Next.js App Router.',
        recommended: false,
        setupCommands: [
          'npx create-expo-app@latest my-app',
          'cd my-app',
          'npx expo install expo-router expo-linking expo-constants',
          'npx expo start',
        ],
        features: [
          'TypeScript',
          'Expo Router',
          'File-based routing',
          'Layout routes',
          'Automatic deep linking',
          'Typed routes',
          'API routes (experimental)',
        ],
        bestFor:
          'Complex navigation apps. Teams familiar with Next.js App Router.',
        pros: [
          'Automatic deep linking from file structure',
          'Layout system for shared UI',
          'Type-safe navigation',
          'SEO support for web builds',
        ],
        cons: [
          'Different mental model from React Navigation',
          'Less flexible for highly dynamic navigation',
          'API routes still experimental',
        ],
        links: {
          docs: 'https://docs.expo.dev/router/introduction/',
          github: 'https://github.com/expo/expo/tree/main/packages/expo-router',
        },
      },
    ],
  },
];
