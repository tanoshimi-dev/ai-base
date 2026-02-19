# Claude Code Session Vault — Development Plan

## Tech Stack

| Tool | Purpose |
|---|---|
| TypeScript | Implementation language |
| Node.js 20+ | Runtime |
| `@modelcontextprotocol/sdk` | MCP server framework |
| `zod` | Input validation |
| `tsup` | Build / bundling |
| `vitest` | Testing |
| `prettier` | Code formatting |

## Phase 0: Project Scaffold (Day 1)

### 0.1 Initialize project

```
session-vault/
├── package.json
├── tsconfig.json
├── .gitignore
├── .claude-plugin/
│   └── plugin.json
└── src/
    └── server.ts        # Empty MCP server shell
```

- `npm init`
- Install dev dependencies: `typescript`, `tsup`, `vitest`, `prettier`
- Install runtime dependencies: `@modelcontextprotocol/sdk`, `zod`
- Configure `tsconfig.json` (target ES2022, module NodeNext)
- Configure `tsup` for single-file bundle to `dist/server.js`

### 0.2 Plugin manifest

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "session-vault",
  "description": "Save, review, and manage Claude Code conversation history",
  "version": "0.1.0",
  "author": { "name": "your-name" }
}
```

### 0.3 MCP server shell

Create minimal `src/server.ts` that starts an MCP stdio server with zero tools. Verify it runs:

```bash
echo '{}' | node dist/server.js
```

**Deliverable:** Plugin loads in Claude Code with `claude --plugin-dir ./session-vault`, shows 0 tools.

---

## Phase 1: Storage Layer (Day 2-3)

### 1.1 Config module (`src/utils/config.ts`)

- Read/write `~/.session-vault/config.json`
- Provide defaults for all options
- Validate with Zod schema

### 1.2 Slug utility (`src/utils/slug.ts`)

- Convert project path to slug: `/home/user/my-project` → `home-user-my-project`
- Handle Windows paths: `C:\Users\user\project` → `c-users-user-project`

### 1.3 Git utility (`src/utils/git.ts`)

- `getCurrentBranch()` — run `git rev-parse --abbrev-ref HEAD`
- `getCurrentCommit()` — run `git rev-parse --short HEAD`
- Gracefully return `null` if not in a git repo

### 1.4 Transcript parser (`src/storage/transcript-parser.ts`)

- Read Claude Code `.jsonl` session file
- Parse each line as JSON
- Extract `human` and `assistant` messages
- Skip `system` messages and tool internals
- Convert to clean Markdown format:

```markdown
## User
[user message]

## Claude
[assistant message]
```

- Apply redaction rules from config (strip secrets, env vars)

### 1.5 Vault storage (`src/storage/vault.ts`)

- `ensureVaultDir()` — create `~/.session-vault/projects/<slug>/` if missing
- `saveTranscript(markdown, metadata)` — write `.md` and `.meta.json` files
- `readTranscript(id)` — read `.md` file by ID
- `readMetadata(id)` — read `.meta.json` file by ID
- `deleteEntry(id)` — remove both files

### 1.6 Index manager (`src/storage/index-manager.ts`)

- `loadIndex()` — read `~/.session-vault/index.json`
- `addEntry(metadata)` — append to index
- `removeEntry(id)` — remove from index
- `rebuildIndex()` — scan all `.meta.json` files and rebuild (recovery)

### Tests

- Unit tests for transcript parser (sample JSONL → expected Markdown)
- Unit tests for slug conversion (cross-platform paths)
- Unit tests for index manager (add, remove, rebuild)

**Deliverable:** Storage layer can read Claude Code sessions and persist them as Markdown.

---

## Phase 2: MCP Tools (Day 4-6)

### 2.1 `save_conversation` tool

- Register in MCP server with Zod input schema
- Locate current session JSONL using `session_id` or `transcript_path` from hook input
- Call transcript parser → vault storage → index manager
- Return saved entry metadata

### 2.2 `list_conversations` tool

- Read index, apply filters (project, tag, limit, offset)
- Sort by `saved_at` descending
- Return array of summary objects

### 2.3 `search_conversations` tool

- Search index metadata (tags, note, summary) first
- Then scan `.md` files for content matches
- Return ranked results with match context (surrounding lines)

### 2.4 `get_conversation` tool

- Read full transcript or extract sections
- Section extraction logic:
  - `decisions` — scan for decision-indicating phrases
  - `code` — extract fenced code blocks
  - `errors` — extract error-related exchanges

### 2.5 `delete_conversations` tool

- Resolve filter to list of IDs
- Require `confirm: true` to execute
- Delete files and update index

### 2.6 `export_conversation` tool

- Read conversation
- Format as Markdown (passthrough), JSON, or HTML
- Write to output directory

### Tests

- Integration tests: save → list → get → delete lifecycle
- Edge cases: empty session, very large session, no git repo, Windows paths

**Deliverable:** All 6 MCP tools functional. Can be tested via MCP inspector or Claude Code.

---

## Phase 2.5: Web Viewer (Day 6-8)

### 2.5.1 HTTP server (`src/viewer/server.ts`)

- Create HTTP server using Node.js native `http` module
- Route handler: `/` and non-API routes → serve embedded SPA
- Route handler: `/api/*` → REST API handlers
- Bind to `127.0.0.1` only (security: no external access)
- PID file management at `~/.session-vault/.viewer.pid`
- Graceful shutdown on SIGTERM / SIGINT
- CORS headers for localhost

### 2.5.2 REST API (`src/viewer/api.ts`)

Implement thin wrappers around the existing storage layer:

- `GET /api/conversations` — list with query params (`q`, `tag`, `project`, `from`, `to`, `limit`, `offset`)
- `GET /api/conversations/:id` — full transcript + metadata
- `DELETE /api/conversations/:id` — delete with response confirmation
- `GET /api/tags` — aggregate tags from index with counts
- `GET /api/projects` — aggregate projects from index with stats
- `GET /api/stats` — total conversations, total size, date range

All endpoints return JSON. Error responses use standard `{ error: string, code: number }` format.

### 2.5.3 Embedded SPA (`src/viewer/app.html`)

A single HTML file with inline `<style>` and `<script>`. No build step for the frontend.

**Dashboard page (`/`):**
- Conversation list with card layout
- Search bar with instant client-side filtering
- Tag filter chips (click to toggle)
- Project dropdown filter
- Date range picker (simple `<input type="date">`)
- Sort: newest first / oldest first / most messages
- Pagination (20 per page)

**Conversation detail page (`/conversation/:id`):**
- Header: title, date, project, branch, tags, note
- Transcript: alternating User / Claude message blocks
- Code blocks: syntax-highlighted with copy-to-clipboard button
- Markdown rendering: convert Markdown to HTML using a minimal inline parser (~2KB)

**Styling:**
- Dark mode (default) / light mode toggle, saved in localStorage
- CSS variables for theming
- System font stack
- Responsive grid layout

**Keyboard shortcuts:**
- `/` → focus search
- `j/k` → navigate list
- `Enter` → open selected
- `Esc` → back to list
- `t` → toggle dark/light

### 2.5.4 `start_viewer` MCP tool (`src/tools/start-viewer.ts`)

- Register in MCP server
- Start/stop the HTTP server
- Auto-open browser using platform-specific command (`open` / `xdg-open` / `start`)
- Write/read PID file for lifecycle management

### 2.5.5 Build configuration

- Configure `tsup` to inline `app.html` as a string constant in the server bundle
- Or: read the HTML file at runtime from `dist/viewer/app.html`
- Ensure the HTML file is included in the npm package `files` field

### Tests

- API endpoint tests: request → response validation
- Server lifecycle: start, PID file, stop, PID cleanup
- Edge cases: port already in use, missing vault directory

**Deliverable:** Browser viewer works end-to-end. `/viewer` opens browser with full UI.

---

## Phase 3: Skills (Day 9-10)

### 3.1 Create skill directories

```
skills/
├── save/SKILL.md
├── history/SKILL.md
├── extract/SKILL.md
├── vault-clear/SKILL.md
├── export/SKILL.md
└── viewer/SKILL.md
```

### 3.2 Write SKILL.md for each

Each SKILL.md contains:
- Frontmatter (name, description, allowed-tools)
- Instructions for Claude on how to use the MCP tools
- Output formatting guidelines
- Argument handling (`$ARGUMENTS`)

Example: `skills/save/SKILL.md`

```yaml
---
name: save
description: Save the current conversation to the vault with optional tags and notes
argument-hint: [tags] [--note "description"]
---

Save the current Claude Code conversation to session-vault.

## Arguments
- `$ARGUMENTS` may contain comma-separated tags and a --note flag
- Parse tags from the first argument (split by comma)
- Extract --note value if present

## Steps
1. Call the `save_conversation` MCP tool with:
   - tags from arguments
   - note from --note flag
2. Report the saved entry: ID, tags, summary, file path

## Output format
Show a concise confirmation with the entry details.
```

### 3.3 Test each slash command

- Verify each skill is listed in `/` menu
- Test argument parsing
- Test error cases (no session to save, invalid ID for extract)

**Deliverable:** All 6 slash commands work end-to-end.

---

## Phase 4: Hooks (Day 11)

### 4.1 Auto-save hook

Create `src/hooks/auto-save.ts`:
- Read stdin for session metadata
- Check config for `auto_save: true`
- Check `auto_save_min_messages` threshold
- Save to vault with `auto` tag
- Exit 0 on success, non-zero on skip

Create `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/dist/hooks/auto-save.js",
            "timeout": 5000,
            "async": true
          }
        ]
      }
    ]
  }
}
```

### 4.2 Build hook into dist

Configure `tsup` to also bundle `src/hooks/auto-save.ts` → `dist/hooks/auto-save.js`.

### Tests

- Verify hook fires on session end
- Verify skip when `auto_save: false`
- Verify skip when message count < threshold

**Deliverable:** Auto-save works. Conversations are saved without user action.

---

## Phase 5: Polish & Edge Cases (Day 12-13)

### 5.1 Error handling

- Graceful error when `~/.claude/projects/` doesn't exist
- Graceful error when session JSONL is missing or corrupted
- Graceful error when vault directory is read-only
- Helpful error messages for all failure modes

### 5.2 Cross-platform testing

- Test on macOS, Linux, Windows
- Verify path handling (forward/back slashes, spaces in paths)
- Verify home directory detection (`HOME` vs `USERPROFILE`)

### 5.3 Large conversation handling

- Stream-parse JSONL for conversations > 10MB
- Truncate display in `/history` for very long summaries
- Respect `max_transcript_size_mb` config

### 5.4 Config management via /save

- `/session-vault:save --enable-auto` writes config
- `/session-vault:save --disable-auto` writes config

### 5.5 Index recovery

- If `index.json` is missing or corrupted, auto-rebuild from `.meta.json` files
- Log warning to user

**Deliverable:** Production-ready plugin with no known edge case failures.

---

## Phase 6: Documentation & README (Day 14)

### 6.1 README.md

- Quick start guide
- All commands with examples
- Configuration reference
- Troubleshooting FAQ

### 6.2 CHANGELOG.md

- v0.1.0 initial release notes

**Deliverable:** Complete documentation ready for publish.

---

## Timeline Summary

| Phase | Days | Focus |
|---|---|---|
| 0 - Scaffold | 1 | Project setup, plugin manifest, MCP shell |
| 1 - Storage | 2 | Config, parsers, vault, index |
| 2 - MCP Tools | 2 | All 7 tool implementations + tests |
| 2.5 - Web Viewer | 3 | HTTP server, REST API, embedded SPA |
| 3 - Skills | 2 | All 6 SKILL.md files + testing |
| 4 - Hooks | 1 | Auto-save hook |
| 5 - Polish | 2 | Error handling, cross-platform, edge cases |
| 6 - Docs | 1 | README, changelog |
| **Total** | **14 days** | |

## Risk & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Claude Code JSONL format changes | Parser breaks | Pin to known format, add format version detection |
| `~/.claude/` path structure changes | Cannot locate sessions | Use `transcript_path` from hook stdin when available |
| Large sessions cause OOM | Crash | Stream-parse, enforce size limit |
| Index corruption | Lost metadata | Auto-rebuild from `.meta.json` files |
| Plugin API changes | Plugin won't load | Pin `plugin.json` schema version, test against Claude Code betas |
