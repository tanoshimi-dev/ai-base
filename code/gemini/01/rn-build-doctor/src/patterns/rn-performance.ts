import type { PerformanceGuide } from '../types.js';

export const RN_PERFORMANCE_GUIDES: PerformanceGuide[] = [
  {
    id: 'rendering-optimization',
    name: 'Rendering & Re-render Optimization',
    description: 'Reduce unnecessary re-renders using memoization, state splitting, and component design.',
    keywords: ['render', 're-render', 'memo', 'useMemo', 'useCallback', 'performance', 'slow', 'lag', 'jank'],
    category: 'rendering',
    diagnosticSteps: [
      'Enable React DevTools Profiler to identify components re-rendering frequently',
      'Look for components re-rendering when their props have not changed',
      'Check for inline object/array/function creation in JSX props',
      'Check for context providers at the top level that change frequently',
    ],
    optimizations: [
      {
        title: 'React.memo for pure components',
        description: 'Wrap functional components that render the same output given the same props.',
        codeExample: 'const MyComponent = React.memo(({ title }: Props) => {\n  return <Text>{title}</Text>;\n});',
      },
      {
        title: 'useMemo for expensive computations',
        description: 'Cache computed values that depend on specific inputs.',
        codeExample: 'const sorted = useMemo(() => items.sort((a, b) => a.name.localeCompare(b.name)), [items]);',
      },
      {
        title: 'useCallback for function props',
        description: 'Stabilize function references passed to memoized children.',
        codeExample: 'const handlePress = useCallback(() => {\n  navigation.navigate("Detail", { id });\n}, [id]);',
      },
      {
        title: 'Split state to minimize re-render scope',
        description: 'Keep fast-changing state (e.g., text input) separate from slow-changing state (e.g., user profile).',
      },
    ],
    tools: ['React DevTools Profiler', 'why-did-you-render', 'Systrace'],
  },
  {
    id: 'list-optimization',
    name: 'List Performance (FlatList / FlashList)',
    description: 'Optimize large lists to prevent jank, dropped frames, and memory bloat.',
    keywords: ['flatlist', 'flashlist', 'list', 'scroll', 'virtualized', 'recyclerview', 'large list', 'infinite scroll'],
    category: 'lists',
    diagnosticSteps: [
      'Check if using ScrollView for large datasets (should use FlatList/FlashList)',
      'Measure FPS during fast scrolling with Perf Monitor',
      'Check for complex item renderers causing slow mount times',
      'Verify keyExtractor returns stable, unique keys',
    ],
    optimizations: [
      {
        title: 'Use FlashList instead of FlatList',
        description: '@shopify/flash-list uses recycling (like RecyclerView) and is 5-10x faster than FlatList.',
        codeExample: 'import { FlashList } from "@shopify/flash-list";\n\n<FlashList\n  data={items}\n  renderItem={({ item }) => <ItemCard item={item} />}\n  estimatedItemSize={80}\n/>',
      },
      {
        title: 'Set getItemLayout / estimatedItemSize',
        description: 'Eliminates the need for async layout measurement, improving scroll performance.',
        codeExample: 'getItemLayout={(data, index) => ({ length: 80, offset: 80 * index, index })}',
      },
      {
        title: 'Use windowSize and maxToRenderPerBatch',
        description: 'Control how many items are rendered outside the viewport.',
        codeExample: '<FlatList\n  windowSize={5}\n  maxToRenderPerBatch={10}\n  updateCellsBatchingPeriod={50}\n/>',
      },
      {
        title: 'Memoize renderItem',
        description: 'Prevent re-creating the render function on every parent render.',
        codeExample: 'const renderItem = useCallback(({ item }) => <ItemCard item={item} />, []);',
      },
    ],
    tools: ['Perf Monitor (Dev Menu)', 'Systrace', '@shopify/flash-list'],
  },
  {
    id: 'image-optimization',
    name: 'Image Loading & Optimization',
    description: 'Optimize image loading, caching, and memory usage for smooth UI.',
    keywords: ['image', 'photo', 'loading', 'cache', 'memory', 'blur', 'placeholder', 'webp', 'resize'],
    category: 'images',
    diagnosticSteps: [
      'Check if large images are loaded at full resolution (should resize on server or use resizeMode)',
      'Check if images are being re-downloaded on every render (missing cache)',
      'Look for PNG images that could be WebP (30-50% smaller)',
      'Monitor memory usage during image-heavy screens',
    ],
    optimizations: [
      {
        title: 'Use expo-image or react-native-fast-image',
        description: 'Both provide aggressive caching, blur placeholders, and WebP support.',
        codeExample: 'import { Image } from "expo-image";\n\n<Image\n  source={{ uri: imageUrl }}\n  placeholder={blurhash}\n  contentFit="cover"\n  transition={200}\n/>',
      },
      {
        title: 'Serve correctly sized images',
        description: 'Request images at the display size, not full resolution. Use CDN image resizing.',
      },
      {
        title: 'Use WebP format',
        description: 'WebP is 30-50% smaller than PNG/JPEG with similar quality. Supported on iOS 14+ and all Android.',
      },
      {
        title: 'Set explicit width/height',
        description: 'Always provide dimensions to avoid layout shifts and unnecessary re-renders.',
      },
    ],
    tools: ['expo-image', 'react-native-fast-image', 'CDN image optimization'],
  },
  {
    id: 'navigation-performance',
    name: 'Navigation Performance',
    description: 'Reduce navigation transition jank and screen mount time.',
    keywords: ['navigation', 'transition', 'screen', 'mount', 'stack', 'tab', 'slow navigation', 'screen load'],
    category: 'navigation',
    diagnosticSteps: [
      'Check if heavy screens do expensive work during mount (API calls, large computations)',
      'Verify screen components are not rendering hidden/off-screen content',
      'Check for large bundle sizes due to eager imports',
      'Measure screen transition FPS with Perf Monitor',
    ],
    optimizations: [
      {
        title: 'Lazy load screens',
        description: 'Use React.lazy() with Suspense or dynamic imports to split screen bundles.',
        codeExample: 'const HeavyScreen = React.lazy(() => import("./screens/HeavyScreen"));',
      },
      {
        title: 'Defer heavy work with InteractionManager',
        description: 'Run expensive operations after navigation transitions complete.',
        codeExample: 'useEffect(() => {\n  const task = InteractionManager.runAfterInteractions(() => {\n    loadExpensiveData();\n  });\n  return () => task.cancel();\n}, []);',
      },
      {
        title: 'Use enableFreeze (react-native-screens)',
        description: 'Freezes screens that are not visible, preventing unnecessary re-renders.',
        codeExample: 'import { enableFreeze } from "react-native-screens";\nenableFreeze(true);',
      },
      {
        title: 'Minimize header/tab bar complexity',
        description: 'Keep navigation headers and tab bars simple — avoid custom animated headers on every screen.',
      },
    ],
    tools: ['React Navigation DevTools', 'react-native-screens', 'InteractionManager'],
  },
  {
    id: 'startup-optimization',
    name: 'App Startup Time Optimization',
    description: 'Reduce cold start and time-to-interactive for faster app launches.',
    keywords: ['startup', 'cold start', 'launch', 'splash', 'ttl', 'time to interactive', 'boot', 'slow start'],
    category: 'startup',
    diagnosticSteps: [
      'Measure cold start time: adb shell am start -W (Android) or Instruments (iOS)',
      'Check for synchronous work in App root component',
      'Check for large synchronous imports at the top of entry file',
      'Verify Hermes is enabled (much faster startup than JSC)',
    ],
    optimizations: [
      {
        title: 'Enable Hermes engine',
        description: 'Hermes precompiles JavaScript to bytecode, reducing startup time by 30-50%.',
      },
      {
        title: 'Use inline requires (lazy imports)',
        description: 'Metro supports inline requires to defer module loading until first use.',
        codeExample: '// metro.config.js\nmodule.exports = {\n  transformer: {\n    getTransformOptions: () => ({\n      transform: { inlineRequires: true },\n    }),\n  },\n};',
      },
      {
        title: 'Defer non-critical initialization',
        description: 'Move analytics, crash reporting, and feature flag SDKs to after the first render.',
        codeExample: 'useEffect(() => {\n  InteractionManager.runAfterInteractions(() => {\n    initAnalytics();\n    initCrashReporting();\n  });\n}, []);',
      },
      {
        title: 'Optimize splash screen',
        description: 'Use expo-splash-screen or react-native-bootsplash for smooth transition from native to JS.',
      },
    ],
    tools: ['Hermes', 'Flipper (Hermes profiler)', 'adb shell am start -W', 'Xcode Instruments'],
  },
  {
    id: 'memory-optimization',
    name: 'Memory Management & Leak Prevention',
    description: 'Detect and fix memory leaks, reduce memory footprint, prevent OOM crashes.',
    keywords: ['memory', 'leak', 'oom', 'out of memory', 'gc', 'garbage collection', 'heap', 'retain cycle'],
    category: 'memory',
    diagnosticSteps: [
      'Monitor memory usage over time in Xcode Instruments or Android Profiler',
      'Check for missing cleanup in useEffect (timers, subscriptions, event listeners)',
      'Look for large closures capturing component state',
      'Check for global state growing unbounded (caches, logs)',
    ],
    optimizations: [
      {
        title: 'Clean up useEffect subscriptions',
        description: 'Always return a cleanup function from useEffect to cancel subscriptions, timers, and listeners.',
        codeExample: 'useEffect(() => {\n  const sub = eventEmitter.addListener("event", handler);\n  return () => sub.remove();\n}, []);',
      },
      {
        title: 'Use WeakRef for caches',
        description: 'Prevent caches from keeping large objects alive when they should be garbage collected.',
      },
      {
        title: 'Limit image cache size',
        description: 'Configure expo-image or FastImage cache limits to prevent memory bloat.',
      },
      {
        title: 'Profile with Hermes memory snapshots',
        description: 'Use Chrome DevTools with Hermes to take heap snapshots and find retained objects.',
      },
    ],
    tools: ['Xcode Instruments (Leaks/Allocations)', 'Android Studio Profiler', 'Hermes heap snapshots', 'Chrome DevTools'],
  },
  {
    id: 'bridge-optimization',
    name: 'Bridge & New Architecture Performance',
    description: 'Reduce bridge overhead and leverage the New Architecture (JSI/TurboModules/Fabric) for better performance.',
    keywords: ['bridge', 'jsi', 'turbomodule', 'fabric', 'new architecture', 'serialization', 'native', 'overhead'],
    category: 'bridge',
    diagnosticSteps: [
      'Check for frequent bridge crossings in tight loops (e.g., onScroll handlers calling native)',
      'Identify large JSON payloads being serialized across the bridge',
      'Check if the app uses the New Architecture (bridgeless mode)',
      'Look for synchronous bridge calls blocking the JS thread',
    ],
    optimizations: [
      {
        title: 'Enable New Architecture',
        description: 'New Architecture eliminates the bridge, using JSI for synchronous native calls with zero serialization overhead.',
        codeExample: '// android/gradle.properties\nnewArchEnabled=true\n\n// ios/Podfile\nENV["RCT_NEW_ARCH_ENABLED"] = "1"',
      },
      {
        title: 'Batch native calls',
        description: 'Reduce bridge crossings by batching multiple native operations into a single call.',
      },
      {
        title: 'Use Reanimated for animations',
        description: 'react-native-reanimated runs animations on the UI thread, avoiding JS thread and bridge bottlenecks.',
        codeExample: 'const animatedStyle = useAnimatedStyle(() => ({\n  transform: [{ translateX: withSpring(offset.value) }],\n}));',
      },
      {
        title: 'Move heavy computation to native',
        description: 'For CPU-intensive tasks (image processing, crypto), use TurboModules or JSI to run natively.',
      },
    ],
    tools: ['Systrace', 'React Native Perf Monitor', 'Flipper (Bridge Spy plugin)'],
  },
];
