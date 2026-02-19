# rn-build-doctor

**React Native build broken? Just type `/doctor`.**

A Gemini CLI extension that diagnoses build errors, checks your environment, and guides you through every stage of React Native development — from setup to App Store.

## Install

```bash
gemini extensions install rn-build-doctor
```

> Requires [Gemini CLI](https://github.com/google-gemini/gemini-cli) and Node.js 20+

## Quick Start

```
$ gemini

> /doctor
# Checks your entire RN environment: Node, Xcode, CocoaPods, Java, Android SDK, Gradle...

> /diagnose
# Paste a build error log and get instant diagnosis + fix steps

> /fix ios
# Auto-diagnose and fix common iOS build errors (with confirmation)
```

## Commands

### Core — Build Diagnosis

| Command | What it does |
|---|---|
| `/doctor` | Full environment health check |
| `/diagnose` | Analyze a build error log |
| `/fix ios` | Auto-fix iOS build errors |
| `/fix android` | Auto-fix Android build errors |

### Guides — Development Lifecycle

| Command | What it does |
|---|---|
| `/howto` | Find libraries by feature (camera, maps, storage, auth...) |
| `/guide` | Best practices (architecture, testing, security, CI/CD) |
| `/upgrade` | React Native version migration guide |
| `/publish` | App Store & Google Play publishing walkthrough |
| `/native` | Native modules, TurboModules, Fabric guide |
| `/performance` | Optimization tips (rendering, lists, startup, memory) |
| `/troubleshoot` | Symptom-based troubleshooting recipes |

### Extras — Setup & Config

| Command | What it does |
|---|---|
| `/env-setup` | Environment setup for macOS / Windows / Linux |
| `/compat` | Check library compatibility with your RN version |
| `/migration` | Expo <-> bare workflow transition guide |
| `/deeplink` | Deep linking setup (Universal Links / App Links) |
| `/monorepo` | Monorepo setup (Turborepo, Nx, Yarn/pnpm Workspaces) |
| `/state` | State management comparison (Zustand, Redux, Jotai, MobX) |
| `/release-checklist` | Pre-release checklist for app store submission |
| `/snippet` | Ready-to-use code snippets (navigation, API, hooks, auth) |
| `/template` | Project starter template recommendations |

## How It Works

rn-build-doctor is a [Gemini CLI Extension](https://github.com/google-gemini/gemini-cli) that bundles:

- **MCP Tools** — 20 tools that Gemini calls to diagnose errors, check environments, recommend libraries, and more
- **Commands** — Slash commands that trigger focused workflows
- **Skills** — Expert knowledge about RN build systems, loaded on-demand

Everything runs **locally on your machine**. No external API. No data sent anywhere. Just Gemini + your terminal.

## Examples

### Build failing after `pod install`

```
> /diagnose
# Paste your error log
# -> Identifies CocoaPods dependency conflict
# -> Suggests: pod deintegrate && pod install
# -> Offers to auto-fix with /fix ios
```

### Setting up a new dev machine

```
> /env-setup       # Step-by-step setup for your OS
> /doctor          # Verify everything is installed correctly
```

### Upgrading React Native

```
> /compat          # Check if your libraries support the new version
> /upgrade         # Get breaking changes + migration steps
> /doctor          # Verify after upgrading
```

### Preparing for release

```
> /release-checklist   # Don't forget anything
> /publish             # App Store / Google Play submission guide
```

## Error Pattern Coverage

### iOS
CocoaPods conflicts, code signing, module not found, Hermes engine, Xcode version mismatch, deployment target, Flipper, New Architecture, Swift version, M1/M2 simulator arch

### Android
ANDROID_HOME, Gradle/Java version mismatch, namespace (AGP 8+), duplicate classes, AndroidX/Jetifier, NDK/CMake, R8/ProGuard, OutOfMemory, keystore

### Common
Metro bundler errors, Metro cache corruption, node_modules corruption, RN version mismatch

## Development

```bash
git clone https://github.com/user/rn-build-doctor.git
cd rn-build-doctor
npm install
npm run build
gemini extensions link .
```

```bash
npm run dev          # watch mode
npm run inspector    # MCP Inspector for debugging
```

## Tech Stack

- TypeScript + Node.js 20+
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) for Gemini CLI integration
- Zod for input validation
- Zero external runtime dependencies beyond MCP SDK

## License

MIT
