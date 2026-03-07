# RN-Build-Doctor — Architecture & Usage

## Overview

**RN-Build-Doctor** is a Gemini CLI Extension that diagnoses and fixes React Native iOS/Android build errors. It runs entirely locally via Node.js and exposes 20 MCP (Model Context Protocol) tools that Gemini calls on behalf of the user.

| Field | Value |
|-------|-------|
| Type | Gemini CLI Extension (MCP Server) |
| Runtime | Node.js >= 20 |
| Protocol | Model Context Protocol via `@modelcontextprotocol/sdk` |
| Transport | Stdio (`StdioServerTransport`) |
| Data Collection | None — fully local |

---

## Architecture

### High-Level Flow

```
User ──► Gemini CLI ──► MCP Server (server.ts) ──► Tool Handler
                             │                          │
                             │                     ┌────┴────┐
                             │                     │ patterns │  (knowledge base)
                             │                     │ utils    │  (log-parser, shell)
                             │                     └────┬────┘
                             │                          │
                         StdioTransport ◄──── JSON Result
```

1. Gemini CLI loads the extension via `gemini-extension.json`
2. It spawns `node dist/server.js` and communicates over stdio
3. `GEMINI.md` is injected as expert context so Gemini knows when/how to call each tool
4. Slash commands (`commands/*.toml`) map user input to tool invocations
5. Each tool returns structured JSON that Gemini interprets for the user

### Directory Structure

```
rn-build-doctor/
├── src/
│   ├── server.ts              # Entry point — creates McpServer, registers 20 tools
│   ├── types.ts               # All TypeScript interfaces
│   ├── tools/                 # 20 tool handlers (one per file)
│   │   ├── diagnose.ts        # Build error log analysis
│   │   ├── doctor.ts          # Environment health check
│   │   ├── fix.ts             # Execute safe predefined fixes
│   │   ├── env-info.ts        # Read project config files
│   │   ├── recommend.ts       # Library recommendations
│   │   ├── bestpractice.ts    # Architecture/testing/security guides
│   │   ├── upgrade.ts         # Version migration guides
│   │   ├── publish.ts         # App Store / Play Store guides
│   │   ├── compatibility.ts   # Library version compatibility
│   │   ├── troubleshoot.ts    # Symptom-based diagnostics
│   │   ├── performance.ts     # Performance optimization
│   │   ├── migration.ts       # Expo <-> bare workflow
│   │   ├── deeplink.ts        # Deep linking setup
│   │   ├── monorepo.ts        # Monorepo configuration
│   │   ├── release-checklist.ts
│   │   ├── env-setup.ts       # OS-specific dev setup
│   │   ├── state-management.ts
│   │   ├── snippet.ts         # Ready-to-use code snippets
│   │   ├── template.ts        # Project starter templates
│   │   └── nativemodule.ts    # TurboModules / Fabric
│   ├── patterns/              # Static knowledge base (19 files)
│   │   ├── ios-errors.ts      # 13+ iOS error regex patterns
│   │   ├── android-errors.ts  # 12+ Android error patterns
│   │   ├── common-errors.ts   # 5+ cross-platform patterns
│   │   ├── rn-features.ts     # Library recommendations by feature
│   │   ├── rn-best-practices.ts
│   │   ├── rn-compatibility.ts
│   │   ├── rn-upgrades.ts
│   │   ├── rn-publishing.ts
│   │   ├── rn-templates.ts
│   │   ├── rn-env-setup.ts
│   │   ├── rn-troubleshoot.ts
│   │   ├── rn-performance.ts
│   │   ├── rn-migrations.ts
│   │   ├── rn-deeplinks.ts
│   │   ├── rn-monorepo.ts
│   │   ├── rn-release-checklist.ts
│   │   ├── rn-state-management.ts
│   │   ├── rn-native-modules.ts
│   │   └── rn-snippets.ts
│   └── utils/
│       ├── log-parser.ts      # Regex matching engine + platform detection
│       └── shell.ts           # Safe shell execution with timeout
├── commands/                  # Gemini CLI slash command definitions (TOML)
├── skills/                    # Gemini skill with expert context
├── gemini-extension.json      # Extension registration
├── GEMINI.md                  # Expert context injected into Gemini
├── package.json
└── tsconfig.json
```

### Key Modules

#### `server.ts` — Entry Point

Creates an `McpServer` instance, registers all 20 tools, and connects via `StdioServerTransport`. No routing logic — each tool is self-contained.

#### `utils/log-parser.ts` — Diagnosis Engine

- `parseLog(log, patterns, platform)` — iterates every log line against all `ErrorPattern` regex arrays, deduplicates by pattern ID, returns `DiagnosedError[]` sorted by severity (critical > warning > info)
- `detectPlatform(log)` — auto-detects iOS/Android from keywords like `xcodebuild`, `gradlew`, `CocoaPods`, etc.

#### `utils/shell.ts` — Shell Execution

- `run(command, options)` — synchronous `spawnSync` wrapper with configurable timeout (default 10s), max 10 MB buffer, ANSI stripping, cross-platform shell selection (`sh -c` / `cmd /c`)
- `commandExists(cmd)` — checks PATH via `which` / `where`
- `getVersion(cmd)` — extracts version string from command output

---

## MCP Tools (20)

### Build Diagnosis

| Tool | Slash Command | Purpose |
|------|---------------|---------|
| `diagnose_build_error` | `/diagnose` | Analyze build error logs against 30+ regex patterns |
| `check_rn_environment` | `/doctor` | Check Node, package managers, Xcode, CocoaPods, Android SDK, Java |
| `get_project_info` | (via `/env-info`) | Read package.json, Podfile, build.gradle, gradle.properties |
| `apply_fix` | `/fix ios`, `/fix android` | Execute predefined safe fixes (dry-run by default) |

### Library & Compatibility

| Tool | Slash Command | Purpose |
|------|---------------|---------|
| `recommend_library` | `/howto` | Find libraries by feature (camera, auth, maps, etc.) |
| `check_compatibility` | `/compat` | Check library version compatibility with RN versions |

### Guides & Best Practices

| Tool | Slash Command | Purpose |
|------|---------------|---------|
| `guide_best_practice` | `/guide` | Architecture, testing, debugging, security, CI/CD, a11y, styling, i18n |
| `guide_publishing` | `/publish` | App Store / Play Store submission steps |
| `guide_upgrade` | `/upgrade` | RN version migration (0.71 -> 0.76) |
| `guide_template` | `/template` | Project starter recommendations |
| `guide_native_module` | `/native` | TurboModules, Fabric, New Architecture |
| `guide_troubleshoot` | `/troubleshoot` | Symptom-based ("white screen", "slow metro") |
| `guide_performance` | `/performance` | Rendering, lists, images, startup, memory |
| `guide_migration` | `/migration` | Expo <-> bare workflow transitions |
| `guide_deeplink` | `/deeplink` | Universal Links, App Links, React Navigation |
| `guide_monorepo` | `/monorepo` | Turborepo, Nx, Yarn/pnpm Workspaces |
| `guide_release_checklist` | `/release-checklist` | Pre-release critical items |
| `guide_env_setup` | `/env-setup` | macOS/Windows/Linux setup |
| `guide_state_management` | `/state` | Zustand, Redux Toolkit, Jotai, MobX, etc. |
| `generate_snippet` | `/snippet` | Ready-to-use code snippets by category |

---

## Error Pattern Coverage

The knowledge base recognizes 30+ known build errors through regex matching.

### iOS (13+ patterns)

- CocoaPods dependency resolution failures
- Code signing & provisioning profile issues
- Framework / module not found
- Hermes engine build errors
- Xcode version incompatibility
- Deployment target mismatches
- Flipper integration issues
- New Architecture / Fabric conflicts
- Swift version issues
- M1/M2 simulator architecture problems

### Android (12+ patterns)

- `ANDROID_HOME` not set
- Gradle / Java version incompatibility
- Missing `namespace` (AGP 8+)
- Duplicate class conflicts
- AndroidX / Jetifier issues
- NDK / CMake missing
- R8 / ProGuard failures
- OutOfMemoryError
- Keystore configuration issues

### Common (5+ patterns)

- Metro bundler resolution failures
- Metro cache corruption
- `node_modules` corruption
- React Native version mismatches
- Hermes JavaScript syntax errors

---

## Data Model

### Core Types (`types.ts`)

```
ErrorPattern          Build error definition (regex, severity, fixes)
  ├── id, platform, severity, title, cause
  ├── patterns: RegExp[]
  ├── fixes: string[]
  └── autoFixable, fixId?

DiagnosedError        Matched result from log analysis
  ├── id, severity, title, cause, fixes
  └── matchedLine?

EnvCheckResult        Single environment check
  ├── name, status (ok | warning | error | not-installed)
  └── value?, expected?, message?

ProjectInfo           Extracted project configuration
  ├── rnVersion, reactVersion, packageManager
  ├── ios? { deploymentTarget, hermesEnabled, flipperEnabled, ... }
  └── android? { compileSdk, targetSdk, agpVersion, namespace, ... }

FixAction             Executable fix
  ├── id, title, description
  ├── commands: string[]
  ├── executable: boolean
  └── caution: safe | moderate | destructive
```

### Guide Types

```
FeatureCategory       → LibraryRecommendation[]
GuideCategory         → GuideEntry[] (with pros/cons/code examples)
PublishingGuide       → PublishingStep[] + commonRejections
VersionUpgradeGuide   → UpgradeStep[] + majorChanges
CompatibilityRule     → version constraints + fix
TroubleshootRecipe    → symptom → checks → commonCause → fix
PerformanceGuide      → diagnosticSteps + optimizations + tools
MigrationGuide        → direction + steps + warnings
DeeplinkGuide         → platform-specific steps
MonorepoGuide         → tool-specific steps + commonPitfalls
ReleaseChecklistGuide → checklist items (critical flag) + commonRejections
EnvSetupGuide         → OS + targetPlatform + prerequisites + steps
StateManagementGuide  → bundleSize, learningCurve, features, codeExample
CodeSnippet           → category, dependencies, code, usage
```

---

## Safety Design

| Principle | Implementation |
|-----------|----------------|
| Dry-run by default | `apply_fix` requires explicit `dry_run: false` to execute |
| Safe-only auto-fixes | Only whitelisted, non-destructive commands run automatically |
| No external calls | All processing is local — no APIs, no telemetry |
| Shell timeout | Default 10s per command, 2min max for fixes |
| Output capping | Shell output truncated to 5 KB per command; buffer max 10 MB |

### Predefined Fix Actions

| Fix ID | Description | Caution |
|--------|-------------|---------|
| `ios-pod-install` | `pod deintegrate` + `pod install` | safe |
| `ios-clean-derived-data` | Remove `~/Library/Developer/Xcode/DerivedData` | safe |
| `metro-cache-reset` | `react-native start --reset-cache` (manual) | safe |
| `android-clean` | `./gradlew clean` | safe |
| `node-modules-reinstall` | Delete `node_modules` + `npm install` | safe |

---

## Usage

### Installation

```bash
# From npm
gemini extensions install rn-build-doctor

# Local development
cd rn-build-doctor
npm install && npm run build
gemini extensions link .
```

### Slash Commands

```
/doctor              — Check environment health
/diagnose            — Paste build log, get diagnosis
/fix ios             — Auto-fix iOS build issues
/fix android         — Auto-fix Android build issues
/howto               — Find libraries by feature
/guide               — Best practice guides
/upgrade             — Version migration help
/publish             — App Store / Play Store guide
/native              — TurboModules / Fabric
/compat              — Library compatibility check
/troubleshoot        — Symptom-based help
/performance         — Performance optimization
/migration           — Expo <-> bare workflow
/deeplink            — Deep linking setup
/monorepo            — Monorepo configuration
/release-checklist   — Pre-release checklist
/env-setup           — Environment setup for your OS
/state               — State management comparison
/snippet             — Code snippets
/template            — Project starter templates
```

### Example Workflows

**Diagnose a build failure:**

```
> /diagnose
Paste your build log...

> [paste xcodebuild output]
# Gemini calls diagnose_build_error → returns matched errors with fixes
# If auto-fixable → suggests /fix ios
```

**Check environment before starting:**

```
> /doctor
# Runs check_rn_environment
# Returns status of Node, npm, Xcode, CocoaPods, ANDROID_HOME, Java, etc.
```

**Find a library:**

```
> /howto camera
# Returns top camera libraries with setup steps, permissions, Expo support
```

### Development

```bash
npm run dev          # Watch mode (recompile on change)
npm run inspector    # MCP Inspector UI for debugging tool calls
npm run rebuild      # Clean + full compile
```

---

## Extension Registration

**`gemini-extension.json`:**

```json
{
  "name": "rn-build-doctor",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "rn-build-doctor": {
      "command": "node",
      "args": ["${extensionPath}/dist/server.js"],
      "cwd": "${extensionPath}"
    }
  }
}
```

- `contextFileName` — Gemini loads `GEMINI.md` as expert context alongside the MCP tools
- `mcpServers` — declares the MCP server process to spawn

## Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` ^1.17.0 | MCP server framework (McpServer, StdioServerTransport) |
| `zod` ^3.25.0 | Tool input schema validation |
| `typescript` ^5.4.0 | Build toolchain |
