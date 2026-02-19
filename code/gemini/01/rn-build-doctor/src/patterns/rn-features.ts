import type { FeatureCategory } from '../types.js';

export const RN_FEATURES: FeatureCategory[] = [
  {
    id: 'camera',
    name: 'Camera & QR Code',
    description: 'Camera access, photo/video capture, QR/barcode scanning',
    keywords: ['camera', 'qr', 'qr code', 'barcode', 'scan', 'photo', 'capture'],
    libraries: [
      {
        name: 'react-native-vision-camera',
        npmPackage: 'react-native-vision-camera',
        description:
          'High-performance camera library with frame processors, QR scanning, and photo/video capture. The most popular and actively maintained option.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-vision-camera',
          'cd ios && pod install',
          'Add NSCameraUsageDescription to ios/Info.plist',
          'Add NSMicrophoneUsageDescription to ios/Info.plist (for video)',
          'Android: camera permission is auto-merged via AndroidManifest.xml',
        ],
        permissions: [
          'iOS: NSCameraUsageDescription',
          'iOS: NSMicrophoneUsageDescription (video)',
          'Android: android.permission.CAMERA',
        ],
        links: {
          docs: 'https://react-native-vision-camera.com/',
          github: 'https://github.com/mrousavy/react-native-vision-camera',
        },
      },
      {
        name: 'react-native-camera-kit',
        npmPackage: 'react-native-camera-kit',
        description:
          'Lightweight camera library focused on simplicity. Good for basic photo capture and barcode scanning.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-camera-kit',
          'cd ios && pod install',
          'Add NSCameraUsageDescription to ios/Info.plist',
        ],
        permissions: [
          'iOS: NSCameraUsageDescription',
          'Android: android.permission.CAMERA',
        ],
        links: {
          github: 'https://github.com/teslamotors/react-native-camera-kit',
        },
      },
      {
        name: 'expo-camera',
        npmPackage: 'expo-camera',
        description:
          'Expo managed camera module. Easiest setup for Expo projects.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-camera',
          'Add expo-camera plugin to app.json if using config plugins',
        ],
        permissions: [
          'iOS: NSCameraUsageDescription',
          'Android: android.permission.CAMERA',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/camera/',
        },
      },
    ],
  },
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Local and remote push notifications',
    keywords: ['notification', 'push', 'push notification', 'fcm', 'apns', 'local notification'],
    libraries: [
      {
        name: 'Notifee',
        npmPackage: '@notifee/react-native',
        description:
          'Feature-rich notification library by Invertase. Supports channels, categories, actions, scheduled notifications.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install @notifee/react-native',
          'cd ios && pod install',
          'iOS: Enable Push Notifications capability in Xcode',
          'iOS: Enable Background Modes > Remote notifications in Xcode',
          'Android: No additional setup required',
        ],
        permissions: [
          'iOS: Push Notifications Entitlement',
          'Android: android.permission.POST_NOTIFICATIONS (Android 13+)',
        ],
        links: {
          docs: 'https://notifee.app/',
          github: 'https://github.com/invertase/notifee',
        },
      },
      {
        name: 'React Native Firebase Messaging',
        npmPackage: '@react-native-firebase/messaging',
        description:
          'Firebase Cloud Messaging (FCM) for push notifications. Works with Notifee for display.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install @react-native-firebase/app @react-native-firebase/messaging',
          'cd ios && pod install',
          'Add GoogleService-Info.plist to iOS project',
          'Add google-services.json to android/app/',
          'Android: Add google-services plugin to android/build.gradle',
        ],
        permissions: [
          'iOS: Push Notifications Entitlement',
          'Android: android.permission.POST_NOTIFICATIONS (Android 13+)',
        ],
        links: {
          docs: 'https://rnfirebase.io/messaging/usage',
          github: 'https://github.com/invertase/react-native-firebase',
        },
      },
      {
        name: 'expo-notifications',
        npmPackage: 'expo-notifications',
        description:
          'Expo managed notification module. Uses FCM on Android and APNs on iOS.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-notifications',
          'Add expo-notifications plugin to app.json',
          'Configure push notification credentials with eas credentials',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/notifications/',
        },
      },
    ],
  },
  {
    id: 'maps',
    name: 'Maps & Geolocation',
    description: 'Map views, markers, geolocation, geocoding',
    keywords: ['map', 'maps', 'geolocation', 'gps', 'location', 'marker', 'google maps', 'mapbox'],
    libraries: [
      {
        name: 'react-native-maps',
        npmPackage: 'react-native-maps',
        description:
          'Google Maps / Apple Maps integration. The standard map library for React Native.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-maps',
          'cd ios && pod install',
          'iOS: Uses Apple Maps by default, or add Google Maps SDK for Google Maps',
          'Android: Add Google Maps API key to android/app/src/main/AndroidManifest.xml',
          '  <meta-data android:name="com.google.android.geo.API_KEY" android:value="YOUR_KEY"/>',
        ],
        permissions: [
          'iOS: NSLocationWhenInUseUsageDescription',
          'Android: android.permission.ACCESS_FINE_LOCATION',
        ],
        links: {
          github: 'https://github.com/react-native-maps/react-native-maps',
        },
      },
      {
        name: 'react-native-geolocation',
        npmPackage: '@react-native-community/geolocation',
        description:
          'Get device GPS coordinates. Lightweight, no map UI.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install @react-native-community/geolocation',
          'cd ios && pod install',
          'Add NSLocationWhenInUseUsageDescription to Info.plist',
          'Android: Add ACCESS_FINE_LOCATION permission to AndroidManifest.xml',
        ],
        permissions: [
          'iOS: NSLocationWhenInUseUsageDescription',
          'Android: android.permission.ACCESS_FINE_LOCATION',
        ],
        links: {
          github: 'https://github.com/michalchudziak/react-native-geolocation',
        },
      },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation & Routing',
    description: 'Screen navigation, tab bars, stack navigation, deep linking',
    keywords: ['navigation', 'router', 'routing', 'screen', 'stack', 'tab', 'drawer'],
    libraries: [
      {
        name: 'React Navigation',
        npmPackage: '@react-navigation/native',
        description:
          'The most popular navigation library. JS-based, highly customizable with stack, tab, drawer navigators.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install @react-navigation/native',
          'npm install react-native-screens react-native-safe-area-context',
          'npm install @react-navigation/native-stack  (for stack navigator)',
          'npm install @react-navigation/bottom-tabs    (for tab navigator)',
          'cd ios && pod install',
          'Android: Add to MainActivity.java/kt: override fun onCreate() with super.onCreate(null)',
        ],
        links: {
          docs: 'https://reactnavigation.org/',
          github: 'https://github.com/react-navigation/react-navigation',
        },
      },
      {
        name: 'React Native Navigation (Wix)',
        npmPackage: 'react-native-navigation',
        description:
          'Native navigation by Wix. True native screen transitions. More complex setup but better performance.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-navigation',
          'cd ios && pod install',
          'Requires native code changes in AppDelegate and MainActivity',
          'See official docs for platform-specific setup',
        ],
        links: {
          docs: 'https://wix.github.io/react-native-navigation/',
          github: 'https://github.com/wix/react-native-navigation',
        },
      },
    ],
  },
  {
    id: 'storage',
    name: 'Local Storage & Database',
    description: 'Key-value storage, secure storage, SQLite, local databases',
    keywords: ['storage', 'async storage', 'database', 'sqlite', 'mmkv', 'secure storage', 'keychain'],
    libraries: [
      {
        name: 'MMKV',
        npmPackage: 'react-native-mmkv',
        description:
          'Ultra-fast key-value storage by WeChat. ~30x faster than AsyncStorage. Recommended for new projects.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-mmkv',
          'cd ios && pod install',
          'Usage: const storage = new MMKV(); storage.set("key", "value");',
        ],
        links: {
          github: 'https://github.com/mrousavy/react-native-mmkv',
        },
      },
      {
        name: 'AsyncStorage',
        npmPackage: '@react-native-async-storage/async-storage',
        description:
          'Simple async key-value store. Community standard, but slower than MMKV.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install @react-native-async-storage/async-storage',
          'cd ios && pod install',
        ],
        links: {
          github: 'https://github.com/react-native-async-storage/async-storage',
        },
      },
      {
        name: 'expo-secure-store',
        npmPackage: 'expo-secure-store',
        description:
          'Encrypted key-value storage using iOS Keychain and Android Keystore.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-secure-store',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/securestore/',
        },
      },
    ],
  },
  {
    id: 'image-picker',
    name: 'Image & Media Picker',
    description: 'Pick images/videos from gallery or take photos',
    keywords: ['image picker', 'photo picker', 'gallery', 'media picker', 'pick image', 'photo library'],
    libraries: [
      {
        name: 'react-native-image-picker',
        npmPackage: 'react-native-image-picker',
        description:
          'Pick images/videos from device gallery or camera. Most popular choice for bare RN.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-image-picker',
          'cd ios && pod install',
          'iOS: Add NSPhotoLibraryUsageDescription and NSCameraUsageDescription to Info.plist',
          'Android: permissions auto-merged',
        ],
        permissions: [
          'iOS: NSPhotoLibraryUsageDescription',
          'iOS: NSCameraUsageDescription',
          'Android: android.permission.READ_MEDIA_IMAGES (Android 13+)',
        ],
        links: {
          github: 'https://github.com/react-native-image-picker/react-native-image-picker',
        },
      },
      {
        name: 'expo-image-picker',
        npmPackage: 'expo-image-picker',
        description:
          'Expo managed image picker. Simple API, works in managed workflow.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-image-picker',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/imagepicker/',
        },
      },
    ],
  },
  {
    id: 'video',
    name: 'Video Playback',
    description: 'Video player, streaming, playback controls',
    keywords: ['video', 'video player', 'streaming', 'media player', 'playback'],
    libraries: [
      {
        name: 'react-native-video',
        npmPackage: 'react-native-video',
        description:
          'Full-featured video player. Supports streaming (HLS, DASH), DRM, subtitles, PiP.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-video',
          'cd ios && pod install',
          'iOS: Supports HLS out of the box',
          'Android: ExoPlayer used by default',
        ],
        links: {
          docs: 'https://react-native-video.github.io/react-native-video/',
          github: 'https://github.com/react-native-video/react-native-video',
        },
      },
      {
        name: 'expo-av',
        npmPackage: 'expo-av',
        description:
          'Expo audio/video module. Simpler API, good for basic playback.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-av',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/av/',
        },
      },
    ],
  },
  {
    id: 'auth',
    name: 'Authentication & OAuth',
    description: 'OAuth, social login, biometric auth, JWT management',
    keywords: ['auth', 'authentication', 'login', 'oauth', 'social login', 'google sign in', 'apple sign in'],
    libraries: [
      {
        name: 'react-native-app-auth',
        npmPackage: 'react-native-app-auth',
        description:
          'OAuth 2.0 / OpenID Connect client. Supports Google, Apple, Azure AD, Auth0, Okta, etc.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-app-auth',
          'cd ios && pod install',
          'iOS: Add callback URL scheme to Info.plist',
          'Android: Add redirect scheme to android/app/build.gradle defaultConfig',
        ],
        links: {
          github: 'https://github.com/FormidableLabs/react-native-app-auth',
        },
      },
      {
        name: 'expo-auth-session',
        npmPackage: 'expo-auth-session',
        description:
          'Expo OAuth/OpenID module. Browser-based auth flow.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-auth-session expo-crypto',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/auth-session/',
        },
      },
    ],
  },
  {
    id: 'biometrics',
    name: 'Biometric Authentication',
    description: 'Face ID, Touch ID, fingerprint authentication',
    keywords: ['biometrics', 'face id', 'touch id', 'fingerprint', 'face recognition'],
    libraries: [
      {
        name: 'react-native-biometrics',
        npmPackage: 'react-native-biometrics',
        description:
          'Face ID / Touch ID / Android Biometric prompt. Simple API for biometric authentication.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-biometrics',
          'cd ios && pod install',
          'iOS: Add NSFaceIDUsageDescription to Info.plist',
          'Android: Add android.permission.USE_BIOMETRIC to AndroidManifest.xml',
        ],
        permissions: [
          'iOS: NSFaceIDUsageDescription',
          'Android: android.permission.USE_BIOMETRIC',
        ],
        links: {
          github: 'https://github.com/SelfLender/react-native-biometrics',
        },
      },
      {
        name: 'expo-local-authentication',
        npmPackage: 'expo-local-authentication',
        description:
          'Expo biometric/passcode authentication module.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-local-authentication',
          'Add NSFaceIDUsageDescription to app.json plugins config',
        ],
        permissions: [
          'iOS: NSFaceIDUsageDescription',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/local-authentication/',
        },
      },
    ],
  },
  {
    id: 'file-system',
    name: 'File System Access',
    description: 'Read/write files, download files, document picker',
    keywords: ['file', 'file system', 'download', 'upload', 'document', 'document picker', 'fs'],
    libraries: [
      {
        name: 'react-native-fs',
        npmPackage: 'react-native-fs',
        description:
          'Native file system access. Read, write, download, upload files.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-fs',
          'cd ios && pod install',
        ],
        links: {
          github: 'https://github.com/itinance/react-native-fs',
        },
      },
      {
        name: 'expo-file-system',
        npmPackage: 'expo-file-system',
        description:
          'Expo file system module. Read, write, download with managed workflow support.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-file-system',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/filesystem/',
        },
      },
      {
        name: 'react-native-document-picker',
        npmPackage: 'react-native-document-picker',
        description:
          'Pick documents (PDF, images, etc.) from the device file system.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-document-picker',
          'cd ios && pod install',
        ],
        links: {
          github: 'https://github.com/rnmods/react-native-document-picker',
        },
      },
    ],
  },
  {
    id: 'in-app-purchase',
    name: 'In-App Purchase',
    description: 'iOS App Store and Google Play in-app purchases and subscriptions',
    keywords: ['in-app purchase', 'iap', 'subscription', 'purchase', 'billing', 'monetization'],
    libraries: [
      {
        name: 'react-native-iap',
        npmPackage: 'react-native-iap',
        description:
          'Cross-platform in-app purchase library. Supports consumables, subscriptions, and receipt validation.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-iap',
          'cd ios && pod install',
          'iOS: Enable In-App Purchase capability in Xcode',
          'Android: Add billing permission to AndroidManifest.xml',
          'Configure products in App Store Connect / Google Play Console',
        ],
        permissions: [
          'Android: com.android.vending.BILLING',
        ],
        links: {
          github: 'https://github.com/dooboolab-community/react-native-iap',
        },
      },
      {
        name: 'RevenueCat',
        npmPackage: 'react-native-purchases',
        description:
          'Subscription management SDK. Handles receipt validation, server-side, analytics. Free tier available.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-purchases',
          'cd ios && pod install',
          'Sign up at RevenueCat dashboard and configure API keys',
          'Initialize SDK with Purchases.configure({ apiKey })',
        ],
        links: {
          docs: 'https://www.revenuecat.com/docs/reactnative',
          github: 'https://github.com/RevenueCat/react-native-purchases',
        },
      },
    ],
  },
  {
    id: 'deep-linking',
    name: 'Deep Linking & Universal Links',
    description: 'URL scheme handling, universal links, dynamic links',
    keywords: ['deep link', 'deep linking', 'universal link', 'url scheme', 'dynamic link', 'app link'],
    libraries: [
      {
        name: 'React Navigation Deep Linking',
        npmPackage: '@react-navigation/native',
        description:
          'Built-in deep linking support in React Navigation. Configure URL patterns to map to screens.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'Already included with @react-navigation/native',
          'Configure linking prop on NavigationContainer:',
          '  const linking = { prefixes: ["myapp://"], config: { screens: { ... } } }',
          'iOS: Add URL scheme to Info.plist under CFBundleURLTypes',
          'Android: Add intent-filter to AndroidManifest.xml',
        ],
        links: {
          docs: 'https://reactnavigation.org/docs/deep-linking/',
        },
      },
      {
        name: 'expo-linking',
        npmPackage: 'expo-linking',
        description:
          'Expo URL handling module. Parse and create deep links.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npx expo install expo-linking',
          'Configure scheme in app.json: "scheme": "myapp"',
        ],
        links: {
          docs: 'https://docs.expo.dev/versions/latest/sdk/linking/',
        },
      },
    ],
  },
  {
    id: 'animations',
    name: 'Animations',
    description: 'Gesture-based animations, transitions, Lottie animations',
    keywords: ['animation', 'animate', 'gesture', 'transition', 'lottie', 'reanimated', 'motion'],
    libraries: [
      {
        name: 'React Native Reanimated',
        npmPackage: 'react-native-reanimated',
        description:
          'Powerful animation library running on the UI thread. 60fps gesture-driven animations.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-reanimated',
          'Add Reanimated babel plugin to babel.config.js:',
          '  plugins: ["react-native-reanimated/plugin"]  (must be last)',
          'cd ios && pod install',
          'Reset Metro cache: npx react-native start --reset-cache',
        ],
        links: {
          docs: 'https://docs.swmansion.com/react-native-reanimated/',
          github: 'https://github.com/software-mansion/react-native-reanimated',
        },
      },
      {
        name: 'Lottie React Native',
        npmPackage: 'lottie-react-native',
        description:
          'Render After Effects animations (Lottie JSON files) natively.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install lottie-react-native',
          'cd ios && pod install',
          'Import and use: <LottieView source={require("./animation.json")} autoPlay loop />',
        ],
        links: {
          github: 'https://github.com/lottie-react-native/lottie-react-native',
        },
      },
    ],
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth & BLE',
    description: 'Bluetooth Low Energy communication, device scanning, data transfer',
    keywords: ['bluetooth', 'ble', 'bluetooth low energy', 'beacon', 'device', 'peripheral'],
    libraries: [
      {
        name: 'react-native-ble-plx',
        npmPackage: 'react-native-ble-plx',
        description:
          'Bluetooth Low Energy library. Scan, connect, read/write characteristics.',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'npm install react-native-ble-plx',
          'cd ios && pod install',
          'iOS: Add NSBluetoothAlwaysUsageDescription to Info.plist',
          'Android: Add BLUETOOTH_SCAN, BLUETOOTH_CONNECT permissions to AndroidManifest.xml',
        ],
        permissions: [
          'iOS: NSBluetoothAlwaysUsageDescription',
          'Android: android.permission.BLUETOOTH_SCAN',
          'Android: android.permission.BLUETOOTH_CONNECT',
          'Android: android.permission.ACCESS_FINE_LOCATION',
        ],
        links: {
          github: 'https://github.com/dotintent/react-native-ble-plx',
        },
      },
    ],
  },
  {
    id: 'permissions',
    name: 'Permissions Management',
    description: 'Request and check device permissions (camera, location, etc.)',
    keywords: ['permission', 'permissions', 'request permission', 'check permission'],
    libraries: [
      {
        name: 'react-native-permissions',
        npmPackage: 'react-native-permissions',
        description:
          'Unified permissions API for iOS and Android. Check, request, and manage all device permissions.',
        platforms: ['ios', 'android'],
        expoSupported: false,
        setupSteps: [
          'npm install react-native-permissions',
          'cd ios && pod install',
          'iOS: Add required permission handlers to Podfile',
          'iOS: Add usage descriptions to Info.plist for each permission used',
          'Android: Add permissions to AndroidManifest.xml',
        ],
        links: {
          github: 'https://github.com/zoontek/react-native-permissions',
        },
      },
      {
        name: 'expo-permissions (deprecated)',
        npmPackage: 'expo-permissions',
        description:
          'Deprecated in favor of per-module permissions (e.g., expo-camera includes its own permission API).',
        platforms: ['ios', 'android'],
        expoSupported: true,
        setupSteps: [
          'Each Expo module now includes its own permission methods',
          'e.g., Camera.requestCameraPermissionsAsync()',
        ],
        links: {
          docs: 'https://docs.expo.dev/guides/permissions/',
        },
      },
    ],
  },
];
