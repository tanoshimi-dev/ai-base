import type { GuideCategory } from '../types.js';

export const RN_BEST_PRACTICES: GuideCategory[] = [
  // ═══════════════════════════════════════
  // ARCHITECTURE
  // ═══════════════════════════════════════
  {
    id: 'folder-structure',
    domain: 'architecture',
    name: 'Project Folder Structure',
    description: 'Recommended folder organization for scalable RN apps',
    keywords: ['folder', 'structure', 'directory', 'project structure', 'organization'],
    entries: [
      {
        name: 'Feature-based structure',
        description:
          'Organize by feature/domain rather than by file type. Each feature folder contains its own components, hooks, utils, and types.',
        recommended: true,
        codeExample: `src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── services/
│   │   └── types.ts
│   ├── home/
│   └── profile/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── constants/
├── navigation/
├── services/        # API clients, storage
├── store/           # Global state
└── App.tsx`,
        pros: [
          'Features are self-contained and easy to find',
          'Easy to delete or extract a feature',
          'Reduces cross-feature coupling',
          'Scales well as the app grows',
        ],
        cons: [
          'Shared code placement can be ambiguous',
          'Requires discipline to maintain boundaries',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/getting-started',
        },
      },
      {
        name: 'Layer-based structure',
        description:
          'Organize by technical layer: components/, screens/, hooks/, services/. Common in smaller projects.',
        recommended: false,
        codeExample: `src/
├── components/
├── screens/
├── hooks/
├── services/
├── utils/
├── types/
├── navigation/
└── App.tsx`,
        pros: [
          'Simple and familiar',
          'Works well for small apps (<20 screens)',
        ],
        cons: [
          'Folders grow large quickly',
          'Hard to find related files across layers',
          'Tight coupling between distant files',
        ],
        links: {},
      },
    ],
  },
  {
    id: 'state-management',
    domain: 'architecture',
    name: 'State Management',
    description: 'Global and local state management approaches',
    keywords: ['state', 'state management', 'redux', 'zustand', 'jotai', 'context', 'global state'],
    entries: [
      {
        name: 'Zustand',
        description:
          'Lightweight state management with a simple hook-based API. No boilerplate, no providers needed.',
        recommended: true,
        setupSteps: ['npm install zustand'],
        codeExample: `import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));

// In component:
const user = useAuthStore((state) => state.user);`,
        pros: [
          'Minimal boilerplate',
          'No Provider wrapper needed',
          'TypeScript-friendly',
          'Built-in middleware (persist, devtools)',
          'Small bundle size (~1KB)',
        ],
        cons: [
          'Less structured than Redux for very large apps',
          'Smaller ecosystem than Redux',
        ],
        links: {
          docs: 'https://zustand-demo.pmnd.rs/',
          github: 'https://github.com/pmndrs/zustand',
        },
      },
      {
        name: 'Redux Toolkit',
        description:
          'Official Redux with simplified API. Best for large teams and complex state logic.',
        recommended: false,
        setupSteps: [
          'npm install @reduxjs/toolkit react-redux',
        ],
        codeExample: `import { createSlice, configureStore } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null },
  reducers: {
    login: (state, action) => { state.user = action.payload; },
    logout: (state) => { state.user = null; },
  },
});`,
        pros: [
          'Predictable state updates',
          'Excellent DevTools',
          'Large ecosystem and community',
          'RTK Query for API caching',
        ],
        cons: [
          'More boilerplate than alternatives',
          'Steeper learning curve',
          'Larger bundle size',
        ],
        links: {
          docs: 'https://redux-toolkit.js.org/',
          github: 'https://github.com/reduxjs/redux-toolkit',
        },
      },
      {
        name: 'Jotai',
        description:
          'Atomic state management. Each piece of state is an independent atom. Great for fine-grained reactivity.',
        recommended: false,
        setupSteps: ['npm install jotai'],
        codeExample: `import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

// In component:
const [count, setCount] = useAtom(countAtom);`,
        pros: [
          'Very fine-grained re-renders',
          'No providers needed (optional)',
          'Composable atoms (derived state)',
          'Tiny bundle size',
        ],
        cons: [
          'Can be hard to trace data flow with many atoms',
          'Less structured for large apps',
        ],
        links: {
          docs: 'https://jotai.org/',
          github: 'https://github.com/pmndrs/jotai',
        },
      },
      {
        name: 'React Context',
        description:
          'Built-in React state sharing. Good for low-frequency updates (theme, locale). Avoid for high-frequency state.',
        recommended: false,
        codeExample: `const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}`,
        pros: [
          'No external dependency',
          'Built into React',
          'Good for theme/locale/auth state',
        ],
        cons: [
          'Re-renders all consumers on any change',
          'No middleware or DevTools',
          'Not suitable for high-frequency updates',
        ],
        links: {
          docs: 'https://react.dev/reference/react/useContext',
        },
      },
    ],
  },
  {
    id: 'api-layer',
    domain: 'architecture',
    name: 'API & Data Fetching',
    description: 'HTTP client and server state management patterns',
    keywords: ['api', 'fetch', 'http', 'rest', 'graphql', 'react query', 'tanstack', 'axios', 'data fetching'],
    entries: [
      {
        name: 'TanStack Query (React Query)',
        description:
          'Server state management with caching, background refetching, pagination, and optimistic updates.',
        recommended: true,
        setupSteps: ['npm install @tanstack/react-query'],
        codeExample: `import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => r.json()),
});

const mutation = useMutation({
  mutationFn: (newUser) => fetch('/api/users', {
    method: 'POST', body: JSON.stringify(newUser)
  }),
});`,
        pros: [
          'Automatic caching and background refetching',
          'Pagination and infinite scroll support',
          'Optimistic updates',
          'DevTools available',
        ],
        cons: [
          'Learning curve for cache invalidation',
          'Adds to bundle size',
        ],
        links: {
          docs: 'https://tanstack.com/query/latest',
          github: 'https://github.com/TanStack/query',
        },
      },
      {
        name: 'Axios',
        description:
          'HTTP client with interceptors, request/response transformation, and automatic JSON parsing.',
        recommended: false,
        setupSteps: ['npm install axios'],
        pros: [
          'Request/response interceptors',
          'Automatic JSON parsing',
          'Request cancellation',
          'Wide adoption',
        ],
        cons: [
          'Larger bundle than fetch',
          'Does not handle caching (pair with React Query)',
        ],
        links: {
          docs: 'https://axios-http.com/',
          github: 'https://github.com/axios/axios',
        },
      },
    ],
  },
  {
    id: 'typescript-config',
    domain: 'architecture',
    name: 'TypeScript Configuration',
    description: 'Recommended TypeScript setup and strict mode settings for RN',
    keywords: ['typescript', 'ts', 'tsconfig', 'type', 'strict mode'],
    entries: [
      {
        name: 'Strict TypeScript config',
        description:
          'Enable strict mode and path aliases for better type safety and imports.',
        recommended: true,
        codeExample: `// tsconfig.json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}

// babel.config.js (for path aliases)
plugins: [
  ['module-resolver', {
    root: ['.'],
    alias: { '@': './src' }
  }]
]`,
        setupSteps: [
          'npm install -D babel-plugin-module-resolver',
          'Configure paths in tsconfig.json',
          'Add module-resolver plugin to babel.config.js',
        ],
        pros: [
          'Catches bugs at compile time',
          'Clean imports with @ prefix',
          'Better IDE autocompletion',
        ],
        cons: [
          'Initial setup effort for path aliases',
          'Stricter rules may slow initial development',
        ],
        links: {
          docs: 'https://www.typescriptlang.org/tsconfig',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // TESTING
  // ═══════════════════════════════════════
  {
    id: 'unit-testing',
    domain: 'testing',
    name: 'Unit Testing',
    description: 'Unit testing setup and patterns for React Native',
    keywords: ['unit test', 'jest', 'testing', 'test'],
    entries: [
      {
        name: 'Jest + React Native Testing Library',
        description:
          'The standard testing stack. Jest as test runner, RNTL for component rendering.',
        recommended: true,
        setupSteps: [
          'npm install -D @testing-library/react-native @testing-library/jest-native',
          'Jest is pre-configured in RN projects',
          'Add to jest.config.js: setupFilesAfterSetup: ["@testing-library/jest-native/extend-expect"]',
        ],
        codeExample: `import { render, screen, fireEvent } from '@testing-library/react-native';
import { LoginButton } from './LoginButton';

test('calls onPress when pressed', () => {
  const onPress = jest.fn();
  render(<LoginButton onPress={onPress} />);

  fireEvent.press(screen.getByText('Login'));
  expect(onPress).toHaveBeenCalledTimes(1);
});`,
        pros: [
          'Tests component behavior, not implementation',
          'Fast and reliable',
          'Works with CI/CD',
          'Strong community adoption',
        ],
        cons: [
          'Cannot test native module behavior',
          'Mocking native modules can be tedious',
        ],
        links: {
          docs: 'https://callstack.github.io/react-native-testing-library/',
          github: 'https://github.com/callstack/react-native-testing-library',
        },
      },
    ],
  },
  {
    id: 'e2e-testing',
    domain: 'testing',
    name: 'End-to-End Testing',
    description: 'E2E testing frameworks for testing on real devices/simulators',
    keywords: ['e2e', 'end to end', 'integration test', 'detox', 'maestro', 'appium', 'ui test'],
    entries: [
      {
        name: 'Maestro',
        description:
          'Simple YAML-based E2E testing. No code required. Fastest to set up and write tests.',
        recommended: true,
        setupSteps: [
          'curl -Ls "https://get.maestro.mobile.dev" | bash',
          'maestro test flow.yaml',
        ],
        codeExample: `# flow.yaml
appId: com.myapp
---
- launchApp
- tapOn: "Login"
- inputText:
    id: "email"
    text: "test@example.com"
- tapOn: "Submit"
- assertVisible: "Welcome"`,
        pros: [
          'YAML-based, no coding needed',
          'Very fast to write and iterate',
          'Built-in cloud testing (Maestro Cloud)',
          'Works with iOS and Android',
        ],
        cons: [
          'Less flexible than code-based frameworks',
          'Limited programmatic control',
        ],
        links: {
          docs: 'https://maestro.mobile.dev/',
          github: 'https://github.com/mobile-dev-inc/maestro',
        },
      },
      {
        name: 'Detox',
        description:
          'Grey-box E2E testing by Wix. JS-based tests with automatic synchronization.',
        recommended: false,
        setupSteps: [
          'npm install -D detox',
          'npx detox init',
          'Configure .detoxrc.js with device and app settings',
        ],
        codeExample: `describe('Login', () => {
  it('should login successfully', async () => {
    await element(by.id('email')).typeText('test@example.com');
    await element(by.id('password')).typeText('password123');
    await element(by.text('Login')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});`,
        pros: [
          'Automatic synchronization (waits for animations/network)',
          'JS-based, integrates with Jest',
          'Good for complex test scenarios',
        ],
        cons: [
          'Complex setup, especially for CI',
          'Slower than Maestro for simple flows',
          'Can be flaky on CI',
        ],
        links: {
          docs: 'https://wix.github.io/Detox/',
          github: 'https://github.com/wix/Detox',
        },
      },
    ],
  },
  {
    id: 'mocking-native',
    domain: 'testing',
    name: 'Mocking Native Modules',
    description: 'How to mock native modules and platform APIs in Jest tests',
    keywords: ['mock', 'mocking', 'native module', 'jest mock', 'platform'],
    entries: [
      {
        name: 'Jest manual mocks',
        description:
          'Create __mocks__ files or use jest.mock() to replace native modules in tests.',
        recommended: true,
        codeExample: `// __mocks__/react-native-camera.js
export default {
  Constants: { Type: { back: 'back', front: 'front' } },
};

// Or inline mock in test:
jest.mock('react-native-permissions', () => ({
  check: jest.fn().mockResolvedValue('granted'),
  request: jest.fn().mockResolvedValue('granted'),
  PERMISSIONS: { IOS: { CAMERA: 'ios.permission.CAMERA' } },
}));

// jest.setup.js for global mocks:
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');`,
        pros: [
          'Full control over mock behavior',
          'Can simulate error states',
          'No native code execution needed',
        ],
        cons: [
          'Mocks can drift from real implementation',
          'Maintenance burden as libraries update',
        ],
        links: {
          docs: 'https://jestjs.io/docs/manual-mocks',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // DEBUGGING
  // ═══════════════════════════════════════
  {
    id: 'debugging-tools',
    domain: 'debugging',
    name: 'Debugging Tools Overview',
    description: 'Essential debugging tools for React Native development',
    keywords: ['debug', 'debugger', 'devtools', 'debugging', 'inspector'],
    entries: [
      {
        name: 'React Native DevTools',
        description:
          'Built-in debugger in RN 0.76+. Replaces the old Chrome debugger. Access via "j" in Metro terminal.',
        recommended: true,
        setupSteps: [
          'Start Metro: npx react-native start',
          'Press "j" in the Metro terminal to open DevTools',
          'Or shake device -> "Open DevTools"',
        ],
        pros: [
          'Built-in, no extra install',
          'Component inspector',
          'Network tab (RN 0.76+)',
          'Console and breakpoints',
        ],
        cons: [
          'Limited compared to standalone tools',
          'Only available in recent RN versions',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/debugging',
        },
      },
      {
        name: 'Reactotron',
        description:
          'Desktop app for inspecting state, API calls, logs, and performance. Works with Redux, MobX, MST.',
        recommended: true,
        setupSteps: [
          'Download Reactotron from GitHub releases',
          'npm install -D reactotron-react-native',
          'Create ReactotronConfig.js and import in app entry',
        ],
        codeExample: `// ReactotronConfig.js
import Reactotron from 'reactotron-react-native';

Reactotron
  .configure({ name: 'MyApp' })
  .useReactNative()
  .connect();

console.tron = Reactotron; // optional: use console.tron.log()`,
        pros: [
          'Excellent for API request inspection',
          'Redux/state timeline',
          'Custom commands',
          'Image overlay for design comparison',
        ],
        cons: [
          'Requires setup per project',
          'Desktop app must be running',
        ],
        links: {
          github: 'https://github.com/infinitered/reactotron',
        },
      },
    ],
  },
  {
    id: 'network-debugging',
    domain: 'debugging',
    name: 'Network Debugging',
    description: 'Inspect HTTP requests, API responses, and WebSocket traffic',
    keywords: ['network', 'http', 'request', 'response', 'api debug', 'proxy', 'charles', 'proxyman'],
    entries: [
      {
        name: 'Proxyman / Charles Proxy',
        description:
          'HTTP proxy tools that intercept all network traffic from the device/simulator.',
        recommended: true,
        setupSteps: [
          'Download Proxyman (macOS) or Charles Proxy (cross-platform)',
          'iOS Simulator: proxy is automatic with Proxyman',
          'Physical device: configure Wi-Fi proxy to your Mac IP + port',
          'For HTTPS: install the proxy CA certificate on device',
        ],
        pros: [
          'Sees ALL network traffic (not just fetch)',
          'Modify requests/responses in flight',
          'Inspect SSL/TLS traffic',
          'Works with any HTTP client',
        ],
        cons: [
          'Setup required for physical devices',
          'Paid apps (free tiers available)',
        ],
        links: {
          docs: 'https://proxyman.io/',
        },
      },
      {
        name: 'React Native Debugger Network Tab',
        description:
          'In RN 0.76+, the built-in DevTools includes a Network tab. For older versions, use react-native-debugger.',
        recommended: false,
        setupSteps: [
          'RN 0.76+: Press "j" in Metro → Network tab',
          'Older: npm install -g react-native-debugger',
        ],
        pros: [
          'No external proxy needed',
          'Integrated with React DevTools',
        ],
        cons: [
          'Only shows fetch/XMLHttpRequest',
          'Misses native SDK requests',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/debugging',
        },
      },
    ],
  },
  {
    id: 'performance-profiling',
    domain: 'debugging',
    name: 'Performance Profiling',
    description: 'Identify and fix performance bottlenecks (JS thread, UI thread, re-renders)',
    keywords: ['performance', 'profiling', 'slow', 'lag', 'fps', 'render', 're-render', 'perf'],
    entries: [
      {
        name: 'React DevTools Profiler',
        description:
          'Profile component render times and identify unnecessary re-renders.',
        recommended: true,
        setupSteps: [
          'npx react-devtools (standalone)',
          'Or use built-in DevTools in RN 0.76+ (press "j")',
          'Navigate to Profiler tab → Start recording → Interact → Stop',
        ],
        pros: [
          'Visualizes component render tree',
          'Shows why each component re-rendered',
          'Flame chart and ranked views',
        ],
        cons: [
          'Only profiles React/JS side',
          'Does not show native view performance',
        ],
        links: {
          docs: 'https://react.dev/learn/react-developer-tools',
        },
      },
      {
        name: 'Performance best practices',
        description:
          'Common optimization patterns for React Native apps.',
        recommended: true,
        codeExample: `// 1. Use React.memo for pure components
const ListItem = React.memo(({ item }) => <Text>{item.name}</Text>);

// 2. Use useCallback for event handlers
const onPress = useCallback(() => { navigate('Detail'); }, []);

// 3. Use FlashList instead of FlatList for long lists
import { FlashList } from '@shopify/flash-list';
<FlashList data={items} renderItem={renderItem} estimatedItemSize={80} />

// 4. Avoid inline styles (creates new objects each render)
// Bad:  <View style={{ flex: 1 }} />
// Good: <View style={styles.container} />
const styles = StyleSheet.create({ container: { flex: 1 } });`,
        pros: [
          'No external libraries needed for most optimizations',
          'Significant FPS improvement',
        ],
        cons: [
          'Over-optimization can hurt readability',
          'React.memo has overhead for simple components',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/performance',
        },
      },
    ],
  },
  {
    id: 'crash-reporting',
    domain: 'debugging',
    name: 'Crash Reporting & Error Tracking',
    description: 'Track production crashes and errors with source map support',
    keywords: ['crash', 'error tracking', 'sentry', 'crashlytics', 'bugsnag', 'source map', 'production error'],
    entries: [
      {
        name: 'Sentry',
        description:
          'Full-featured error tracking with source maps, breadcrumbs, performance monitoring, and session replay.',
        recommended: true,
        setupSteps: [
          'npm install @sentry/react-native',
          'npx @sentry/wizard@latest -i reactNative',
          'Sentry.init({ dsn: "YOUR_DSN" }) in App.tsx',
          'Upload source maps: npx sentry-cli react-native xcode (iOS) or gradle plugin (Android)',
        ],
        pros: [
          'Automatic source map upload',
          'JS + native crash tracking',
          'Performance monitoring',
          'Session replay',
        ],
        cons: [
          'Paid after free tier (50K events/month free)',
          'SDK adds to bundle size',
        ],
        links: {
          docs: 'https://docs.sentry.io/platforms/react-native/',
          github: 'https://github.com/getsentry/sentry-react-native',
        },
      },
      {
        name: 'Firebase Crashlytics',
        description:
          'Google crash reporting. Lightweight, free, integrates with Firebase ecosystem.',
        recommended: false,
        setupSteps: [
          'npm install @react-native-firebase/app @react-native-firebase/crashlytics',
          'cd ios && pod install',
          'Add GoogleService-Info.plist (iOS) and google-services.json (Android)',
        ],
        pros: [
          'Free unlimited usage',
          'Native crash support',
          'Integrates with Firebase Analytics',
        ],
        cons: [
          'Less detailed than Sentry',
          'Firebase setup required',
          'No session replay',
        ],
        links: {
          docs: 'https://rnfirebase.io/crashlytics/usage',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════
  {
    id: 'secure-storage',
    domain: 'security',
    name: 'Secure Storage',
    description:
      'Store sensitive data (tokens, credentials, user secrets) safely on device using platform Keychain/Keystore',
    keywords: [
      'secure storage',
      'keychain',
      'keystore',
      'encrypted',
      'token storage',
      'credentials',
      'sensitive data',
    ],
    entries: [
      {
        name: 'expo-secure-store',
        description:
          'Expo API for storing encrypted key-value pairs using iOS Keychain and Android Keystore.',
        recommended: true,
        setupSteps: [
          'npx expo install expo-secure-store',
        ],
        codeExample: `import * as SecureStore from 'expo-secure-store';

// Store a value
await SecureStore.setItemAsync('auth_token', token);

// Retrieve a value
const token = await SecureStore.getItemAsync('auth_token');

// Delete a value
await SecureStore.deleteItemAsync('auth_token');`,
        pros: [
          'Uses iOS Keychain and Android Keystore (hardware-backed)',
          'Simple key-value API',
          'Encrypted at rest by the OS',
          'Works with Expo and bare RN',
        ],
        cons: [
          '2KB value size limit',
          'Not suitable for large data',
          'Synchronous reads not available',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/securestore/',
          github: 'https://github.com/expo/expo/tree/main/packages/expo-secure-store',
        },
      },
      {
        name: 'react-native-keychain',
        description:
          'Access iOS Keychain and Android Keystore for storing credentials with biometric protection.',
        recommended: false,
        setupSteps: [
          'npm install react-native-keychain',
          'cd ios && pod install',
        ],
        codeExample: `import * as Keychain from 'react-native-keychain';

// Store credentials
await Keychain.setGenericPassword('username', 'password');

// Retrieve with biometric prompt
const credentials = await Keychain.getGenericPassword({
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
  authenticationPrompt: { title: 'Authenticate to access' },
});

// Reset
await Keychain.resetGenericPassword();`,
        pros: [
          'Biometric-gated access',
          'Fine-grained access control options',
          'Supports multiple credential sets via service parameter',
          'Well-maintained, widely used',
        ],
        cons: [
          'More complex API than expo-secure-store',
          'Requires native linking (no Expo Go)',
        ],
        links: {
          docs: 'https://github.com/oblador/react-native-keychain#readme',
          github: 'https://github.com/oblador/react-native-keychain',
        },
      },
      {
        name: 'react-native-encrypted-storage',
        description:
          'AsyncStorage-like API backed by EncryptedSharedPreferences (Android) and Keychain (iOS).',
        recommended: false,
        setupSteps: [
          'npm install react-native-encrypted-storage',
          'cd ios && pod install',
        ],
        pros: [
          'Familiar AsyncStorage-like API',
          'Larger storage capacity than keychain-only solutions',
          'Uses EncryptedSharedPreferences on Android',
        ],
        cons: [
          'No biometric gating',
          'Less fine-grained access control',
        ],
        links: {
          github: 'https://github.com/nicktylah/react-native-encrypted-storage',
        },
      },
    ],
  },
  {
    id: 'authentication',
    domain: 'security',
    name: 'Authentication Patterns',
    description:
      'OAuth 2.0, social login, and authentication flow best practices for React Native',
    keywords: [
      'authentication',
      'auth',
      'login',
      'oauth',
      'social login',
      'google login',
      'apple login',
      'sign in',
    ],
    entries: [
      {
        name: 'react-native-app-auth (OAuth 2.0 / OIDC)',
        description:
          'Standard OAuth 2.0 and OpenID Connect implementation using native AppAuth SDKs. Works with any OAuth provider.',
        recommended: true,
        setupSteps: [
          'npm install react-native-app-auth',
          'cd ios && pod install',
          'Configure redirect URI in iOS Info.plist and Android AndroidManifest.xml',
          'Register your app with the OAuth provider',
        ],
        codeExample: `import { authorize, refresh, revoke } from 'react-native-app-auth';

const config = {
  issuer: 'https://accounts.google.com',
  clientId: 'YOUR_CLIENT_ID',
  redirectUrl: 'com.myapp:/oauth2redirect',
  scopes: ['openid', 'profile', 'email'],
};

// Login
const result = await authorize(config);
// result.accessToken, result.refreshToken, result.idToken

// Refresh token
const refreshed = await refresh(config, {
  refreshToken: result.refreshToken,
});

// Logout
await revoke(config, { tokenToRevoke: result.accessToken });`,
        pros: [
          'Standards-compliant OAuth 2.0 / OIDC',
          'Uses native AppAuth SDKs (secure browser, no WebView)',
          'PKCE support by default',
          'Works with any provider (Google, Azure AD, Auth0, Keycloak)',
        ],
        cons: [
          'Requires native setup per platform',
          'Redirect URI configuration can be tricky',
          'No built-in UI (you build your own login button)',
        ],
        links: {
          docs: 'https://github.com/FormidableLabs/react-native-app-auth#readme',
          github: 'https://github.com/FormidableLabs/react-native-app-auth',
        },
      },
      {
        name: 'Sign in with Apple',
        description:
          'Required for iOS apps that offer third-party login. Uses native Apple authentication.',
        recommended: true,
        setupSteps: [
          'npm install @invertase/react-native-apple-authentication',
          'cd ios && pod install',
          'Enable "Sign in with Apple" capability in Xcode',
          'Configure in Apple Developer portal',
        ],
        codeExample: `import { appleAuth } from '@invertase/react-native-apple-authentication';

const appleAuthResponse = await appleAuth.performRequest({
  requestedOperation: appleAuth.Operation.LOGIN,
  requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
});

const { identityToken, nonce, user } = appleAuthResponse;
// Send identityToken to your backend for verification`,
        pros: [
          'Required by App Store if you offer social login',
          'High user trust (native Apple UI)',
          'Supports "Hide My Email"',
        ],
        cons: [
          'iOS only (need alternative for Android)',
          'User may hide real email',
          'Name only provided on first login',
        ],
        links: {
          github: 'https://github.com/invertase/react-native-apple-authentication',
        },
      },
      {
        name: 'expo-auth-session',
        description:
          'Expo universal auth library for OAuth in managed and bare Expo projects.',
        recommended: false,
        setupSteps: [
          'npx expo install expo-auth-session expo-crypto',
          'Configure scheme in app.json',
        ],
        codeExample: `import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_CLIENT_ID',
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
});

// Trigger login
await promptAsync();`,
        pros: [
          'Built-in providers for Google, Facebook, etc.',
          'Works in Expo Go',
          'Hook-based API',
          'PKCE enabled by default',
        ],
        cons: [
          'Uses web browser redirect (not native SDK)',
          'Expo dependency',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/auth-session/',
        },
      },
    ],
  },
  {
    id: 'token-management',
    domain: 'security',
    name: 'Token Management',
    description:
      'Best practices for storing, refreshing, and managing JWT/OAuth tokens securely',
    keywords: [
      'token',
      'jwt',
      'refresh token',
      'access token',
      'token refresh',
      'session',
      'token storage',
    ],
    entries: [
      {
        name: 'Secure token flow with auto-refresh',
        description:
          'Store tokens in secure storage, use Axios interceptors for automatic refresh, and handle token expiration gracefully.',
        recommended: true,
        codeExample: `// 1. Store tokens securely (NEVER in AsyncStorage)
import * as SecureStore from 'expo-secure-store';

async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync('access_token', access);
  await SecureStore.setItemAsync('refresh_token', refresh);
}

// 2. Axios interceptor for auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      const { data } = await axios.post('/auth/refresh', { refreshToken });
      await saveTokens(data.accessToken, data.refreshToken);

      // Retry original request
      error.config.headers.Authorization = \`Bearer \${data.accessToken}\`;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// 3. Clear tokens on logout
async function logout() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}`,
        pros: [
          'Tokens never stored in plain text',
          'Automatic refresh without user interruption',
          'Single retry prevents infinite loops',
        ],
        cons: [
          'Interceptor logic can be complex with concurrent requests',
          'Must handle refresh token expiration (force re-login)',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/securestore/',
        },
      },
      {
        name: 'Token security rules',
        description:
          'Essential rules for token handling in mobile apps.',
        recommended: true,
        codeExample: `// ❌ NEVER do this:
// AsyncStorage.setItem('token', jwt);        // Not encrypted
// const token = "hardcoded-secret";          // In source code
// fetch(url, { headers: { token: jwt } });   // Custom header

// ✅ ALWAYS do this:
// SecureStore.setItemAsync('token', jwt);    // Encrypted storage
// fetch(url, {                               // Standard Bearer auth
//   headers: { Authorization: \`Bearer \${jwt}\` }
// });
// Clear tokens on logout
// Set short access token expiry (15min) + longer refresh token (7-30 days)
// Rotate refresh tokens on each use`,
        pros: [
          'Defense in depth against token theft',
          'Standard Bearer authentication format',
          'Short-lived access tokens limit exposure window',
        ],
        cons: [
          'Requires backend cooperation for short token expiry',
        ],
        links: {
          docs: 'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html',
        },
      },
    ],
  },
  {
    id: 'biometric-auth',
    domain: 'security',
    name: 'Biometric Authentication',
    description:
      'Face ID, Touch ID, and fingerprint authentication for app access and sensitive operations',
    keywords: [
      'biometric',
      'face id',
      'touch id',
      'fingerprint',
      'face recognition',
      'local authentication',
    ],
    entries: [
      {
        name: 'expo-local-authentication',
        description:
          'Expo API for biometric and passcode authentication using Face ID, Touch ID, or device passcode.',
        recommended: true,
        setupSteps: [
          'npx expo install expo-local-authentication',
          'Add NSFaceIDUsageDescription to app.json (iOS)',
        ],
        codeExample: `import * as LocalAuthentication from 'expo-local-authentication';

// Check if biometrics are available
const compatible = await LocalAuthentication.hasHardwareAsync();
const enrolled = await LocalAuthentication.isEnrolledAsync();

// Get available biometric types
const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

// Authenticate
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Authenticate to view account',
  fallbackLabel: 'Use passcode',
  cancelLabel: 'Cancel',
  disableDeviceFallback: false, // allow PIN as fallback
});

if (result.success) {
  // User authenticated — show sensitive data
}`,
        pros: [
          'Simple API',
          'Supports Face ID, Touch ID, fingerprint, and device passcode',
          'Works with Expo and bare RN',
          'Handles fallback to passcode automatically',
        ],
        cons: [
          'Cannot store credentials gated by biometrics (use react-native-keychain for that)',
          'No fine-grained biometric policy control',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/local-authentication/',
        },
      },
      {
        name: 'react-native-biometrics',
        description:
          'Advanced biometric auth with cryptographic key generation. Create and verify signatures with biometric-protected keys.',
        recommended: false,
        setupSteps: [
          'npm install react-native-biometrics',
          'cd ios && pod install',
        ],
        codeExample: `import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

// Check sensor availability
const { available, biometryType } = await rnBiometrics.isSensorAvailable();

// Create biometric-protected key pair
const { publicKey } = await rnBiometrics.createKeys();
// Send publicKey to server for future verification

// Sign a challenge (server sends challenge, user authenticates)
const { signature } = await rnBiometrics.createSignature({
  promptMessage: 'Confirm payment',
  payload: serverChallenge,
});
// Send signature to server for verification`,
        pros: [
          'Cryptographic signatures for server-side verification',
          'Key is protected by biometric hardware',
          'Useful for payment confirmation and sensitive actions',
        ],
        cons: [
          'More complex than simple authentication',
          'Requires server-side public key verification',
          'No Expo Go support',
        ],
        links: {
          github: 'https://github.com/SelfLender/react-native-biometrics',
        },
      },
    ],
  },
  {
    id: 'ssl-pinning',
    domain: 'security',
    name: 'SSL/Certificate Pinning',
    description:
      'Pin SSL certificates to prevent man-in-the-middle attacks on API communication',
    keywords: [
      'ssl pinning',
      'certificate pinning',
      'https',
      'tls',
      'man in the middle',
      'mitm',
      'network security',
    ],
    entries: [
      {
        name: 'react-native-ssl-pinning',
        description:
          'Drop-in fetch replacement with SSL certificate pinning. Supports both certificate and public key pinning.',
        recommended: true,
        setupSteps: [
          'npm install react-native-ssl-pinning',
          'cd ios && pod install',
          'Add your server certificate (.cer) to iOS bundle and Android assets',
        ],
        codeExample: `import { fetch as sslFetch } from 'react-native-ssl-pinning';

const response = await sslFetch('https://api.example.com/data', {
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
  sslPinning: {
    certs: ['my-server-cert'], // .cer file name without extension
  },
  timeoutInterval: 10000,
});

const data = await response.json();`,
        pros: [
          'Prevents MITM attacks even on compromised networks',
          'fetch-like API',
          'Supports certificate and public key pinning',
        ],
        cons: [
          'Must update app when server certificate rotates',
          'Cannot use during development (use flag to disable in __DEV__)',
          'Breaks proxy debugging tools (Proxyman, Charles)',
        ],
        links: {
          github: 'https://github.com/nicktylah/react-native-ssl-pinning',
        },
      },
      {
        name: 'TrustKit (iOS) + Network Security Config (Android)',
        description:
          'Native platform approaches: TrustKit for iOS, network_security_config.xml for Android.',
        recommended: false,
        codeExample: `// Android: android/app/src/main/res/xml/network_security_config.xml
// <network-security-config>
//   <domain-config>
//     <domain includeSubdomains="true">api.example.com</domain>
//     <pin-set expiration="2025-01-01">
//       <pin digest="SHA-256">base64-encoded-hash</pin>
//       <pin digest="SHA-256">backup-pin-hash</pin>
//     </pin-set>
//   </domain-config>
// </network-security-config>

// AndroidManifest.xml:
// <application android:networkSecurityConfig="@xml/network_security_config">

// iOS: Use TrustKit in AppDelegate
// [TrustKit initSharedInstanceWithConfiguration:@{
//   kTSKSwizzleNetworkDelegates: @YES,
//   kTSKPinnedDomains: @{
//     @"api.example.com": @{
//       kTSKPublicKeyHashes: @[@"hash1", @"hash2"],
//     }
//   }
// }];`,
        pros: [
          'Native platform solutions (no JS dependency)',
          'Android: built-in, no library needed',
          'Backup pins for certificate rotation',
        ],
        cons: [
          'Requires native code changes',
          'Different implementation per platform',
          'More complex setup',
        ],
        links: {
          docs: 'https://developer.android.com/privacy-and-security/security-config',
        },
      },
    ],
  },
  {
    id: 'app-hardening',
    domain: 'security',
    name: 'App Hardening & Protection',
    description:
      'Root/jailbreak detection, code obfuscation, tamper detection, and runtime protection',
    keywords: [
      'hardening',
      'obfuscation',
      'root detection',
      'jailbreak',
      'tamper',
      'proguard',
      'code protection',
      'reverse engineering',
    ],
    entries: [
      {
        name: 'Root/Jailbreak Detection',
        description:
          'Detect compromised devices to protect sensitive operations (banking, payments).',
        recommended: true,
        setupSteps: [
          'npm install react-native-device-info',
          'Or for advanced detection: jail-monkey',
        ],
        codeExample: `// Using jail-monkey
import JailMonkey from 'jail-monkey';

if (JailMonkey.isJailBroken()) {
  // Device is rooted/jailbroken
  // Options: warn user, disable features, or block access
  Alert.alert(
    'Security Warning',
    'This device appears to be rooted/jailbroken. Some features may be disabled.'
  );
}

// Check for debugging
if (JailMonkey.isDebuggedMode()) {
  // App is being debugged — may indicate tampering
}

// Check if installed from official store
if (!JailMonkey.isOnExternalStorage()) {
  // App is on internal storage (normal)
}`,
        pros: [
          'Detects common root/jailbreak indicators',
          'Can protect banking and payment features',
          'Multiple detection methods',
        ],
        cons: [
          'Advanced root methods can bypass detection',
          'False positives on some custom ROMs',
          'Cat-and-mouse game with bypass tools (Magisk Hide)',
        ],
        links: {
          github: 'https://github.com/nicktylah/jail-monkey',
        },
      },
      {
        name: 'Code Obfuscation (ProGuard / Hermes)',
        description:
          'Protect JavaScript and native code from reverse engineering.',
        recommended: true,
        codeExample: `// Android: Enable ProGuard in android/app/build.gradle
// buildTypes {
//   release {
//     minifyEnabled true
//     shrinkResources true
//     proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
//                   'proguard-rules.pro'
//   }
// }

// Hermes bytecode (enabled by default in RN 0.70+):
// JS source is compiled to Hermes bytecode (.hbc)
// This is NOT readable JS — provides basic obfuscation
// Verify in android/gradle.properties:
//   hermesEnabled=true

// iOS: Bitcode (deprecated in Xcode 14+)
// Use Hermes for bytecode compilation on iOS too

// Additional: react-native-obfuscating-transformer
// npm install -D react-native-obfuscating-transformer
// Obfuscates JS variable/function names in Metro bundle`,
        pros: [
          'ProGuard shrinks and obfuscates native code',
          'Hermes bytecode is not human-readable',
          'Reduces APK/IPA size as a bonus',
        ],
        cons: [
          'Hermes bytecode can be decompiled (not true encryption)',
          'ProGuard rules must be configured carefully (can break libraries)',
          'JS obfuscation adds build complexity',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/hermes',
        },
      },
      {
        name: 'Secure environment configuration',
        description:
          'Keep API keys, secrets, and environment variables safe.',
        recommended: true,
        codeExample: `// ❌ NEVER hardcode secrets in JS:
// const API_KEY = "sk_live_abc123";

// ✅ Use react-native-config for env variables:
// npm install react-native-config
// .env file (add to .gitignore!):
// API_URL=https://api.example.com
// (NOT for secrets — .env is bundled in the app!)

// ✅ For real secrets, use backend proxy:
// Mobile app → Your backend (with secret key) → Third-party API

// ✅ For build-time only secrets (CI):
// Store in GitHub Secrets / CI environment
// Inject via gradle.properties or Xcode build settings

// ✅ Runtime secrets:
// Fetch from your authenticated API at runtime
// Store in SecureStore after retrieval`,
        pros: [
          'Prevents secret leakage in source code',
          'Backend proxy hides API keys completely',
          'CI secrets never reach the device',
        ],
        cons: [
          'Backend proxy adds latency',
          'More complex infrastructure',
        ],
        links: {
          docs: 'https://github.com/lugg/react-native-config#readme',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // CI/CD
  // ═══════════════════════════════════════
  {
    id: 'github-actions',
    domain: 'cicd',
    name: 'GitHub Actions for React Native',
    description:
      'Set up CI/CD pipelines with GitHub Actions for building, testing, and deploying React Native apps',
    keywords: [
      'github actions',
      'ci',
      'cd',
      'pipeline',
      'github',
      'workflow',
      'continuous integration',
      'automation',
    ],
    entries: [
      {
        name: 'GitHub Actions CI workflow',
        description:
          'Automated CI pipeline that runs lint, type-check, and tests on every PR. The foundation of any RN CI setup.',
        recommended: true,
        codeExample: `# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --coverage

  build-android:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: npm ci
      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-\${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
      - run: cd android && ./gradlew assembleRelease

  build-ios:
    needs: lint-and-test
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - name: Cache CocoaPods
        uses: actions/cache@v4
        with:
          path: ios/Pods
          key: pods-\${{ hashFiles('ios/Podfile.lock') }}
      - run: cd ios && pod install
      - run: xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -quiet`,
        setupSteps: [
          'Create .github/workflows/ directory',
          'Add ci.yml workflow file',
          'Store signing secrets in GitHub Settings → Secrets',
        ],
        pros: [
          'Free for public repos, generous free tier for private',
          'macOS runners available for iOS builds',
          'Tight GitHub integration (PR checks, status badges)',
          'Large action marketplace',
        ],
        cons: [
          'macOS runners are 10x more expensive than Linux',
          'iOS builds can take 20-40 minutes',
          'Limited caching (10GB per repo)',
        ],
        links: {
          docs: 'https://docs.github.com/en/actions',
        },
      },
    ],
  },
  {
    id: 'fastlane-ci',
    domain: 'cicd',
    name: 'Fastlane Automation',
    description:
      'Automate building, testing, signing, and deploying React Native apps with Fastlane',
    keywords: [
      'fastlane',
      'automation',
      'deploy',
      'build automation',
      'match',
      'pilot',
      'supply',
    ],
    entries: [
      {
        name: 'Fastlane for iOS',
        description:
          'Automate iOS builds, signing (Match), TestFlight upload (Pilot), and App Store submission.',
        recommended: true,
        setupSteps: [
          'gem install fastlane (or brew install fastlane)',
          'cd ios && fastlane init',
          'fastlane match init (for certificate management)',
        ],
        codeExample: `# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    # Fetch signing certificates
    match(type: "appstore")

    # Increment build number
    increment_build_number(
      build_number: latest_testflight_build_number + 1
    )

    # Build the app
    build_app(
      workspace: "MyApp.xcworkspace",
      scheme: "MyApp",
      export_method: "app-store"
    )

    # Upload to TestFlight
    upload_to_testflight(skip_waiting_for_build_processing: true)

    # Notify team
    slack(message: "New iOS beta uploaded to TestFlight!")
  end

  lane :release do
    match(type: "appstore")
    build_app(workspace: "MyApp.xcworkspace", scheme: "MyApp")
    upload_to_app_store(
      skip_metadata: false,
      skip_screenshots: true,
      submit_for_review: true
    )
  end
end`,
        pros: [
          'Industry standard for iOS automation',
          'Match: solves code signing for teams and CI',
          'Handles build numbers, screenshots, metadata',
          'Integrates with all CI providers',
        ],
        cons: [
          'Ruby dependency',
          'Initial setup takes effort',
          'Fastfile DSL has a learning curve',
        ],
        links: {
          docs: 'https://docs.fastlane.tools/',
          github: 'https://github.com/fastlane/fastlane',
        },
      },
      {
        name: 'Fastlane for Android',
        description:
          'Automate Android builds, Play Store upload (Supply), and internal testing distribution.',
        recommended: true,
        setupSteps: [
          'cd android && fastlane init',
          'Download Google Play JSON key from Play Console → API access',
          'Configure supply with json_key_file',
        ],
        codeExample: `# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release"
    )

    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      json_key: "fastlane/play-store-key.json",
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  lane :release do
    gradle(task: "bundle", build_type: "Release")
    upload_to_play_store(
      track: "production",
      aab: "app/build/outputs/bundle/release/app-release.aab",
      json_key: "fastlane/play-store-key.json"
    )
  end
end`,
        pros: [
          'Consistent automation for both platforms',
          'Supply handles Play Store metadata and screenshots',
          'Gradle integration is straightforward',
        ],
        cons: [
          'Play Store API key setup is non-obvious',
          'Less critical than iOS (Android builds are simpler)',
        ],
        links: {
          docs: 'https://docs.fastlane.tools/actions/supply/',
        },
      },
    ],
  },
  {
    id: 'eas-build-ci',
    domain: 'cicd',
    name: 'EAS Build & Submit (Expo)',
    description:
      'Cloud-based build and submission service for Expo and bare React Native projects',
    keywords: [
      'eas',
      'eas build',
      'eas submit',
      'expo',
      'cloud build',
      'expo application services',
    ],
    entries: [
      {
        name: 'EAS Build',
        description:
          'Build iOS and Android apps in the cloud. Handles signing, native dependencies, and produces store-ready binaries.',
        recommended: true,
        setupSteps: [
          'npm install -g eas-cli',
          'eas login',
          'eas build:configure',
          'eas build --platform all',
        ],
        codeExample: `// eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890"
      },
      "android": {
        "serviceAccountKeyPath": "./play-store-key.json",
        "track": "internal"
      }
    }
  }
}

// Commands:
// eas build --profile development --platform ios
// eas build --profile production --platform all
// eas submit --platform ios --latest
// eas submit --platform android --latest`,
        pros: [
          'No macOS machine needed for iOS builds',
          'Automatic code signing management',
          'Works with Expo and bare RN projects',
          'Integrated with EAS Submit and EAS Update',
          'Build profiles for dev/preview/production',
        ],
        cons: [
          'Free tier: limited builds per month (30 iOS, 30 Android)',
          'Queue times on free tier',
          'Paid plans for teams ($99/month+)',
          'Less control than local builds',
        ],
        links: {
          docs: 'https://docs.expo.dev/build/introduction/',
        },
      },
    ],
  },
  {
    id: 'code-quality-ci',
    domain: 'cicd',
    name: 'Code Quality Checks in CI',
    description:
      'Automate linting, formatting, type checking, and test coverage in your CI pipeline',
    keywords: [
      'lint',
      'eslint',
      'prettier',
      'type check',
      'code quality',
      'husky',
      'pre-commit',
      'coverage',
    ],
    entries: [
      {
        name: 'ESLint + Prettier + TypeScript check',
        description:
          'The essential code quality trio: lint for bugs, format for consistency, type-check for safety.',
        recommended: true,
        setupSteps: [
          'npm install -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier',
          'Add scripts to package.json',
        ],
        codeExample: `// package.json scripts
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "format": "prettier --check 'src/**/*.{ts,tsx}'",
    "typecheck": "tsc --noEmit",
    "test": "jest --coverage",
    "validate": "npm run lint && npm run format && npm run typecheck && npm test"
  }
}

// CI step: just run "npm run validate"
// Fails fast on any quality issue`,
        pros: [
          'Catches bugs before code review',
          'Enforces consistent code style',
          'TypeScript catches type errors',
          'Single "validate" command for CI',
        ],
        cons: [
          'Initial ESLint config can be complex',
          'Strict rules may annoy developers at first',
        ],
        links: {
          docs: 'https://eslint.org/',
        },
      },
      {
        name: 'Husky + lint-staged (pre-commit hooks)',
        description:
          'Run lint and format on staged files before each commit. Prevents bad code from entering the repo.',
        recommended: true,
        setupSteps: [
          'npm install -D husky lint-staged',
          'npx husky init',
          'Configure lint-staged in package.json',
        ],
        codeExample: `// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}

// .husky/pre-commit
npx lint-staged`,
        pros: [
          'Only checks changed files (fast)',
          'Auto-fixes formatting on commit',
          'Prevents CI failures for trivial issues',
        ],
        cons: [
          'Can be bypassed with --no-verify',
          'Adds commit latency (usually <5s)',
        ],
        links: {
          docs: 'https://typicode.github.io/husky/',
          github: 'https://github.com/lint-staged/lint-staged',
        },
      },
    ],
  },
  {
    id: 'ota-updates',
    domain: 'cicd',
    name: 'Over-the-Air (OTA) Updates',
    description:
      'Push JavaScript bundle updates without going through app store review',
    keywords: [
      'ota',
      'over the air',
      'hot update',
      'code push',
      'expo update',
      'live update',
      'bundle update',
    ],
    entries: [
      {
        name: 'EAS Update (Expo)',
        description:
          'Push JS bundle updates instantly to users without app store review. Built into Expo.',
        recommended: true,
        setupSteps: [
          'npx expo install expo-updates',
          'eas update:configure',
          'eas update --branch production --message "Bug fix"',
        ],
        codeExample: `// app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}

// Publish an update:
// eas update --branch production --message "Fix login bug"

// Check for updates in app (optional, auto by default):
import * as Updates from 'expo-updates';

async function checkForUpdate() {
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync(); // restart app with new bundle
  }
}`,
        pros: [
          'Instant updates (no app store review)',
          'Branch-based update channels',
          'Rollback support',
          'Runtime version policy prevents incompatible updates',
          'Free tier available',
        ],
        cons: [
          'JS-only changes (no native code changes)',
          'Users must relaunch app to get updates',
          'Expo dependency',
        ],
        links: {
          docs: 'https://docs.expo.dev/eas-update/introduction/',
        },
      },
      {
        name: 'react-native-code-push (App Center)',
        description:
          'Microsoft OTA update service. Works with bare React Native projects without Expo.',
        recommended: false,
        setupSteps: [
          'npm install react-native-code-push',
          'Install App Center CLI: npm install -g appcenter-cli',
          'appcenter apps create -d MyApp-iOS -o iOS -p React-Native',
          'appcenter codepush release-react -a MyOrg/MyApp-iOS -d Production',
        ],
        codeExample: `import codePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
};

const App = () => { /* your app */ };

export default codePush(codePushOptions)(App);`,
        pros: [
          'Works with bare RN (no Expo needed)',
          'Configurable update strategies',
          'Mandatory update support',
          'Free tier available',
        ],
        cons: [
          'App Center is being retired (migrate to EAS or alternatives)',
          'More complex setup than EAS Update',
          'Limited rollback compared to EAS',
        ],
        links: {
          docs: 'https://learn.microsoft.com/en-us/appcenter/distribution/codepush/',
          github: 'https://github.com/microsoft/react-native-code-push',
        },
      },
    ],
  },
  {
    id: 'release-versioning',
    domain: 'cicd',
    name: 'Release Management & Versioning',
    description:
      'Version numbering, changelog generation, and automated release workflows',
    keywords: [
      'version',
      'versioning',
      'release',
      'changelog',
      'semantic version',
      'semver',
      'build number',
      'app version',
    ],
    entries: [
      {
        name: 'Semantic versioning + auto build numbers',
        description:
          'Use semver (MAJOR.MINOR.PATCH) for app version and auto-increment build numbers in CI.',
        recommended: true,
        codeExample: `// Version strategy:
// App version (user-facing): 1.2.3 (semver)
//   - MAJOR: breaking changes, redesigns
//   - MINOR: new features
//   - PATCH: bug fixes
//
// Build number (store-facing): auto-incremented integer
//   - iOS: CFBundleVersion (must increase per submission)
//   - Android: versionCode (must increase per upload)

// Automate with Fastlane:
// increment_version_number(bump_type: "patch")  # 1.2.3 → 1.2.4
// increment_build_number(build_number: ENV["CI_BUILD_NUMBER"])

// Or with EAS:
// eas.json: "production": { "autoIncrement": true }

// Or with npm version:
// npm version patch  # updates package.json version
// Then sync to native:
// npx react-native-version --never-amend`,
        setupSteps: [
          'npm install -D react-native-version (optional: sync npm version to native)',
          'Configure autoIncrement in eas.json (Expo)',
          'Or use Fastlane increment_build_number in CI',
        ],
        pros: [
          'Clear version history for users and team',
          'Auto-increment prevents "build already exists" errors',
          'Semver communicates change scope',
        ],
        cons: [
          'Must keep native version numbers in sync',
          'Merge conflicts on version bumps',
        ],
        links: {
          docs: 'https://semver.org/',
        },
      },
      {
        name: 'Automated changelog with conventional commits',
        description:
          'Use conventional commit messages to auto-generate changelogs and determine version bumps.',
        recommended: false,
        setupSteps: [
          'npm install -D @commitlint/cli @commitlint/config-conventional',
          'npm install -D standard-version (or semantic-release)',
          'Add commitlint config and Husky hook',
        ],
        codeExample: `// Commit format: type(scope): message
// feat(auth): add biometric login
// fix(camera): resolve crash on Android 14
// chore(deps): update react-native to 0.76

// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};

// .husky/commit-msg
npx --no -- commitlint --edit \$1

// Generate changelog:
// npx standard-version          # bumps version + generates CHANGELOG.md
// npx standard-version --dry-run # preview without changes`,
        pros: [
          'Automatic changelog generation',
          'Consistent commit messages across team',
          'Can auto-determine semver bump from commit types',
        ],
        cons: [
          'Requires team discipline on commit format',
          'Can feel bureaucratic for small teams',
        ],
        links: {
          docs: 'https://www.conventionalcommits.org/',
          github: 'https://github.com/conventional-changelog/commitlint',
        },
      },
    ],
  },
  {
    id: 'ci-caching',
    domain: 'cicd',
    name: 'CI Build Caching & Optimization',
    description:
      'Speed up CI builds with caching strategies for node_modules, CocoaPods, Gradle, and Metro',
    keywords: [
      'cache',
      'caching',
      'build speed',
      'ci optimization',
      'slow build',
      'node_modules cache',
      'gradle cache',
      'pod cache',
    ],
    entries: [
      {
        name: 'Multi-layer caching strategy',
        description:
          'Cache node_modules, CocoaPods, Gradle, and Metro bundler artifacts for faster CI builds.',
        recommended: true,
        codeExample: `# GitHub Actions caching example:

# 1. Node modules (biggest impact)
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # auto-caches ~/.npm

# 2. CocoaPods (iOS)
- uses: actions/cache@v4
  with:
    path: ios/Pods
    key: pods-\${{ hashFiles('ios/Podfile.lock') }}

# 3. Gradle (Android)
- uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: gradle-\${{ hashFiles('**/*.gradle*', 'gradle-wrapper.properties') }}

# 4. Metro bundler cache
- uses: actions/cache@v4
  with:
    path: /tmp/metro-*
    key: metro-\${{ hashFiles('package-lock.json') }}

# Typical savings:
# Without cache: 15-25 min
# With cache: 5-10 min`,
        pros: [
          'Reduces CI time by 50-70%',
          'No code changes needed',
          'Key-based invalidation is automatic',
        ],
        cons: [
          'Cache limits per provider (GitHub: 10GB)',
          'Stale caches can cause subtle bugs',
          'First build after cache invalidation is still slow',
        ],
        links: {
          docs: 'https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════
  {
    id: 'a11y-basics',
    domain: 'accessibility',
    name: 'Accessibility Fundamentals',
    description: 'Core accessibility props and patterns for React Native (VoiceOver, TalkBack)',
    keywords: ['accessibility', 'a11y', 'voiceover', 'talkback', 'screen reader', 'accessible'],
    entries: [
      {
        name: 'Core accessibility props',
        description: 'Essential RN accessibility props for screen reader support.',
        recommended: true,
        codeExample: `// Basic accessible button
<Pressable
  accessible={true}
  accessibilityLabel="Add to cart"
  accessibilityHint="Adds this item to your shopping cart"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
  onPress={handleAdd}
>
  <Icon name="plus" />
</Pressable>

// Image with description
<Image
  source={photo}
  accessibilityLabel="Profile photo of John"
  accessibilityRole="image"
/>

// Hide decorative elements
<View accessibilityElementsHidden={true} importantForAccessibility="no">
  <DecorativeIcon />
</View>

// Announce dynamic changes
import { AccessibilityInfo } from 'react-native';
AccessibilityInfo.announceForAccessibility('Item added to cart');`,
        pros: [
          'Built into React Native core',
          'Works with VoiceOver (iOS) and TalkBack (Android)',
          'No external library needed',
        ],
        cons: [
          'Requires manual testing with screen readers',
          'Platform-specific behavior differences',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/accessibility',
        },
      },
    ],
  },
  {
    id: 'a11y-focus',
    domain: 'accessibility',
    name: 'Focus Management',
    description: 'Control screen reader focus order and focus trapping for modals and navigation',
    keywords: ['focus', 'focus order', 'focus trap', 'tab order', 'navigation a11y'],
    entries: [
      {
        name: 'Focus management patterns',
        description: 'Control focus flow for modals, alerts, and screen transitions.',
        recommended: true,
        codeExample: `import { useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

// Move focus to a component programmatically
const headingRef = useRef(null);

useEffect(() => {
  // After navigation, focus on the screen title
  const node = findNodeHandle(headingRef.current);
  if (node) {
    AccessibilityInfo.setAccessibilityFocus(node);
  }
}, []);

<Text ref={headingRef} accessibilityRole="header">
  Order Confirmation
</Text>

// Group related elements (read as one unit)
<View accessible={true} accessibilityLabel="Price: $29.99, In stock">
  <Text>$29.99</Text>
  <Text>In stock</Text>
</View>`,
        pros: [
          'Ensures logical reading order after screen changes',
          'Grouping reduces screen reader verbosity',
        ],
        cons: [
          'findNodeHandle may be deprecated in future (New Architecture)',
          'Must test on both platforms',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/accessibility#setaccessibilityfocus',
        },
      },
    ],
  },
  {
    id: 'a11y-testing',
    domain: 'accessibility',
    name: 'Accessibility Testing',
    description: 'Tools and techniques for testing accessibility in React Native apps',
    keywords: ['a11y testing', 'accessibility audit', 'screen reader test', 'axe', 'accessibility check'],
    entries: [
      {
        name: 'Manual + automated a11y testing',
        description: 'Combine automated checks with manual screen reader testing.',
        recommended: true,
        setupSteps: [
          'iOS: Settings → Accessibility → VoiceOver → On',
          'Android: Settings → Accessibility → TalkBack → On',
          'npm install -D @testing-library/react-native (includes a11y queries)',
        ],
        codeExample: `// Test with RNTL accessibility queries
import { render, screen } from '@testing-library/react-native';

test('button is accessible', () => {
  render(<AddButton />);
  // Query by accessibility role and name
  const button = screen.getByRole('button', { name: 'Add to cart' });
  expect(button).toBeTruthy();
});

// Checklist for manual testing:
// 1. Turn on VoiceOver/TalkBack
// 2. Navigate every screen with swipe gestures
// 3. Verify: all interactive elements are announced
// 4. Verify: images have descriptions (or are hidden)
// 5. Verify: focus moves logically after transitions
// 6. Verify: modals trap focus
// 7. Verify: custom gestures have accessible alternatives`,
        pros: [
          'RNTL queries catch missing accessibility labels',
          'Manual testing catches real-world issues',
        ],
        cons: [
          'No comprehensive automated a11y audit tool for RN yet',
          'Manual testing is time-consuming',
        ],
        links: {
          docs: 'https://reactnative.dev/docs/accessibility#testing',
        },
      },
    ],
  },
  // ═══════════════════════════════════════
  // STYLING
  // ═══════════════════════════════════════
  {
    id: 'styling-approach',
    domain: 'styling',
    name: 'Styling Approaches',
    description: 'Compare StyleSheet, Nativewind (Tailwind), Tamagui, and styled-components for RN',
    keywords: ['styling', 'css', 'stylesheet', 'nativewind', 'tailwind', 'styled-components', 'tamagui', 'style'],
    entries: [
      {
        name: 'StyleSheet (built-in)',
        description: 'React Native built-in styling. No dependencies, best performance.',
        recommended: true,
        codeExample: `import { StyleSheet, View, Text } from 'react-native';

const MyComponent = () => (
  <View style={styles.container}>
    <Text style={[styles.title, styles.bold]}>Hello</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, color: '#333' },
  bold: { fontWeight: '700' },
});`,
        pros: [
          'Zero dependencies',
          'Best performance (pre-processed at creation)',
          'TypeScript autocompletion for style props',
          'No build tool configuration',
        ],
        cons: [
          'Verbose for complex UIs',
          'No theming system built-in',
          'No responsive utilities',
        ],
        links: { docs: 'https://reactnative.dev/docs/stylesheet' },
      },
      {
        name: 'Nativewind (Tailwind CSS)',
        description: 'Use Tailwind CSS class names in React Native. Compiles to StyleSheet at build time.',
        recommended: true,
        setupSteps: [
          'npm install nativewind',
          'npm install -D tailwindcss',
          'npx tailwindcss init',
          'Configure babel.config.js and tailwind.config.js',
        ],
        codeExample: `import { View, Text } from 'react-native';

const MyComponent = () => (
  <View className="flex-1 p-4 bg-white dark:bg-gray-900">
    <Text className="text-2xl font-bold text-gray-800 dark:text-white">
      Hello
    </Text>
  </View>
);`,
        pros: [
          'Familiar Tailwind API',
          'Dark mode with className',
          'Responsive design utilities',
          'Compiles to native styles (good perf)',
        ],
        cons: [
          'Build configuration required',
          'Tailwind class names differ from web in some cases',
          'Learning Tailwind if unfamiliar',
        ],
        links: { docs: 'https://www.nativewind.dev/', github: 'https://github.com/marklawlor/nativewind' },
      },
      {
        name: 'Tamagui',
        description: 'Universal design system with optimizing compiler. Outputs native views on mobile, CSS on web.',
        recommended: false,
        pros: [
          'Cross-platform (web + mobile)',
          'Optimizing compiler for performance',
          'Rich theme system',
          'Pre-built component library',
        ],
        cons: [
          'Complex setup with compiler',
          'Newer project, smaller ecosystem',
          'Learning curve',
        ],
        links: { docs: 'https://tamagui.dev/', github: 'https://github.com/tamagui/tamagui' },
      },
    ],
  },
  {
    id: 'responsive-design',
    domain: 'styling',
    name: 'Responsive Design',
    description: 'Build UIs that adapt to different screen sizes, orientations, and platforms',
    keywords: ['responsive', 'screen size', 'dimensions', 'safe area', 'orientation', 'adaptive'],
    entries: [
      {
        name: 'Responsive patterns',
        description: 'Use Dimensions, useWindowDimensions, and SafeAreaView for adaptive layouts.',
        recommended: true,
        codeExample: `import { useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MyScreen = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{
        flexDirection: isTablet ? 'row' : 'column',
        padding: isTablet ? 24 : 16,
      }}>
        {/* Content adapts to screen size */}
      </View>
    </SafeAreaView>
  );
};

// Platform-specific styles
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
});`,
        setupSteps: [
          'npm install react-native-safe-area-context',
          'Wrap root with SafeAreaProvider',
        ],
        pros: [
          'useWindowDimensions updates on rotation',
          'SafeAreaView handles notch/dynamic island',
          'Platform.select for OS-specific styles',
        ],
        cons: [
          'Manual breakpoint logic',
          'Must test on multiple screen sizes',
        ],
        links: { docs: 'https://reactnative.dev/docs/usewindowdimensions' },
      },
    ],
  },
  {
    id: 'theming-dark-mode',
    domain: 'styling',
    name: 'Theming & Dark Mode',
    description: 'Implement light/dark mode and custom theme systems',
    keywords: ['theme', 'dark mode', 'light mode', 'color scheme', 'theming'],
    entries: [
      {
        name: 'React Navigation + useColorScheme',
        description: 'Use system color scheme detection with React Navigation theming.',
        recommended: true,
        codeExample: `import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

const LightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: '#007AFF' } };
const MyDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: '#0A84FF' } };

const App = () => {
  const scheme = useColorScheme(); // 'light' | 'dark'
  return (
    <NavigationContainer theme={scheme === 'dark' ? MyDarkTheme : LightTheme}>
      {/* screens */}
    </NavigationContainer>
  );
};

// Access theme in components:
import { useTheme } from '@react-navigation/native';
const { colors } = useTheme();
<Text style={{ color: colors.text }}>Themed text</Text>`,
        pros: [
          'Follows system preference automatically',
          'React Navigation provides theme context',
          'No extra library needed',
        ],
        cons: [
          'Limited to Navigation theme structure',
          'Custom components need manual theme access',
        ],
        links: { docs: 'https://reactnavigation.org/docs/themes/' },
      },
    ],
  },
  // ═══════════════════════════════════════
  // I18N
  // ═══════════════════════════════════════
  {
    id: 'i18n-setup',
    domain: 'i18n',
    name: 'Internationalization Setup',
    description: 'Multi-language support with react-i18next or expo-localization',
    keywords: ['i18n', 'internationalization', 'localization', 'translation', 'language', 'multi-language', 'locale'],
    entries: [
      {
        name: 'react-i18next',
        description: 'The most popular i18n solution for React/RN. JSON translation files, hooks API, pluralization.',
        recommended: true,
        setupSteps: [
          'npm install react-i18next i18next',
          'npm install expo-localization (for detecting device locale)',
          'Create translation JSON files per language',
        ],
        codeExample: `// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import ja from './locales/ja.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ja: { translation: ja } },
  lng: getLocales()[0].languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
export default i18n;

// locales/en.json
{ "welcome": "Welcome, {{name}}!", "items_count": "{{count}} item", "items_count_plural": "{{count}} items" }

// In component:
import { useTranslation } from 'react-i18next';
const { t, i18n } = useTranslation();
<Text>{t('welcome', { name: 'John' })}</Text>
<Text>{t('items_count', { count: 5 })}</Text>

// Change language:
i18n.changeLanguage('ja');`,
        pros: [
          'Mature ecosystem, excellent docs',
          'Pluralization, interpolation, nesting',
          'Namespace support for large apps',
          'Language detection with expo-localization',
        ],
        cons: [
          'Initial setup boilerplate',
          'Translation files can grow large',
        ],
        links: {
          docs: 'https://react.i18next.com/',
          github: 'https://github.com/i18next/react-i18next',
        },
      },
    ],
  },
  {
    id: 'rtl-support',
    domain: 'i18n',
    name: 'RTL Layout Support',
    description: 'Support right-to-left languages (Arabic, Hebrew) in React Native',
    keywords: ['rtl', 'right to left', 'arabic', 'hebrew', 'layout direction', 'bidi'],
    entries: [
      {
        name: 'RTL layout patterns',
        description: 'Enable and handle RTL layouts for Arabic, Hebrew, and other RTL languages.',
        recommended: true,
        codeExample: `// Enable RTL in app entry:
import { I18nManager } from 'react-native';

// Force RTL (call before app renders, requires restart)
I18nManager.forceRTL(true);
I18nManager.allowRTL(true);

// Use logical style properties (auto-flip in RTL):
const styles = StyleSheet.create({
  container: {
    // ✅ Use start/end instead of left/right
    paddingStart: 16,    // left in LTR, right in RTL
    paddingEnd: 8,
    marginStart: 12,
    alignSelf: 'flex-start', // auto-adjusts in RTL
  },
  text: {
    textAlign: 'left',  // ⚠️ use 'auto' for RTL support
    writingDirection: 'auto',
  },
});

// Check current direction:
const isRTL = I18nManager.isRTL;

// Flip icons/images for RTL:
<Image
  source={arrowIcon}
  style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
/>`,
        pros: [
          'Built into React Native',
          'Logical properties (start/end) auto-flip',
          'Flexbox handles most RTL automatically',
        ],
        cons: [
          'Requires app restart after forceRTL',
          'Some third-party libraries have RTL bugs',
          'Must test all screens in RTL mode',
        ],
        links: { docs: 'https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps' },
      },
    ],
  },
  {
    id: 'date-number-format',
    domain: 'i18n',
    name: 'Date & Number Formatting',
    description: 'Locale-aware date, time, currency, and number formatting',
    keywords: ['date format', 'number format', 'currency', 'intl', 'date-fns', 'dayjs'],
    entries: [
      {
        name: 'Intl API + date-fns',
        description: 'Use built-in Intl API for numbers/currency and date-fns for date formatting.',
        recommended: true,
        setupSteps: [
          'npm install date-fns (lightweight date library)',
          'Hermes supports Intl by default (RN 0.73+)',
          'Older RN: add intl polyfill',
        ],
        codeExample: `// Number formatting (built-in Intl)
new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(1500);
// → "¥1,500"

new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(29.99);
// → "$29.99"

// Date formatting with date-fns
import { format, formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';

format(new Date(), 'PPP', { locale: ja });
// → "2025年5月15日"

formatDistance(new Date(), subDays(new Date(), 3), { locale: ja });
// → "3日前"`,
        pros: [
          'Intl is native (no polyfill on Hermes)',
          'date-fns is tree-shakeable (small bundle)',
          'Locale-aware formatting',
        ],
        cons: [
          'Intl support varies by Hermes version',
          'date-fns locale imports add size',
        ],
        links: {
          docs: 'https://date-fns.org/',
          github: 'https://github.com/date-fns/date-fns',
        },
      },
    ],
  },
];
