import type { DeeplinkGuide } from '../types.js';

export const RN_DEEPLINK_GUIDES: DeeplinkGuide[] = [
  {
    id: 'react-navigation-linking',
    name: 'React Navigation Deep Linking Setup',
    description: 'Configure deep linking with React Navigation linking config for handling URL-based navigation.',
    keywords: ['react navigation', 'linking', 'deep link', 'url', 'route', 'navigate', 'scheme'],
    platform: 'common',
    steps: [
      {
        order: 1,
        title: 'Define URL scheme in app config',
        description: 'Register your custom URL scheme (e.g., myapp://) in both iOS and Android.',
        tips: ['Expo: set scheme in app.json', 'Bare: modify Info.plist (iOS) and AndroidManifest.xml (Android)'],
      },
      {
        order: 2,
        title: 'Create linking configuration',
        description: 'Define the mapping between URL paths and navigation screens.',
        codeExample: 'const linking = {\n  prefixes: ["myapp://", "https://myapp.com"],\n  config: {\n    screens: {\n      Home: "",\n      Profile: "user/:id",\n      Settings: "settings",\n      NotFound: "*",\n    },\n  },\n};\n\n<NavigationContainer linking={linking}>\n  {/* navigators */}\n</NavigationContainer>',
      },
      {
        order: 3,
        title: 'Handle nested navigators',
        description: 'For nested stack/tab navigators, nest the screen config accordingly.',
        codeExample: 'config: {\n  screens: {\n    HomeTabs: {\n      screens: {\n        Feed: "feed",\n        Profile: "profile/:id",\n      },\n    },\n    Modal: "modal",\n  },\n}',
      },
      {
        order: 4,
        title: 'Test deep links',
        description: 'Test on device/simulator using CLI commands.',
        tips: [
          'iOS Simulator: xcrun simctl openurl booted myapp://user/123',
          'Android: adb shell am start -a android.intent.action.VIEW -d "myapp://user/123"',
          'Expo: npx uri-scheme open myapp://user/123 --ios',
        ],
      },
    ],
  },
  {
    id: 'ios-universal-links',
    name: 'iOS Universal Links',
    description: 'Set up Apple Universal Links to open your app from HTTPS URLs without a custom scheme.',
    keywords: ['universal links', 'apple', 'ios', 'aasa', 'associated domains', 'https', 'app links ios'],
    platform: 'ios',
    steps: [
      {
        order: 1,
        title: 'Enable Associated Domains',
        description: 'Add the Associated Domains capability in Xcode and configure your domain.',
        codeExample: '// In Xcode → Signing & Capabilities → + Associated Domains\n// Add: applinks:yourdomain.com',
        tips: ['For Expo, use expo-config-plugin or app.json ios.associatedDomains'],
      },
      {
        order: 2,
        title: 'Create apple-app-site-association file',
        description: 'Host a JSON file at https://yourdomain.com/.well-known/apple-app-site-association',
        codeExample: '{\n  "applinks": {\n    "apps": [],\n    "details": [\n      {\n        "appID": "TEAMID.com.yourcompany.yourapp",\n        "paths": ["/user/*", "/product/*"]\n      }\n    ]\n  }\n}',
        tips: [
          'Must be served over HTTPS with content-type application/json',
          'No .json extension — the file name is apple-app-site-association',
          'Apple CDN caches the file — changes may take 24-48 hours to propagate',
        ],
      },
      {
        order: 3,
        title: 'Handle incoming links in app',
        description: 'React Navigation linking config will automatically handle Universal Links if prefixes include your domain.',
        codeExample: 'const linking = {\n  prefixes: ["https://yourdomain.com"],\n  config: { screens: { Product: "product/:id" } },\n};',
      },
      {
        order: 4,
        title: 'Test Universal Links',
        description: 'Universal Links only work on real devices, not simulators.',
        tips: [
          'Send yourself an iMessage with the link and tap it',
          'Use Apple\'s swcd-tools or validator to check the AASA file',
          'Long-press the link to see "Open in App" option',
        ],
      },
    ],
  },
  {
    id: 'android-app-links',
    name: 'Android App Links',
    description: 'Set up verified Android App Links to open your app from HTTPS URLs without disambiguation.',
    keywords: ['app links', 'android', 'intent filter', 'assetlinks', 'verified', 'deep link android'],
    platform: 'android',
    steps: [
      {
        order: 1,
        title: 'Add intent filter to AndroidManifest.xml',
        description: 'Declare the URL patterns your app handles.',
        codeExample: '<activity android:name=".MainActivity">\n  <intent-filter android:autoVerify="true">\n    <action android:name="android.intent.action.VIEW" />\n    <category android:name="android.intent.category.DEFAULT" />\n    <category android:name="android.intent.category.BROWSABLE" />\n    <data android:scheme="https" android:host="yourdomain.com" android:pathPrefix="/product" />\n  </intent-filter>\n</activity>',
        tips: ['android:autoVerify="true" enables App Links verification'],
      },
      {
        order: 2,
        title: 'Host Digital Asset Links file',
        description: 'Create assetlinks.json at https://yourdomain.com/.well-known/assetlinks.json',
        codeExample: '[{\n  "relation": ["delegate_permission/common.handle_all_urls"],\n  "target": {\n    "namespace": "android_app",\n    "package_name": "com.yourcompany.yourapp",\n    "sha256_cert_fingerprints": [\n      "AA:BB:CC:DD:...(SHA-256 of your signing key)"\n    ]\n  }\n}]',
        tips: [
          'Get SHA-256: keytool -list -v -keystore your-key.keystore',
          'For Play App Signing: get from Play Console → Setup → App signing',
          'Include both debug and release fingerprints during development',
        ],
      },
      {
        order: 3,
        title: 'Handle in React Navigation',
        description: 'Add your domain to the linking config prefixes.',
        codeExample: 'const linking = {\n  prefixes: ["https://yourdomain.com", "myapp://"],\n  config: { screens: { Product: "product/:id" } },\n};',
      },
      {
        order: 4,
        title: 'Test App Links',
        description: 'Verify the link handling works correctly.',
        tips: [
          'adb shell am start -a android.intent.action.VIEW -d "https://yourdomain.com/product/123"',
          'Check verification: adb shell pm get-app-links com.yourcompany.yourapp',
          'Use Google Digital Asset Links tester tool',
        ],
      },
    ],
  },
  {
    id: 'dynamic-links',
    name: 'Dynamic / Deferred Deep Links',
    description: 'Implement smart links that work across install/non-install states and pass data through app store.',
    keywords: ['dynamic links', 'deferred', 'smart link', 'branch', 'attribution', 'install referral', 'marketing'],
    platform: 'common',
    steps: [
      {
        order: 1,
        title: 'Choose a dynamic link service',
        description: 'Firebase Dynamic Links (deprecated 2025) → migrate to Branch.io, Adjust, or custom solution.',
        tips: [
          'Branch.io: most popular, full attribution + deferred deep linking',
          'Adjust: good for marketing attribution focus',
          'Custom: expo-linking + server-side redirect for simple cases',
        ],
      },
      {
        order: 2,
        title: 'Install SDK',
        description: 'Add the chosen service SDK to your React Native project.',
        codeExample: '// Branch.io example\nnpm install react-native-branch\ncd ios && pod install',
      },
      {
        order: 3,
        title: 'Configure link handling',
        description: 'Initialize the SDK and subscribe to incoming link events.',
        codeExample: '// Branch.io example\nimport branch from "react-native-branch";\n\nbranch.subscribe(({ error, params }) => {\n  if (error) return;\n  if (params["+clicked_branch_link"]) {\n    navigation.navigate("Product", { id: params.productId });\n  }\n});',
      },
      {
        order: 4,
        title: 'Create links programmatically',
        description: 'Generate shareable deep links from within the app.',
        codeExample: 'const buo = await branch.createBranchUniversalObject("product/123", {\n  title: "Cool Product",\n});\nconst { url } = await buo.generateShortUrl({}, { feature: "share" });',
      },
    ],
  },
  {
    id: 'expo-linking',
    name: 'Expo Linking API',
    description: 'Use expo-linking for URL handling in Expo apps, supporting both custom schemes and universal links.',
    keywords: ['expo', 'linking', 'expo-linking', 'url', 'scheme', 'expo router', 'file-based routing'],
    platform: 'common',
    steps: [
      {
        order: 1,
        title: 'Install expo-linking',
        description: 'Add the Expo linking package.',
        commands: ['npx expo install expo-linking'],
      },
      {
        order: 2,
        title: 'Configure scheme in app.json',
        description: 'Define your custom URL scheme.',
        codeExample: '// app.json\n{\n  "expo": {\n    "scheme": "myapp",\n    "ios": {\n      "associatedDomains": ["applinks:yourdomain.com"]\n    }\n  }\n}',
      },
      {
        order: 3,
        title: 'Handle URLs with Expo Router',
        description: 'If using Expo Router, deep links are handled automatically via file-based routing.',
        codeExample: '// app/product/[id].tsx handles myapp://product/123\nexport default function ProductScreen() {\n  const { id } = useLocalSearchParams();\n  return <Text>Product {id}</Text>;\n}',
        tips: ['Expo Router maps file paths to URL paths automatically'],
      },
      {
        order: 4,
        title: 'Handle URLs manually (without Expo Router)',
        description: 'Use Linking.addEventListener for manual URL handling.',
        codeExample: 'import * as Linking from "expo-linking";\n\nLinking.addEventListener("url", ({ url }) => {\n  const parsed = Linking.parse(url);\n  // parsed.path, parsed.queryParams\n});',
      },
    ],
  },
];
