import type { ErrorPattern } from '../types.js';

export const IOS_ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: 'ios-pod-install',
    platform: 'ios',
    severity: 'critical',
    title: 'CocoaPods Dependency Resolution Failure',
    cause:
      'Pods are out of sync with package.json or the Podfile has incompatible version constraints.',
    patterns: [
      /\[!] CocoaPods could not find compatible versions/i,
      /pod install.*failed/i,
      /None of your spec sources contain a spec satisfying/i,
      /Unable to find a specification for/i,
      /The following pods could not be installed/i,
    ],
    fixes: [
      'cd ios && pod deintegrate && pod install',
      'If that fails, delete ios/Pods and ios/Podfile.lock, then run pod install again',
      'Ensure Ruby and CocoaPods are up to date: gem update cocoapods',
    ],
    autoFixable: true,
    fixId: 'ios-pod-install',
  },
  {
    id: 'ios-signing',
    platform: 'ios',
    severity: 'critical',
    title: 'Code Signing Error',
    cause:
      'No valid provisioning profile or certificate found for the bundle ID.',
    patterns: [
      /code signing is required/i,
      /No profiles for '.*' were found/i,
      /The provisioning profile ".*" doesn't include signing certificate/i,
      /Your build settings specify a provisioning profile with the UUID/i,
      /errSecInternalComponent/,
    ],
    fixes: [
      'Open Xcode -> Project -> Signing & Capabilities -> enable "Automatically manage signing"',
      'Select your Development Team from the dropdown',
      'Run: cd ios && xcodebuild -allowProvisioningUpdates',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-module-not-found',
    platform: 'ios',
    severity: 'critical',
    title: 'Framework / Module Not Found',
    cause:
      'A native module was added to package.json but pod install was not run, or the Podfile does not include it.',
    patterns: [
      /error: module '[\w]+' not found/i,
      /framework '[\w]+' not found/i,
      /Could not build Objective-C module/i,
      /ld: library not found for -l/i,
    ],
    fixes: [
      'Run: cd ios && pod install',
      'Check that the library supports the current RN version',
      'For RN < 0.60: npx react-native link',
    ],
    autoFixable: true,
    fixId: 'ios-pod-install',
  },
  {
    id: 'ios-hermes',
    platform: 'ios',
    severity: 'critical',
    title: 'Hermes Engine Build Error',
    cause:
      'Hermes is enabled but the hermes-engine pod version is incompatible, or the build artifacts are stale.',
    patterns: [
      /hermes-engine.*failed/i,
      /Could not find compatible versions for pod "hermes-engine"/i,
      /HermesExecutorFactory/,
      /JSIExecutor.*hermes/i,
    ],
    fixes: [
      'Delete ios/Pods, ios/Podfile.lock, and ~/Library/Developer/Xcode/DerivedData',
      'Run: cd ios && pod install',
      'If on RN < 0.70, disable Hermes in Podfile: :hermes_enabled => false',
    ],
    autoFixable: true,
    fixId: 'ios-clean-derived-data',
  },
  {
    id: 'ios-xcode-version',
    platform: 'ios',
    severity: 'critical',
    title: 'Xcode Version Incompatibility',
    cause:
      'The Xcode version installed does not meet the minimum required by the project or a pod.',
    patterns: [
      /requires Xcode [\d.]+ or later/i,
      /Xcode [\d.]+ is not supported/i,
      /xcodebuild: error: SDK ".*" cannot be located/i,
    ],
    fixes: [
      'Check minimum Xcode version in your RN version release notes',
      'Update Xcode via App Store',
      'Run: sudo xcode-select --switch /Applications/Xcode.app',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-min-deployment',
    platform: 'ios',
    severity: 'warning',
    title: 'Deployment Target Mismatch',
    cause:
      'A pod requires a higher iOS deployment target than what is set in the Podfile.',
    patterns: [
      /has a minimum deployment target of iOS [\d.]+/i,
      /which is higher than the target's minimum deployment target/i,
      /platform :ios, '[\d.]+'/,
    ],
    fixes: [
      'Increase the platform target in ios/Podfile: platform :ios, "13.4"',
      'RN 0.73+ requires iOS 13.4 minimum, RN 0.76+ requires iOS 15.1',
      'Run pod install after changing the Podfile',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-flipper',
    platform: 'ios',
    severity: 'warning',
    title: 'Flipper Build Error',
    cause:
      'Flipper was removed in RN 0.73 but Podfile still references it, or Flipper version is incompatible.',
    patterns: [
      /Flipper.*not found/i,
      /use_flipper!/,
      /FlipperKit.*not found/i,
      /could not find compatible versions for pod "Flipper/i,
    ],
    fixes: [
      'Remove use_flipper! from ios/Podfile (RN 0.73+ does not include Flipper)',
      'Run: cd ios && pod deintegrate && pod install',
      'If you need Flipper, pin the version explicitly in Podfile',
    ],
    autoFixable: true,
    fixId: 'ios-pod-install',
  },
  {
    id: 'ios-new-arch',
    platform: 'ios',
    severity: 'warning',
    title: 'New Architecture Configuration Error',
    cause:
      'RN_NEW_ARCH_ENABLED is misconfigured, or a third-party library does not support the New Architecture.',
    patterns: [
      /RN_NEW_ARCH_ENABLED/,
      /Fabric.*not found/i,
      /TurboModule.*not found/i,
      /does not support the New Architecture/i,
    ],
    fixes: [
      'To disable New Arch in ios/.xcode.env: export RN_NEW_ARCH_ENABLED=0',
      'Alternatively disable in android/gradle.properties: newArchEnabled=false',
      'Check if all native dependencies support New Architecture',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-swift-version',
    platform: 'ios',
    severity: 'warning',
    title: 'Swift Version Incompatibility',
    cause:
      'A pod was compiled with a different Swift version than what is configured in the project.',
    patterns: [
      /compiled with Swift [\d.]+ cannot be used by/i,
      /Module compiled with Swift [\d.]+/i,
      /SWIFT_VERSION.*mismatch/i,
    ],
    fixes: [
      'Add a post_install hook in Podfile to set SWIFT_VERSION for all pods',
      'Example: config.build_settings["SWIFT_VERSION"] = "5.0"',
      'Run pod install after modifying Podfile',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-simulator-arch',
    platform: 'ios',
    severity: 'info',
    title: 'Architecture Mismatch (M1/M2 Simulator)',
    cause:
      'Building for arm64 simulator on Apple Silicon Mac but a pod only supports x86_64.',
    patterns: [
      /building for iOS Simulator, but linking in dylib built for iOS/i,
      /does not contain.*architecture.*arm64/i,
      /EXCLUDED_ARCHS.*x86_64/,
    ],
    fixes: [
      'Add to Podfile post_install: config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "i386"',
      'Or set EXCLUDED_ARCHS in Xcode project settings for simulator',
      'Run pod install after modifying Podfile',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-deployment-target-mismatch',
    platform: 'ios',
    severity: 'critical',
    title: 'iOS Deployment Target Mismatch Between Pods',
    cause: 'A CocoaPods dependency requires a higher iOS deployment target than the project.',
    patterns: [
      /The iOS deployment target.*is set to.*but the range of supported deployment target versions is/i,
      /Specs satisfying.*dependency were found, but they required a higher minimum deployment target/i,
    ],
    fixes: [
      'Update platform in Podfile: platform :ios, \'15.1\' (or required version)',
      'Add post_install script to force deployment target for all pods',
      'pod deintegrate && pod install',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-no-bundle-url',
    platform: 'ios',
    severity: 'critical',
    title: 'No Bundle URL Present',
    cause: 'The app cannot find the JavaScript bundle. Metro is not running or the bundle is not embedded.',
    patterns: [
      /No bundle URL present/i,
      /RCTFatalException.*No bundle URL present/i,
    ],
    fixes: [
      'Ensure Metro is running: npx react-native start',
      'For release builds: npx react-native bundle --entry-file index.js --platform ios --dev false --bundle-output ios/main.jsbundle',
      'Check Info.plist for correct bundle URL configuration',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-framework-not-found',
    platform: 'ios',
    severity: 'critical',
    title: 'Framework Not Found',
    cause: 'A required framework or library is not linked correctly.',
    patterns: [
      /framework not found/i,
      /ld: framework not found/i,
      /library not found for -l/i,
    ],
    fixes: [
      'pod deintegrate && pod install',
      'Check Xcode: Build Phases → Link Binary With Libraries',
      'Verify the library is installed: npm ls <package-name>',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-permission-missing',
    platform: 'ios',
    severity: 'warning',
    title: 'Missing Permission Description in Info.plist',
    cause: 'iOS requires usage description strings for permissions. Missing them causes App Store rejection or runtime crash.',
    patterns: [
      /NSCameraUsageDescription/i,
      /NSPhotoLibraryUsageDescription/i,
      /NSLocationWhenInUseUsageDescription/i,
      /This app has crashed because it attempted to access privacy-sensitive data without a usage description/i,
    ],
    fixes: [
      'Add the required usage description key to Info.plist',
      'For Expo: add permissions to app.json under ios.infoPlist',
      'Common keys: NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSLocationWhenInUseUsageDescription',
    ],
    autoFixable: false,
  },
  {
    id: 'ios-new-arch-pod-error',
    platform: 'ios',
    severity: 'critical',
    title: 'New Architecture Pod Installation Error',
    cause: 'CocoaPods fails when enabling New Architecture due to missing codegen or wrong environment.',
    patterns: [
      /RCT_NEW_ARCH_ENABLED/i,
      /Could not find generator.*react_codegen/i,
      /FBReactNativeSpec.*not found/i,
    ],
    fixes: [
      'Ensure you run: RCT_NEW_ARCH_ENABLED=1 pod install (not just pod install)',
      'Delete Pods/ and Podfile.lock before reinstalling',
      'Verify Xcode and Command Line Tools are up to date',
    ],
    autoFixable: false,
  },
];
