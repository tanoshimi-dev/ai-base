import type { MigrationGuide } from '../types.js';

export const RN_MIGRATION_GUIDES: MigrationGuide[] = [
  {
    id: 'expo-managed-to-bare',
    name: 'Expo Managed → Bare Workflow',
    description: 'Migrate from Expo managed workflow to bare workflow when you need full native code access.',
    keywords: ['expo', 'bare', 'eject', 'prebuild', 'native', 'managed to bare', 'custom native'],
    direction: 'expo-to-bare',
    steps: [
      {
        order: 1,
        title: 'Run expo prebuild',
        description: 'Generate the native ios/ and android/ directories from your Expo config.',
        commands: ['npx expo prebuild'],
        tips: ['This replaces the old "expo eject" command', 'Use --clean to regenerate from scratch'],
      },
      {
        order: 2,
        title: 'Review generated native code',
        description: 'Inspect the generated ios/ and android/ directories. Config plugins have been applied.',
        tips: ['Check ios/Podfile and android/app/build.gradle for correct settings'],
      },
      {
        order: 3,
        title: 'Install native dependencies',
        description: 'Install CocoaPods for iOS and sync Gradle for Android.',
        commands: ['cd ios && pod install', 'cd android && ./gradlew dependencies'],
      },
      {
        order: 4,
        title: 'Update .gitignore',
        description: 'Decide whether to track native directories. If using CNG (Continuous Native Generation), add ios/ and android/ to .gitignore.',
        tips: ['CNG approach: keep in .gitignore, regenerate with prebuild', 'Manual native: track in git for full control'],
      },
      {
        order: 5,
        title: 'Test on both platforms',
        description: 'Build and run on iOS and Android to verify everything works.',
        commands: ['npx expo run:ios', 'npx expo run:android'],
      },
      {
        order: 6,
        title: 'Update EAS Build config (if using)',
        description: 'Update eas.json to use custom build profiles for bare workflow.',
      },
    ],
    warnings: [
      'Expo Go will no longer work — use development builds (expo-dev-client) instead',
      'Some Expo modules may need config plugins applied manually',
      'OTA updates via expo-updates still work in bare workflow',
    ],
  },
  {
    id: 'bare-to-expo',
    name: 'Bare React Native → Expo (Prebuild)',
    description: 'Adopt Expo tooling in an existing bare React Native project using prebuild.',
    keywords: ['bare', 'expo', 'adopt', 'add expo', 'integrate', 'bare to expo'],
    direction: 'bare-to-expo',
    steps: [
      {
        order: 1,
        title: 'Install Expo packages',
        description: 'Add the core Expo packages to your project.',
        commands: ['npx install-expo-modules@latest'],
        tips: ['This automatically configures your native projects for Expo'],
      },
      {
        order: 2,
        title: 'Create app.json / app.config.js',
        description: 'Add Expo configuration file with your app name, slug, and platform settings.',
        tips: ['Start with minimal config and expand as needed'],
      },
      {
        order: 3,
        title: 'Install expo-dev-client',
        description: 'Replace Expo Go with a custom development client for your app.',
        commands: ['npx expo install expo-dev-client'],
      },
      {
        order: 4,
        title: 'Migrate native config to config plugins',
        description: 'Move native configuration from ios/ and android/ into app.config.js plugins for reproducible builds.',
        tips: ['Permissions, splash screen, app icon, and deep links can all be config plugins'],
      },
      {
        order: 5,
        title: 'Test prebuild cycle',
        description: 'Verify your app builds correctly through the prebuild pipeline.',
        commands: ['npx expo prebuild --clean', 'npx expo run:ios', 'npx expo run:android'],
      },
      {
        order: 6,
        title: 'Set up EAS Build (optional)',
        description: 'Configure cloud builds with EAS for CI/CD.',
        commands: ['npm install -g eas-cli', 'eas build:configure'],
      },
    ],
    warnings: [
      'Custom native modifications need to be ported to config plugins',
      'Some third-party native libraries may not have config plugins yet',
      'Test thoroughly — native build setup changes can cause subtle issues',
    ],
  },
  {
    id: 'expo-prebuild-cng',
    name: 'Continuous Native Generation (CNG) with Expo',
    description: 'Use Expo prebuild as a build step to auto-generate native projects from config, treating ios/ and android/ as build artifacts.',
    keywords: ['cng', 'continuous native generation', 'prebuild', 'config plugin', 'generate', 'reproducible'],
    direction: 'expo-prebuild',
    steps: [
      {
        order: 1,
        title: 'Understand CNG philosophy',
        description: 'CNG treats ios/ and android/ directories as generated output. All native config lives in app.config.js and config plugins.',
      },
      {
        order: 2,
        title: 'Add ios/ and android/ to .gitignore',
        description: 'Since native dirs are regenerated, they should not be tracked in version control.',
        commands: ['echo "ios/\nandroid/" >> .gitignore'],
      },
      {
        order: 3,
        title: 'Move native config to config plugins',
        description: 'Port all native modifications (permissions, build settings, Info.plist entries) to app.config.js plugins.',
        tips: [
          'Use withInfoPlist, withAndroidManifest for simple changes',
          'Use withDangerousMod for complex native modifications',
          'Many libraries ship their own config plugins',
        ],
      },
      {
        order: 4,
        title: 'Use prebuild in development',
        description: 'Regenerate native projects before building.',
        commands: ['npx expo prebuild --clean', 'npx expo run:ios'],
        tips: ['--clean deletes existing native dirs before regenerating'],
      },
      {
        order: 5,
        title: 'Configure CI to use prebuild',
        description: 'In CI/CD, run prebuild before the native build step. EAS Build does this automatically.',
        commands: ['npx expo prebuild --clean && cd ios && pod install && xcodebuild ...'],
      },
    ],
    warnings: [
      'Manual edits to ios/ or android/ will be lost on next prebuild --clean',
      'All native changes must be expressed as config plugins',
      'Debugging native issues requires understanding the generated output',
    ],
  },
  {
    id: 'class-to-functional',
    name: 'Class Components → Functional Components + Hooks',
    description: 'Migrate legacy class components to modern functional components with hooks.',
    keywords: ['class', 'functional', 'hooks', 'migrate', 'modernize', 'legacy', 'refactor', 'setState', 'lifecycle'],
    direction: 'eject',
    steps: [
      {
        order: 1,
        title: 'Identify class components',
        description: 'Search for extends React.Component or extends Component in your codebase.',
        commands: ['grep -r "extends.*Component" src/ --include="*.tsx" --include="*.ts"'],
      },
      {
        order: 2,
        title: 'Convert state to useState',
        description: 'Replace this.state and this.setState with useState hooks.',
        tips: ['Split large state objects into individual useState calls for better performance'],
      },
      {
        order: 3,
        title: 'Convert lifecycle methods to useEffect',
        description: 'componentDidMount → useEffect(..., []), componentDidUpdate → useEffect(..., [deps]), componentWillUnmount → useEffect cleanup.',
      },
      {
        order: 4,
        title: 'Extract reusable logic into custom hooks',
        description: 'Move shared logic (data fetching, subscriptions) into custom hooks for reuse.',
      },
      {
        order: 5,
        title: 'Remove class bindings',
        description: 'Arrow functions and hooks eliminate the need for this.handleClick = this.handleClick.bind(this).',
      },
      {
        order: 6,
        title: 'Test each converted component',
        description: 'Verify behavior is identical after conversion. Pay special attention to lifecycle timing differences.',
      },
    ],
    warnings: [
      'useEffect cleanup runs differently than componentWillUnmount in some edge cases',
      'Error boundaries still require class components (as of React 18)',
      'Convert incrementally — class and functional components can coexist',
    ],
  },
];
