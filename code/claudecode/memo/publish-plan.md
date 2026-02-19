# Claude Code Session Vault — Publish Plan

## Distribution Strategy

### Primary: npm Package

session-vault is distributed as an npm package. Users install it globally or use npx.

```bash
npm install -g session-vault-claude
# or
npx session-vault-claude
```

**Package name:** `session-vault-claude` (scoped: `@session-vault/claude-plugin`)

### Secondary: Claude Code Plugin Marketplace

When the Claude Code plugin marketplace stabilizes, publish there for native discovery:

```bash
/plugin install session-vault
```

### Tertiary: GitHub Releases

Tagged releases on GitHub with pre-built `dist/` artifacts for manual installation.

---

## Pre-Publish Checklist

### Code Quality

- [ ] All tests pass (`vitest run`)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Code formatted (`prettier --check .`)
- [ ] No lint warnings
- [ ] Manual test on macOS
- [ ] Manual test on Linux
- [ ] Manual test on Windows

### Functionality

- [ ] `/session-vault:save` — works with tags, notes, and default
- [ ] `/session-vault:history` — lists, filters, searches
- [ ] `/session-vault:extract` — all sections (full, decisions, code, errors)
- [ ] `/session-vault:vault-clear` — filter by age, tag; confirmation works
- [ ] `/session-vault:export` — md, json, html formats
- [ ] `/session-vault:viewer` — starts server, opens browser, stop works
- [ ] Viewer dashboard — search, filter, sort, pagination
- [ ] Viewer detail — transcript rendering, code highlighting, copy button
- [ ] Viewer dark/light mode toggle
- [ ] Viewer keyboard shortcuts
- [ ] Viewer binds to 127.0.0.1 only (security)
- [ ] Auto-save hook fires on session end
- [ ] Config file created on first use
- [ ] Index rebuild works when index.json is deleted
- [ ] Large conversations (1000+ messages) handled without crash

### Documentation

- [ ] README.md with install, usage, config reference
- [ ] CHANGELOG.md with v0.1.0 entry
- [ ] LICENSE file (MIT)
- [ ] plugin.json version matches package.json version

### Package

- [ ] `package.json` has correct `name`, `version`, `description`, `keywords`, `repository`
- [ ] `files` field includes only `dist/`, `skills/`, `hooks/`, `.claude-plugin/`, `.mcp.json`, `README.md`, `LICENSE`
- [ ] `bin` field points to `dist/server.js` (if CLI entry needed)
- [ ] `.npmignore` excludes `src/`, `tests/`, `node_modules/`, `.git/`
- [ ] `npm pack` produces clean tarball; inspect contents

---

## npm Package Configuration

### package.json

```json
{
  "name": "session-vault-claude",
  "version": "0.1.0",
  "description": "Claude Code plugin for saving, reviewing, and managing conversation history",
  "keywords": [
    "claude-code",
    "claude",
    "plugin",
    "conversation-history",
    "session-management",
    "mcp"
  ],
  "license": "MIT",
  "author": "your-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-name/session-vault-claude"
  },
  "files": [
    "dist/",
    "skills/",
    "hooks/",
    ".claude-plugin/",
    ".mcp.json",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "prepublishOnly": "npm run build && npm run test"
  },
  "engines": {
    "node": ">=20"
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
      - run: npm run build

  publish:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  github-release:
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
```

---

## Versioning Strategy

Follow [Semantic Versioning](https://semver.org/):

| Version | When |
|---|---|
| `0.1.0` | Initial release — core features |
| `0.1.x` | Bug fixes |
| `0.2.0` | New features (e.g., context injection hook, AI summaries) |
| `1.0.0` | Stable API, production-ready |

### Release Process

```bash
# 1. Update version
npm version patch|minor|major

# 2. Push tag
git push origin main --tags

# 3. CI handles build, test, publish
```

---

## Release Roadmap

### v0.1.0 — MVP (Initial Release)

- 7 MCP tools (save, list, search, get, delete, export, viewer)
- 6 skills (slash commands including `/viewer`)
- Browser-based conversation viewer (local HTTP server + embedded SPA)
- Auto-save hook (SessionEnd)
- Markdown + JSON storage
- Full-text search
- Cross-platform (macOS, Linux, Windows)
- Secret redaction

### v0.2.0 — Enhanced Search & UX

- AI-powered conversation summaries (opt-in, uses Claude haiku)
- Fuzzy search with better ranking
- `/session-vault:history` interactive mode
- Tag auto-suggestions based on conversation content
- Conversation statistics (total saved, by project, by tag)

### v0.3.0 — Team Features

- Export to Notion / Obsidian format
- Shared vault directory (configurable path for team drives)
- Conversation diff between sessions
- Session linking (mark two conversations as related)

### v1.0.0 — Stable

- Stable storage format (backward compatibility guarantee)
- Migration tool for format upgrades
- Plugin marketplace listing
- Comprehensive test coverage (>90%)

---

## Marketing & Visibility

### README Badges

```markdown
[![npm version](https://img.shields.io/npm/v/session-vault-claude)](https://www.npmjs.com/package/session-vault-claude)
[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Announcement Channels

- Claude Code community (GitHub Discussions)
- Anthropic Discord
- Reddit: r/ClaudeAI
- Twitter/X with `#ClaudeCode` hashtag
- Dev.to / Hashnode blog post: "How I built a conversation history manager for Claude Code"

### SEO Keywords

- claude code plugin
- claude code conversation history
- claude code session manager
- claude code extension
- mcp server conversation
- ai coding assistant history

---

## Post-Publish Monitoring

| Metric | Tool | Target |
|---|---|---|
| npm downloads/week | npm stats | 100+ in first month |
| GitHub stars | GitHub | 50+ in first month |
| Open issues | GitHub | < 10 unresolved at any time |
| Test pass rate | GitHub Actions | 100% on all platforms |
| User feedback | GitHub Discussions | Respond within 48 hours |
