import type { CompatibilityRule } from '../types.js';

export const RN_COMPATIBILITY_RULES: CompatibilityRule[] = [
  // ── Reanimated ──────────────────────────────────
  { id: 'reanimated-2-rn076', library: 'react-native-reanimated', libraryVersion: '2.x', rnVersionMin: '0.76', severity: 'error', description: 'Reanimated 2.x is not compatible with RN 0.76+ (New Architecture default). Upgrade to Reanimated 3.x.', fix: 'npm install react-native-reanimated@3', keywords: ['reanimated', 'animation'] },
  { id: 'reanimated-3-rn071', library: 'react-native-reanimated', libraryVersion: '3.x', rnVersionMax: '0.71', severity: 'warning', description: 'Reanimated 3.x works best with RN 0.72+. On 0.71, some features may not work correctly.', fix: 'Upgrade React Native to 0.72+ or use Reanimated 2.x', keywords: ['reanimated', 'animation'] },
  // ── Navigation ──────────────────────────────────
  { id: 'navigation-6-rn073', library: '@react-navigation/native', libraryVersion: '6.x', rnVersionMin: '0.74', severity: 'warning', description: 'React Navigation 6.x works with RN 0.74+ but v7 is recommended for latest features and New Architecture support.', fix: 'npm install @react-navigation/native@7', keywords: ['navigation', 'react-navigation'] },
  // ── Firebase ────────────────────────────────────
  { id: 'firebase-18-rn074', library: '@react-native-firebase/app', libraryVersion: '<18.0.0', rnVersionMin: '0.74', severity: 'error', description: 'Firebase <18 does not support RN 0.74+ namespace requirement. Upgrade to v18+.', fix: 'npm install @react-native-firebase/app@latest', keywords: ['firebase', 'crashlytics', 'analytics'] },
  // ── Safe Area ───────────────────────────────────
  { id: 'safe-area-3-rn076', library: 'react-native-safe-area-context', libraryVersion: '<4.8.0', rnVersionMin: '0.76', severity: 'warning', description: 'Safe area context <4.8 may have issues with RN 0.76 New Architecture. Update to 4.8+.', fix: 'npm install react-native-safe-area-context@latest', keywords: ['safe area', 'notch', 'insets'] },
  // ── SVG ─────────────────────────────────────────
  { id: 'svg-13-rn073', library: 'react-native-svg', libraryVersion: '<14.0.0', rnVersionMin: '0.73', severity: 'warning', description: 'react-native-svg <14 may have compatibility issues with RN 0.73+. Upgrade to v14+.', fix: 'npm install react-native-svg@latest', keywords: ['svg', 'vector', 'icon'] },
  // ── Screens ─────────────────────────────────────
  { id: 'screens-3-rn074', library: 'react-native-screens', libraryVersion: '<3.30.0', rnVersionMin: '0.74', severity: 'error', description: 'react-native-screens <3.30 does not support RN 0.74 namespace changes.', fix: 'npm install react-native-screens@latest', keywords: ['screens', 'navigation'] },
  // ── Gesture Handler ─────────────────────────────
  { id: 'gesture-2-rn076', library: 'react-native-gesture-handler', libraryVersion: '<2.14.0', rnVersionMin: '0.76', severity: 'warning', description: 'Gesture Handler <2.14 may have issues with RN 0.76 New Architecture. Update to latest.', fix: 'npm install react-native-gesture-handler@latest', keywords: ['gesture', 'swipe', 'pan'] },
  // ── Vision Camera ───────────────────────────────
  { id: 'vision-camera-2-rn073', library: 'react-native-vision-camera', libraryVersion: '2.x', rnVersionMin: '0.73', severity: 'error', description: 'Vision Camera 2.x is not compatible with RN 0.73+. Upgrade to v3 or v4.', fix: 'npm install react-native-vision-camera@latest', keywords: ['camera', 'vision camera', 'photo', 'video'] },
  // ── AsyncStorage ────────────────────────────────
  { id: 'async-storage-old', library: '@react-native-community/async-storage', libraryVersion: '*', severity: 'warning', description: 'Package has been renamed. Use @react-native-async-storage/async-storage instead.', fix: 'npm uninstall @react-native-community/async-storage && npm install @react-native-async-storage/async-storage', keywords: ['async storage', 'storage', 'persistence'] },
  // ── Flipper ─────────────────────────────────────
  { id: 'flipper-rn073', library: 'react-native-flipper', libraryVersion: '*', rnVersionMin: '0.73', severity: 'warning', description: 'Flipper has been removed from RN 0.73+ default template. Consider removing it and using React Native DevTools instead.', fix: 'Remove react-native-flipper from package.json and Podfile', keywords: ['flipper', 'debugger'] },
  // ── Hermes ──────────────────────────────────────
  { id: 'hermes-disabled-rn072', library: 'hermes-engine', libraryVersion: 'disabled', rnVersionMin: '0.72', severity: 'warning', description: 'Hermes is enabled by default since RN 0.70. Disabling it is not recommended and may cause issues with newer RN versions.', fix: 'Enable Hermes: hermesEnabled=true in gradle.properties and Podfile', keywords: ['hermes', 'jsc', 'javascript engine'] },
  // ── Maps ────────────────────────────────────────
  { id: 'maps-1-rn074', library: 'react-native-maps', libraryVersion: '<1.10.0', rnVersionMin: '0.74', severity: 'warning', description: 'react-native-maps <1.10 may have build issues with RN 0.74 namespace requirement.', fix: 'npm install react-native-maps@latest', keywords: ['maps', 'google maps', 'mapview'] },
  // ── WebView ─────────────────────────────────────
  { id: 'webview-old-rn074', library: 'react-native-webview', libraryVersion: '<13.0.0', rnVersionMin: '0.74', severity: 'warning', description: 'WebView <13 may not fully support RN 0.74+ changes.', fix: 'npm install react-native-webview@latest', keywords: ['webview', 'web view', 'browser'] },
  // ── Java version ────────────────────────────────
  { id: 'java-11-rn073', library: 'java', libraryVersion: '11', rnVersionMin: '0.73', severity: 'error', description: 'RN 0.73+ requires Java 17. Java 11 is no longer supported.', fix: 'Install JDK 17: brew install openjdk@17 && export JAVA_HOME=$(/usr/libexec/java_home -v 17)', keywords: ['java', 'jdk', 'java version'] },
  // ── Gradle ──────────────────────────────────────
  { id: 'gradle-7-rn073', library: 'gradle', libraryVersion: '7.x', rnVersionMin: '0.73', severity: 'error', description: 'RN 0.73+ requires Gradle 8.0+. Upgrade the Gradle wrapper.', fix: 'cd android && ./gradlew wrapper --gradle-version 8.6', keywords: ['gradle', 'build tool'] },
  // ── CocoaPods ───────────────────────────────────
  { id: 'cocoapods-old', library: 'cocoapods', libraryVersion: '<1.13.0', rnVersionMin: '0.73', severity: 'warning', description: 'CocoaPods <1.13 may have issues with RN 0.73+ Podfile changes. Update CocoaPods.', fix: 'gem install cocoapods', keywords: ['cocoapods', 'pods', 'ios dependencies'] },
];
