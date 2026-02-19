# rn-build-doctor — Quick Usage Guide

React Native build diagnosis & development assistant for Gemini CLI.

---

## Setup

```bash
# 1. Install dependencies
cd rn-build-doctor
npm install

# 2. Build
npm run build

# 3. Link to Gemini CLI (local development)
gemini extensions link .

# 4. Verify
gemini  # then type /doctor to test
```

### Development mode

```bash
npm run dev          # watch mode (auto-recompile on save)
npm run inspector    # launch MCP Inspector for debugging
```

---

## Slash Commands

| Command | What it does |
|---|---|
| `/doctor` | Full environment health check (Node, Xcode, Android SDK, etc.) |
| `/diagnose` | Paste a build error log and get a diagnosis |
| `/fix ios` | Diagnose + auto-fix iOS build errors |
| `/fix android` | Diagnose + auto-fix Android build errors |
| `/howto` | Find recommended libraries by feature (camera, maps, storage, etc.) |
| `/guide` | Best practice guides (architecture, testing, security, CI/CD, etc.) |
| `/upgrade` | React Native version upgrade / migration guide |
| `/publish` | App Store & Google Play publishing walkthrough |
| `/native` | Native module & TurboModule development guide |
| `/compat` | Check library compatibility with your RN version |
| `/troubleshoot` | Symptom-based troubleshooting recipes |
| `/performance` | Performance optimization tips (rendering, lists, startup, memory) |
| `/migration` | Expo <-> bare workflow migration guide |
| `/deeplink` | Deep linking setup (Universal Links / App Links) |
| `/monorepo` | Monorepo setup (Turborepo, Nx, Yarn/pnpm Workspaces) |
| `/release-checklist` | Pre-release checklist for app store submission |
| `/env-setup` | Environment setup guide (macOS / Windows / Linux) |
| `/state` | State management comparison (Zustand, Redux, Jotai, MobX) |
| `/snippet` | Ready-to-use code snippets (navigation, API, hooks, auth, etc.) |
| `/template` | Project starter template recommendations |

---

## MCP Tools (used by Gemini automatically)

| Tool | Description |
|---|---|
| `diagnose_build_error` | Analyzes build error logs against pattern DB |
| `check_rn_environment` | Checks Node, Xcode, CocoaPods, Java, Android SDK, Gradle, etc. |
| `get_project_info` | Reads package.json, Podfile, build.gradle, and other config files |
| `apply_fix` | Runs predefined safe fixes (supports `dry_run` preview) |
| `recommend_library` | Suggests libraries by feature with setup instructions |
| `guide_best_practice` | Returns best practice guidance by topic |
| `guide_publishing` | Step-by-step publishing guide for iOS / Android |
| `guide_template` | Starter template recommendations |
| `guide_upgrade` | Version migration guides with breaking changes |
| `guide_native_module` | TurboModules, Fabric, New Architecture guidance |
| `check_compatibility` | Validates library-version compatibility |
| `guide_troubleshoot` | Symptom-based troubleshooting |
| `guide_performance` | Performance optimization by category |
| `guide_migration` | Expo <-> bare workflow transition |
| `guide_deeplink` | Deep linking configuration |
| `guide_monorepo` | Monorepo setup guides |
| `guide_release_checklist` | Pre-release checklists |
| `guide_env_setup` | Platform-specific environment setup |
| `guide_state_management` | State management solution comparison |
| `generate_snippet` | Code snippet generation |

---

## Common Workflows

### "My build is failing"

```
> /diagnose
# Paste your error log, get diagnosis + fix suggestions
```

### "Setting up a new machine"

```
> /env-setup
# Follow the guide for your OS, then verify with:
> /doctor
```

### "Upgrading React Native"

```
> /compat           # check your libraries first
> /upgrade          # get the migration guide
> /doctor           # verify after upgrading
```

### "Preparing for release"

```
> /release-checklist
> /publish
```

---

## Requirements

- Node.js >= 20
- Gemini CLI installed (`npm install -g @google/gemini-cli`)
