# Claude Code Session Vault — Architecture

## Overview

```
User ──→ Claude Code ──→ session-vault plugin
                             │
           ┌─────────────────┼─────────────────────┐
           │                 │                      │
      Skills (6)       MCP Server (7 tools)     Hooks (2)
      /save             save_conversation        SessionEnd → auto-save
      /history          list_conversations       PreToolUse → inject context
      /extract          search_conversations
      /vault-clear      get_conversation
      /export           delete_conversations
      /viewer           export_conversation
                        start_viewer
                             │
                        Storage Layer
                             │
                   ~/.session-vault/
                   ├── config.json
                   ├── index.json
                   └── projects/<slug>/*.md + *.meta.json

                             │
User ──→ Browser ──→ http://localhost:3777
                             │
                        Web Server (built-in)
                        ├── GET  /                     → Dashboard SPA
                        ├── GET  /api/conversations    → List / search
                        ├── GET  /api/conversations/:id → Detail
                        ├── DELETE /api/conversations/:id → Delete
                        ├── GET  /api/tags             → Tag list
                        ├── GET  /api/projects         → Project list
                        └── GET  /api/stats            → Vault stats
```

## Four Layers

| Layer | Role | Files |
|---|---|---|
| **Skills** | User-facing slash commands that invoke MCP tools | `skills/*/SKILL.md` (6 files) |
| **MCP Server** | Backend logic — CRUD operations on the conversation archive | `src/server.ts` + `src/tools/*.ts` (7 files) |
| **Web Viewer** | Browser-based UI for browsing conversations | `src/viewer/` (server + embedded SPA) |
| **Hooks** | Event-driven automation (auto-save, context injection) | `hooks/hooks.json` + `hooks/*.sh` (2 hooks) |

## Layer 1: Skills (User Interface)

Each skill is a SKILL.md file that tells Claude how to orchestrate MCP tools for the user's intent.

### Skill Definitions

| Skill | Slash Command | Description |
|---|---|---|
| `save` | `/session-vault:save [tag]` | Save current conversation with optional tags and note |
| `history` | `/session-vault:history [query]` | List and search saved conversations |
| `extract` | `/session-vault:extract <id>` | Extract a conversation into structured Markdown |
| `vault-clear` | `/session-vault:vault-clear [filter]` | Delete saved conversations by filter |
| `export` | `/session-vault:export <id>` | Export conversations to file |
| `viewer` | `/session-vault:viewer` | Launch browser-based conversation viewer |

### Skill → MCP Tool Mapping

```
/save         →  save_conversation
/history      →  list_conversations + search_conversations
/extract      →  get_conversation (with section param)
/vault-clear  →  delete_conversations
/export       →  export_conversation
/viewer       →  start_viewer
```

## Layer 2: MCP Server (Backend)

A stdio-based MCP server implemented in TypeScript. Runs as a local process managed by Claude Code.

### MCP Tools

#### `save_conversation`

```
Input:
  - session_id: string (optional, defaults to current session)
  - tags: string[] (optional)
  - note: string (optional)

Process:
  1. Read the session JSONL from ~/.claude/projects/<project>/
  2. Parse messages, extract human/assistant turns
  3. Convert to clean Markdown format
  4. Generate auto-summary (first user message + last assistant response)
  5. Collect git metadata (branch, commit hash)
  6. Write .md transcript + .meta.json to ~/.session-vault/projects/<slug>/
  7. Update index.json

Output:
  - id: string (saved conversation ID)
  - path: string (file path)
  - summary: string
```

#### `list_conversations`

```
Input:
  - project: string (optional, filter by project)
  - tag: string (optional, filter by tag)
  - limit: number (default: 20)
  - offset: number (default: 0)

Process:
  1. Read index.json
  2. Apply filters
  3. Sort by saved_at descending

Output:
  - conversations: Array<{ id, summary, tags, saved_at, project, message_count }>
  - total: number
```

#### `search_conversations`

```
Input:
  - query: string (full-text search)
  - project: string (optional)
  - tag: string (optional)
  - date_from: string (optional, ISO date)
  - date_to: string (optional, ISO date)

Process:
  1. Read index.json for metadata matches
  2. Scan .md files for content matches
  3. Rank by relevance (metadata match > content match)

Output:
  - results: Array<{ id, summary, match_context, score }>
```

#### `get_conversation`

```
Input:
  - id: string
  - section: "full" | "decisions" | "code" | "errors" (default: "full")

Process:
  1. Read .md transcript file
  2. If section != "full", parse and extract relevant sections
     - "decisions": lines containing decision keywords (decided, chose, approach, because)
     - "code": fenced code blocks
     - "errors": error messages and their resolutions

Output:
  - content: string (Markdown)
  - metadata: object
```

#### `delete_conversations`

```
Input:
  - ids: string[] (optional, specific IDs)
  - older_than: string (optional, e.g., "30d", "6m")
  - tag: string (optional)
  - confirm: boolean (required, must be true)

Process:
  1. Resolve which conversations match the filter
  2. If confirm is false, return preview of what would be deleted
  3. If confirm is true, delete .md + .meta.json files and update index.json

Output:
  - deleted_count: number
  - deleted_ids: string[]
```

#### `export_conversation`

```
Input:
  - id: string (or "all")
  - format: "md" | "json" | "html" (default: "md")
  - output_dir: string (optional, defaults to cwd)

Process:
  1. Read conversation(s)
  2. Convert to target format
  3. Write to output directory

Output:
  - files: string[] (paths of exported files)
```

#### `start_viewer`

```
Input:
  - port: number (default: 3777)
  - action: "start" | "stop" (default: "start")

Process:
  1. If action is "start":
     a. Check if a viewer is already running (PID file at ~/.session-vault/.viewer.pid)
     b. Start HTTP server on 127.0.0.1:<port>
     c. Write PID to ~/.session-vault/.viewer.pid
     d. Open default browser to http://localhost:<port>
  2. If action is "stop":
     a. Read PID from .viewer.pid
     b. Kill the process
     c. Remove .viewer.pid

Output:
  - status: "started" | "stopped" | "already_running"
  - url: string (e.g., "http://localhost:3777")
  - pid: number
```

### MCP Server Registration

The plugin bundles MCP server config in `.mcp.json`:

```json
{
  "mcpServers": {
    "session-vault": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/server.js"],
      "env": {
        "VAULT_DIR": "${HOME}/.session-vault"
      }
    }
  }
}
```

## Layer 3: Web Viewer (Browser UI)

A self-contained local web server that serves a single-page application for browsing saved conversations.

### Architecture

```
/viewer skill invoked
    │
    ▼
start_viewer MCP tool
    │
    ▼
Node.js HTTP server (127.0.0.1:3777)
    │
    ├── Static routes → Embedded SPA (single HTML file with inline CSS/JS)
    │
    └── API routes → Read from ~/.session-vault/ (reuses storage layer)
            │
            ├── GET /api/conversations      → index-manager.ts
            ├── GET /api/conversations/:id   → vault.ts
            ├── DELETE /api/conversations/:id → vault.ts + index-manager.ts
            ├── GET /api/tags               → index-manager.ts
            ├── GET /api/projects           → index-manager.ts
            └── GET /api/stats              → index-manager.ts
```

### Web Server (`src/viewer/server.ts`)

- Built with Node.js native `http` module — no Express, no Fastify, zero dependencies
- Binds to `127.0.0.1` only (never `0.0.0.0`) for security
- Serves the embedded SPA at `/` and all non-`/api/` routes (client-side routing)
- JSON API at `/api/*` with proper CORS headers (localhost only)
- Graceful shutdown on SIGTERM / SIGINT
- Writes PID file to `~/.session-vault/.viewer.pid` for lifecycle management

### Embedded SPA (`src/viewer/app.html`)

A single HTML file with embedded `<style>` and `<script>` — no build step for the frontend.

#### Pages (client-side routing via hash or History API)

| Page | Description |
|---|---|
| **Dashboard** (`/`) | Conversation list with search bar, tag filter chips, date range picker, project filter dropdown. Each row shows: date, project, tags, summary, message count. Click to open detail. |
| **Conversation Detail** (`/conversation/:id`) | Full transcript rendered as Markdown. User messages in one style, Claude messages in another. Code blocks with syntax highlighting (using a lightweight inline highlighter). Copy-to-clipboard button on each code block. Metadata sidebar (date, project, branch, tags, note). |
| **Tags** (`/tags`) | All tags displayed as a cloud or sorted list with conversation count. Click a tag to filter dashboard. |
| **Projects** (`/projects`) | Projects grouped with conversation count and date range. Click to filter dashboard. |

#### UI Components

```
┌─────────────────────────────────────────────────────────────┐
│  Session Vault                    [Search...]  [Tags ▾]     │
│                                   [Projects ▾] [Dark/Light] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📅 2026-02-19  my-app  [async-bug]                  │    │
│  │ Debugged race condition in useEffect cleanup...      │    │
│  │ 42 messages                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📅 2026-02-18  my-app  [auth] [security]            │    │
│  │ Switched JWT storage to httpOnly cookies...          │    │
│  │ 28 messages                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📅 2026-02-17  api-service  [refactor]              │    │
│  │ Extracted API client into separate module...         │    │
│  │ 15 messages                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Showing 3 of 12 conversations         [← Prev] [Next →]   │
└─────────────────────────────────────────────────────────────┘
```

#### Conversation Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to list                                             │
│                                                             │
│  Fix JWT Token Refresh                                      │
│  2026-02-18 · my-app · feature/auth · [auth] [security]    │
│  Note: Decided to use httpOnly cookies instead of           │
│        localStorage for JWT                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ User ──────────────────────────────────────────────┐    │
│  │ I'm getting a 401 error when the JWT token expires. │    │
│  │ Here's my middleware code...                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ Claude ────────────────────────────────────────────┐    │
│  │ The issue is in your token refresh middleware.       │    │
│  │ Here's what's happening:                             │    │
│  │                                                      │    │
│  │ ```javascript                          [📋 Copy]     │    │
│  │ const refreshToken = async () => {                   │    │
│  │   // fixed implementation...                         │    │
│  │ };                                                   │    │
│  │ ```                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Styling

- **Dark mode** (default): `#1a1a2e` background, `#e0e0e0` text — matches terminal aesthetic
- **Light mode** toggle: `#ffffff` background, `#333` text
- **Code blocks**: Monokai-inspired theme with syntax highlighting via a lightweight inline highlighter (~3KB)
- **Responsive**: CSS Grid layout, collapses to single column on narrow viewports
- **Typography**: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", ...`)

#### Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search bar |
| `j` / `k` | Navigate conversation list (down / up) |
| `Enter` | Open selected conversation |
| `Esc` | Go back to list / close modal |
| `c` | Copy current conversation to clipboard |
| `t` | Toggle dark/light mode |

### API Implementation

The API routes are thin wrappers around the existing storage layer:

```typescript
// src/viewer/api.ts
import { IndexManager } from '../storage/index-manager';
import { Vault } from '../storage/vault';

// GET /api/conversations?q=&tag=&project=&limit=&offset=
// → IndexManager.list() + IndexManager.search()

// GET /api/conversations/:id
// → Vault.readTranscript() + Vault.readMetadata()

// DELETE /api/conversations/:id
// → Vault.deleteEntry() + IndexManager.removeEntry()

// GET /api/tags
// → IndexManager.loadIndex() → aggregate tags

// GET /api/projects
// → IndexManager.loadIndex() → aggregate projects

// GET /api/stats
// → IndexManager.loadIndex() → compute stats
```

No new data logic — the viewer reuses the same storage layer as the MCP tools.

## Layer 4: Hooks (Automation)

### Hook 1: Auto-Save on SessionEnd

Fires when a session ends. Automatically saves the conversation if auto-save is enabled in config.

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

**auto-save.js logic:**
1. Read stdin for session metadata (session_id, transcript_path, cwd)
2. Check config.json for `auto_save: true`
3. If enabled, read the transcript JSONL
4. Convert to Markdown and save to vault
5. Exit 0

### Hook 2: Context Injection on SessionStart (v2)

Future feature: On session start, optionally inject a summary of recent saved conversations as context.

## Storage Layer

### File Format: Transcript (.md)

```markdown
# Session: Fix JWT Token Refresh

**Date:** 2026-02-19 12:00 UTC
**Project:** my-project
**Branch:** feature/auth
**Tags:** auth, bugfix

---

## User
I'm getting a 401 error when the JWT token expires...

## Claude
The issue is in your token refresh middleware. Here's what's happening...

## User
That fixed it! Can you also add retry logic?

## Claude
Sure, here's the updated middleware with exponential backoff...
```

### File Format: Metadata (.meta.json)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project": "my-project",
  "project_path": "/home/user/my-project",
  "session_id": "original-session-uuid",
  "created_at": "2026-02-19T12:00:00Z",
  "saved_at": "2026-02-19T12:30:00Z",
  "git_branch": "feature/auth",
  "git_commit": "abc1234",
  "tags": ["auth", "bugfix"],
  "note": "Fixed JWT token refresh issue",
  "summary": "Debugged 401 error on token expiry, added retry logic to refresh middleware",
  "message_count": 42,
  "source": "manual"
}
```

### Index File (index.json)

A flat array of all metadata entries for fast listing and filtering. Rebuilt from .meta.json files if corrupted.

```json
{
  "version": 1,
  "entries": [
    { "id": "...", "project": "...", "summary": "...", "tags": [...], "saved_at": "...", "message_count": 42 }
  ]
}
```

## Tech Stack

| Component | Technology |
|---|---|
| MCP Server | TypeScript + `@modelcontextprotocol/sdk` |
| Runtime | Node.js 20+ |
| Input validation | Zod |
| File I/O | Node.js `fs/promises` |
| UUID generation | `crypto.randomUUID()` |
| Date handling | Native `Date` / `Intl` |
| Build | `tsup` (zero-config bundler) |
| Web Server | Node.js native `http` module (zero dependencies) |
| Frontend | Vanilla HTML + CSS + JS (single embedded file, no framework) |
| Code Highlighting | Lightweight inline highlighter (~3KB, bundled) |
| Search | Simple substring + regex matching (no external search engine) |

Zero external runtime dependencies beyond MCP SDK and Zod. The web viewer uses only Node.js built-in modules.

## Security Considerations

- **Read-only access to Claude Code data** — The MCP server reads from `~/.claude/projects/` but never writes to it
- **Vault isolation** — All writes go to `~/.session-vault/`, a separate directory
- **No network calls** — Everything is local (viewer binds to 127.0.0.1 only)
- **No secrets in transcripts** — The save process strips tool_input fields that may contain env vars or secrets (configurable via `config.json` redaction rules)

## Plugin File Structure

```
session-vault/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── .mcp.json                    # MCP server config
├── skills/
│   ├── save/
│   │   └── SKILL.md             # /session-vault:save
│   ├── history/
│   │   └── SKILL.md             # /session-vault:history
│   ├── extract/
│   │   └── SKILL.md             # /session-vault:extract
│   ├── vault-clear/
│   │   └── SKILL.md             # /session-vault:vault-clear
│   └── export/
│       └── SKILL.md             # /session-vault:export
├── hooks/
│   └── hooks.json               # SessionEnd auto-save hook
├── src/
│   ├── server.ts                # MCP server entry point
│   ├── tools/
│   │   ├── save-conversation.ts
│   │   ├── list-conversations.ts
│   │   ├── search-conversations.ts
│   │   ├── get-conversation.ts
│   │   ├── delete-conversations.ts
│   │   ├── export-conversation.ts
│   │   └── start-viewer.ts       # Launch/stop browser viewer
│   ├── viewer/
│   │   ├── server.ts             # HTTP server (Node.js native http)
│   │   ├── api.ts                # REST API route handlers
│   │   └── app.html              # Embedded SPA (HTML + CSS + JS)
│   ├── storage/
│   │   ├── vault.ts              # Read/write vault files
│   │   ├── index-manager.ts      # index.json CRUD
│   │   └── transcript-parser.ts  # JSONL → Markdown converter
│   ├── hooks/
│   │   └── auto-save.ts          # SessionEnd hook script
│   └── utils/
│       ├── git.ts                # Git metadata helper
│       ├── config.ts             # Config reader
│       └── slug.ts               # Project path → slug converter
├── dist/                         # Compiled JS (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```
