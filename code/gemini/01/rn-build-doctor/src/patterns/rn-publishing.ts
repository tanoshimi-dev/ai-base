import type { PublishingGuide } from '../types.js';

export const RN_PUBLISHING_GUIDES: PublishingGuide[] = [
  {
    id: 'ios-appstore',
    platform: 'ios',
    name: 'iOS App Store Submission',
    description: 'Complete guide to publishing a React Native app to the iOS App Store',
    keywords: ['app store', 'ios', 'apple', 'publish', 'release', 'submit', 'testflight'],
    steps: [
      {
        order: 1,
        title: 'Apple Developer Account',
        description: 'Enroll in the Apple Developer Program ($99/year). Required for App Store distribution.',
        tips: [
          'Personal accounts take ~48 hours to approve',
          'Organization accounts require a D-U-N-S Number (can take 1-2 weeks)',
        ],
      },
      {
        order: 2,
        title: 'App Icons & Launch Screen',
        description: 'Prepare all required icon sizes and a launch screen.',
        tips: [
          'Use a 1024x1024 PNG for the App Store icon (no alpha channel)',
          'Prepare @1x, @2x, @3x icon variants or use an asset generator',
          'LaunchScreen.storyboard is required (static image splash screens are deprecated)',
        ],
      },
      {
        order: 3,
        title: 'Bundle Identifier & Version',
        description: 'Set a unique bundle ID and version numbers.',
        commands: [
          'Open ios/*.xcworkspace in Xcode',
          'Target -> General -> Bundle Identifier: com.yourcompany.appname',
          'Set Version (CFBundleShortVersionString) and Build (CFBundleVersion)',
        ],
        tips: [
          'Bundle ID cannot be changed after first submission',
          'Version must be higher than any previously submitted version',
          'Build number must be unique per version',
        ],
      },
      {
        order: 4,
        title: 'Certificates & Provisioning Profiles',
        description: 'Create distribution certificate and provisioning profile.',
        commands: [
          'Xcode -> Settings -> Accounts -> Manage Certificates',
          'Or use Fastlane: fastlane match appstore',
          'Or: Xcode -> Signing & Capabilities -> Automatically manage signing (simplest)',
        ],
        tips: [
          'Enable "Automatically manage signing" in Xcode for the simplest setup',
          'For CI/CD: use Fastlane Match to share certificates across team',
          'Distribution certificates expire after 1 year',
        ],
      },
      {
        order: 5,
        title: 'Build Release Archive',
        description: 'Create an archive build for distribution.',
        commands: [
          'Xcode: Product -> Scheme -> Edit Scheme -> Set to "Release"',
          'Xcode: Product -> Archive',
          'Or CLI: xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release archive -archivePath build/MyApp.xcarchive',
        ],
        tips: [
          'Ensure you build with a real device selected (not simulator)',
          'Hermes bytecode is included automatically in release builds',
          'Archive can take 5-15 minutes',
        ],
      },
      {
        order: 6,
        title: 'Upload to App Store Connect',
        description: 'Upload the archive and configure the App Store listing.',
        commands: [
          'Xcode: Window -> Organizer -> Distribute App -> App Store Connect',
          'Or use Transporter app (drag .ipa)',
          'Or CLI: xcrun altool --upload-app -f MyApp.ipa -t ios -u your@email.com',
        ],
        tips: [
          'Processing takes 15-30 minutes after upload',
          'Create the app in App Store Connect first (appstoreconnect.apple.com)',
        ],
      },
      {
        order: 7,
        title: 'TestFlight (Beta Testing)',
        description: 'Distribute beta builds to testers before public release.',
        commands: [
          'App Store Connect -> TestFlight -> Add internal testers',
          'For external testers: submit for Beta App Review (takes 1-2 days first time)',
        ],
        tips: [
          'Internal testers (up to 100): no review required',
          'External testers (up to 10,000): requires Beta App Review',
          'TestFlight builds expire after 90 days',
        ],
      },
      {
        order: 8,
        title: 'Submit for App Review',
        description: 'Complete the App Store listing and submit for review.',
        tips: [
          'Prepare: screenshots (6.7", 6.5", 5.5"), description, keywords, support URL, privacy policy URL',
          'If your app uses login: provide a demo account in "App Review Information"',
          'Review typically takes 1-3 days (can be faster or slower)',
          'Expedited review available for critical bug fixes',
        ],
      },
    ],
    commonRejections: [
      {
        reason: 'Guideline 2.1 - App Completeness: Crashes or bugs during review',
        fix: 'Test thoroughly on physical devices. Check for missing permissions, API connectivity, and edge cases.',
      },
      {
        reason: 'Guideline 2.3.3 - Screenshots do not match app functionality',
        fix: 'Ensure screenshots reflect actual app UI. Do not use mockups that differ from real functionality.',
      },
      {
        reason: 'Guideline 4.0 - Design: App uses non-standard UI elements',
        fix: 'Follow iOS Human Interface Guidelines. Avoid web-like UI that feels out of place on iOS.',
      },
      {
        reason: 'Guideline 5.1.1 - Data Collection and Storage: Missing privacy policy',
        fix: 'Add a privacy policy URL. Required for all apps that collect any user data.',
      },
      {
        reason: 'Guideline 5.1.2 - Data Use and Sharing: Incorrect App Tracking Transparency',
        fix: 'If using ads/analytics that track: add NSUserTrackingUsageDescription and ATT prompt.',
      },
      {
        reason: 'Guideline 3.1.1 - In-App Purchase: Purchasing digital goods without IAP',
        fix: 'All digital goods/subscriptions must use Apple In-App Purchase. Physical goods and services can use external payment.',
      },
      {
        reason: 'Guideline 2.5.1 - Software Requirements: Uses private APIs',
        fix: 'Check all native modules for private API usage. Update libraries to latest versions.',
      },
    ],
  },
  {
    id: 'android-playstore',
    platform: 'android',
    name: 'Google Play Store Submission',
    description: 'Complete guide to publishing a React Native app to the Google Play Store',
    keywords: ['play store', 'google play', 'android', 'publish', 'release', 'submit', 'aab', 'apk'],
    steps: [
      {
        order: 1,
        title: 'Google Play Developer Account',
        description: 'Register for a Google Play Developer account ($25 one-time fee).',
        tips: [
          'Account registration takes up to 48 hours',
          'Organization accounts require verification (can take 1-2 weeks)',
          'New developer accounts have a 14-day waiting period before first publish',
        ],
      },
      {
        order: 2,
        title: 'App Icons & Assets',
        description: 'Prepare the required graphic assets.',
        tips: [
          'App icon: 512x512 PNG (32-bit with alpha)',
          'Feature graphic: 1024x500 PNG or JPG (displayed at top of store listing)',
          'Screenshots: at least 2 per device type (phone, 7" tablet, 10" tablet)',
          'Use android/app/src/main/res/mipmap-* for launcher icons',
        ],
      },
      {
        order: 3,
        title: 'Generate Signing Key',
        description: 'Create a release signing keystore. This key is permanent — do not lose it.',
        commands: [
          'keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000',
          'Move keystore to android/app/',
          'Add to android/gradle.properties:',
          '  MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore',
          '  MYAPP_UPLOAD_KEY_ALIAS=my-key-alias',
          '  MYAPP_UPLOAD_STORE_PASSWORD=*****',
          '  MYAPP_UPLOAD_KEY_PASSWORD=*****',
        ],
        tips: [
          'NEVER commit the keystore or passwords to git',
          'Back up the keystore file securely (losing it = cannot update app)',
          'Use Play App Signing (recommended): Google manages the app signing key, you keep the upload key',
        ],
      },
      {
        order: 4,
        title: 'Configure Gradle for Release',
        description: 'Add signing config to android/app/build.gradle.',
        commands: [
          'Add signingConfigs { release { ... } } to android/app/build.gradle',
          'Set buildTypes.release.signingConfig = signingConfigs.release',
          'Enable Proguard: minifyEnabled true, shrinkResources true',
        ],
        tips: [
          'enableProguardInReleaseBuilds = true in gradle.properties',
          'Test the release build on a physical device before uploading',
          'Check proguard-rules.pro if release build crashes',
        ],
      },
      {
        order: 5,
        title: 'Build Release AAB',
        description: 'Build an Android App Bundle (AAB) for Play Store.',
        commands: [
          'cd android && ./gradlew bundleRelease',
          'Output: android/app/build/outputs/bundle/release/app-release.aab',
          'Or build APK: ./gradlew assembleRelease (for direct installation)',
        ],
        tips: [
          'Google Play requires AAB format (not APK) for new apps',
          'AAB reduces download size by 15-20% with dynamic delivery',
          'Test with: bundletool build-apks --bundle=app.aab --output=app.apks',
        ],
      },
      {
        order: 6,
        title: 'Create App in Play Console',
        description: 'Set up the app listing in Google Play Console.',
        commands: [
          'Go to play.google.com/console',
          'Create app -> Enter app details',
          'Complete: Store listing, Content rating, Pricing & distribution',
        ],
        tips: [
          'Package name (applicationId) cannot be changed after first publish',
          'Complete the content rating questionnaire (IARC)',
          'Data safety section is required: declare what data your app collects',
        ],
      },
      {
        order: 7,
        title: 'Testing Tracks',
        description: 'Use internal, closed, or open testing before production release.',
        commands: [
          'Play Console -> Testing -> Internal testing -> Create new release',
          'Upload AAB file',
          'Add tester email addresses',
        ],
        tips: [
          'Internal testing: up to 100 testers, instant availability',
          'Closed testing: invite-only, requires review',
          'Open testing: public, requires review',
          'New apps must have 20+ testers for 14+ days in closed testing before production',
        ],
      },
      {
        order: 8,
        title: 'Submit for Production',
        description: 'Submit the app for review and publish.',
        tips: [
          'Review typically takes 1-7 days (longer for new developer accounts)',
          'Ensure target API level meets Play Store requirements (currently API 34+)',
          'Managed publishing: control when the approved app goes live',
        ],
      },
    ],
    commonRejections: [
      {
        reason: 'Policy: Missing privacy policy',
        fix: 'Add a privacy policy URL in Store listing and within the app itself.',
      },
      {
        reason: 'Policy: Data safety form incomplete',
        fix: 'Complete the Data Safety section: declare all data types collected, purposes, and sharing.',
      },
      {
        reason: 'Policy: App targets outdated API level',
        fix: 'Update targetSdkVersion to the current requirement (API 34+) in android/app/build.gradle.',
      },
      {
        reason: 'Policy: Deceptive behavior or misleading description',
        fix: 'Ensure store listing description accurately reflects app functionality.',
      },
      {
        reason: 'Policy: Permissions not justified',
        fix: 'Only request permissions you actually use. Explain permission usage in the app.',
      },
      {
        reason: 'Crash: App crashes on launch or during review',
        fix: 'Test on multiple Android versions (API 24-34). Check ProGuard rules for release builds.',
      },
    ],
  },
  {
    id: 'code-signing',
    platform: 'common',
    name: 'Code Signing & CI/CD',
    description: 'Manage code signing for iOS and Android, including CI/CD automation',
    keywords: ['signing', 'certificate', 'keystore', 'provisioning', 'fastlane', 'ci', 'cd', 'eas'],
    steps: [
      {
        order: 1,
        title: 'iOS: Automatic Signing (Development)',
        description: 'Use Xcode automatic signing for development builds.',
        commands: [
          'Xcode -> Target -> Signing & Capabilities -> Check "Automatically manage signing"',
          'Select your Team from the dropdown',
        ],
        tips: [
          'Simplest option for solo developers',
          'Xcode creates and manages certificates automatically',
          'Not suitable for CI/CD (requires Xcode GUI)',
        ],
      },
      {
        order: 2,
        title: 'iOS: Fastlane Match (Team/CI)',
        description: 'Share certificates across team and CI using Fastlane Match.',
        commands: [
          'gem install fastlane',
          'fastlane match init (choose git or google_cloud storage)',
          'fastlane match appstore   # generates App Store cert + profile',
          'fastlane match development # generates dev cert + profile',
        ],
        tips: [
          'Stores encrypted certificates in a private git repo',
          'All team members and CI use the same certificates',
          'Run fastlane match nuke distribution to revoke and regenerate',
        ],
      },
      {
        order: 3,
        title: 'Android: Keystore Management',
        description: 'Securely store and use Android signing keys.',
        commands: [
          'Generate: keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000',
          'Store passwords in environment variables, not in code',
          'CI: Use base64-encoded keystore as CI secret',
        ],
        tips: [
          'Enable Google Play App Signing to let Google manage the signing key',
          'You keep an upload key; Google signs the final APK',
          'If you lose the upload key, you can request a reset from Google',
        ],
      },
      {
        order: 4,
        title: 'EAS Build (Expo)',
        description: 'Use Expo Application Services for cloud builds with automatic signing.',
        commands: [
          'npm install -g eas-cli',
          'eas build:configure',
          'eas credentials   # manage signing credentials',
          'eas build --platform ios',
          'eas build --platform android',
          'eas submit --platform ios   # submit to App Store',
          'eas submit --platform android # submit to Play Store',
        ],
        tips: [
          'EAS manages certificates and provisioning automatically',
          'Works for both Expo and bare React Native projects',
          'Free tier: limited builds per month',
        ],
      },
      {
        order: 5,
        title: 'Fastlane Automation (Full Pipeline)',
        description: 'Automate build, test, and deploy with Fastlane.',
        commands: [
          'gem install fastlane',
          'cd ios && fastlane init',
          'cd android && fastlane init',
        ],
        tips: [
          'Fastfile example: lane :beta do build_app; upload_to_testflight end',
          'Integrates with GitHub Actions, CircleCI, Bitrise',
          'Fastlane handles incrementing build numbers, screenshots, and metadata',
        ],
      },
    ],
    commonRejections: [],
  },
];
