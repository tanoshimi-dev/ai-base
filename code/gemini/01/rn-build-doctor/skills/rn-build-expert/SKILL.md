# Skill: React Native Build Expert

This skill provides deep expertise in React Native iOS and Android build systems.
Activate when: user mentions build errors, pod install, gradle, Xcode, signing, APK, or IPA.

## Advanced Debugging Techniques

### iOS: Reading Xcode Build Logs
- Open Xcode -> Report Navigator (Cmd+9) -> latest build
- Filter by "Errors" to isolate the root cause
- The real error is usually the FIRST error in the log, not the last

### Android: Reading Gradle Output
- Run with --stacktrace for full trace: `./gradlew assembleDebug --stacktrace`
- Run with --info for dependency resolution: `./gradlew dependencies`
- The root cause is usually near "FAILURE: Build failed with an exception"

### Identifying the Package Manager
- `yarn.lock` -> Yarn
- `pnpm-lock.yaml` -> pnpm
- `package-lock.json` -> npm
- Using wrong package manager after package.json change is a common source of corruption

### React Native Upgrade Issues
After `npx react-native upgrade`:
1. Check for conflicts in ios/ and android/ directories
2. Verify Podfile matches the template for the new version
3. Verify build.gradle AGP version matches new requirements
4. Run `pod install` and a Gradle sync

## Hermes Deep Dive
- Hermes is the JavaScript engine optimized for React Native (default from RN 0.71)
- `hermes-engine` is installed as a CocoaPod
- If Hermes build fails: clean DerivedData, delete Pods/, reinstall
- Hermes improves startup time by pre-compiling JS to bytecode during build

## New Architecture (Fabric + TurboModules)
- Enabled by default in RN 0.76+
- Requires all native libraries to be migrated
- To check if a library supports it: look for `codegenConfig` in its package.json
- Fallback: set `newArchEnabled=false` in gradle.properties until libraries catch up

## Common Environment Variables

```bash
# Android
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Java (macOS)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# React Native New Architecture
export RN_NEW_ARCH_ENABLED=1  # or 0 to disable
```

## Version Compatibility Matrix

### Android Gradle Plugin (AGP) vs Gradle
| AGP   | Min Gradle | Notes |
|-------|-----------|-------|
| 7.4   | 7.5       | RN 0.71-0.72 |
| 8.0   | 8.0       | RN 0.73, namespace required |
| 8.1   | 8.0       | RN 0.74 |
| 8.2+  | 8.4+      | RN 0.75+ |

### Xcode vs iOS Deployment Target
| Xcode | Max iOS SDK | Min macOS |
|-------|------------|-----------|
| 14    | 16         | Monterey  |
| 15    | 17         | Ventura   |
| 16    | 18         | Sonoma    |
