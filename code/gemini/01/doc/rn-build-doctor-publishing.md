# RN-Build-Doctor — How to Publish

## Distribution Model

Gemini CLI extensions are distributed via **GitHub repositories**, not npm. Users install with:

```bash
gemini extensions install https://github.com/<your-username>/rn-build-doctor
```

There is no `npm publish` step for the extension itself.

---

## Publishing Steps

### 1. Build the project

```bash
cd rn-build-doctor
npm install
npm run rebuild
```

### 2. Push to a public GitHub repository

```bash
git init
git add -A
git commit -m "Initial release"
gh repo create rn-build-doctor --public --push --source=.
```

### 3. Add the `gemini-cli-extension` topic

Go to your GitHub repository page:

**Settings > About > Topics** → add `gemini-cli-extension`

This is the only step needed to appear in the official gallery. Google's crawler discovers repositories with this topic automatically (within ~1 day).

### 4. Users can now install it

```bash
gemini extensions install https://github.com/<your-username>/rn-build-doctor
```

---

## Gallery

The official extensions gallery is at **[geminicli.com/extensions](https://geminicli.com/extensions/)** (397+ extensions listed). There is no manual submission — adding the GitHub topic is sufficient.

---

## Release Strategies

### Option A: Direct from default branch (simplest)

Users install from your repo's `main` branch. When you push new commits, the CLI prompts users to update.

```bash
# Users install latest main
gemini extensions install https://github.com/<user>/rn-build-doctor
```

### Option B: GitHub Releases with archives (faster installs)

Create GitHub Releases with pre-built archives. The CLI checks the "Latest" release.

**Archive naming convention:**

| Pattern | Example |
|---------|---------|
| `{platform}.{arch}.{name}.tar.gz` | `darwin.arm64.rn-build-doctor.tar.gz` |
| `{platform}.{name}.tar.gz` | `linux.rn-build-doctor.tar.gz` |
| Generic fallback | `rn-build-doctor.tar.gz` |

Valid platforms: `darwin`, `linux`, `win32`
Valid architectures: `x64`, `arm64`
Valid formats: `.tar.gz`, `.zip`

Users can pin to a version:

```bash
gemini extensions install https://github.com/<user>/rn-build-doctor --ref=v1.0.0
```

---

## Required Files Checklist

| File | Required | Purpose |
|------|----------|---------|
| `gemini-extension.json` | **Yes** | Extension manifest — name, version, MCP server config |
| `GEMINI.md` | Recommended | Expert context injected into Gemini sessions |
| `package.json` | Yes (for build) | Dependencies and build scripts (not read by Gemini CLI) |
| `dist/` | Yes | Compiled JS output |
| `commands/*.toml` | Optional | Slash command definitions |
| `skills/` | Optional | Agent skill definitions |

### `gemini-extension.json` key fields

```json
{
  "name": "rn-build-doctor",
  "version": "1.0.0",
  "description": "Diagnose and fix React Native iOS/Android build errors",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "rn-build-doctor": {
      "command": "node",
      "args": ["${extensionPath}${/}dist${/}server.js"],
      "cwd": "${extensionPath}"
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Unique ID (lowercase, numbers, dashes) |
| `version` | Semantic version |
| `description` | Shown in the gallery |
| `contextFileName` | Context file(s) loaded into every session |
| `mcpServers` | MCP server process to spawn |
| `settings` | User-configurable settings prompted at install |
| `excludeTools` | Tools to block |

Variable substitutions: `${extensionPath}`, `${workspacePath}`, `${/}` (path separator)

---

## `package.json` `files` field

The `files` array in `package.json` controls what gets included in the npm tarball (relevant if you ever npm-publish as a dependency, but not used by Gemini CLI). For GitHub distribution, make sure these files are **committed to the repo** or included in release archives:

```json
"files": [
  "dist",
  "commands",
  "skills",
  "gemini-extension.json",
  "GEMINI.md"
]
```

---

## Development Workflow Summary

```
Local dev          →  gemini extensions link .
                      (symlink, changes reflect immediately)

Test               →  gemini
                      > /doctor
                      > /diagnose

Debug              →  npm run inspector
                      (MCP Inspector UI)

Publish            →  Push to GitHub + add 'gemini-cli-extension' topic

Version update     →  Bump version in gemini-extension.json + package.json
                      git tag v1.1.0 && git push --tags

Users install      →  gemini extensions install <github-url>
Users update       →  CLI auto-prompts on new commits/releases
```

---

## References

- [Extensions Overview](https://geminicli.com/docs/extensions/)
- [Writing Extensions](https://geminicli.com/docs/extensions/writing-extensions/)
- [Extension Reference (Schema)](https://geminicli.com/docs/extensions/reference/)
- [Releasing Extensions](https://geminicli.com/docs/extensions/releasing)
- [Extensions Gallery](https://geminicli.com/extensions/)
