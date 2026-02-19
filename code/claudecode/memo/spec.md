# Claude Code Session Vault — Specification

## Product Name

**session-vault** — A Claude Code plugin for saving, reviewing, and managing conversation history during development.

## Problem

Claude Code stores conversations locally as raw JSONL files under `~/.claude/projects/`. However:

1. **No structured review** — Developers cannot easily browse or search past conversations. JSONL files are not human-readable.
2. **Context loss across sessions** — When you `/clear` or start a new session, valuable decisions, code rationale, and debugging insights are effectively lost.
3. **No selective save** — There is no way to bookmark or tag important moments in a conversation.
4. **No export for sharing** — Sharing conversation insights with teammates requires manual copy-paste from raw files.
5. **No cleanup tool** — Old sessions accumulate with no easy way to archive or purge them selectively.

## Solution

A Claude Code plugin that provides:

- **Save** — Manually bookmark conversations with tags and notes, or auto-save on session end
- **Review** — Browse, search, and filter saved conversations in a structured format
- **Copy** — Extract key decisions, code snippets, and solutions as clean Markdown
- **Clear** — Selectively delete or bulk-purge archived conversations

## Target Users

- Solo developers who use Claude Code daily and want to recall past decisions
- Teams who want to share development conversation logs
- Developers working on long-running projects with many sessions

## Core Features

### F1: Save Conversation (`/save`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/save` or `/save [tag]` during or at end of session |
| Behavior | Captures the current conversation transcript, attaches metadata (timestamp, project, git branch, tags, user note) |
| Storage | Saves to `~/.session-vault/<project-slug>/` as structured Markdown + JSON metadata |
| Auto-save | Optional hook on `SessionEnd` to auto-save every session |
| Dedup | Skips save if conversation is identical to last saved version |

### F2: Review History (`/history`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/history`, `/history search <query>`, or `/history [tag]` |
| Behavior | Lists saved conversations with summary, date, tags, and project info |
| Search | Full-text search across conversation content and metadata |
| Filter | Filter by tag, date range, project, or git branch |
| Output | Displays a numbered list; user can select one to view full content |

### F3: Extract / Copy (`/extract`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/extract <id>` or `/extract <id> --section decisions` |
| Behavior | Extracts a saved conversation into clean Markdown sections: Summary, Decisions, Code Changes, Key Snippets |
| Sections | `decisions` — architectural decisions made; `code` — code blocks produced; `errors` — problems solved; `full` — complete transcript |
| Output | Writes extracted content to a file or displays inline |

### F4: Clear / Purge (`/vault-clear`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/vault-clear`, `/vault-clear --older-than 30d`, or `/vault-clear --tag temp` |
| Behavior | Deletes saved conversations matching the filter criteria |
| Safety | Always shows a confirmation prompt with count and list before deletion |
| Bulk | Supports `--all` flag with double-confirmation |

### F5: Export (`/export`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/export <id>` or `/export --all --format md` |
| Behavior | Exports saved conversations to Markdown, JSON, or HTML |
| Destination | Writes to current directory or specified path |
| Formats | `md` (default), `json`, `html` |

### F6: Browser Viewer (`/viewer`)

| Aspect | Detail |
|---|---|
| Trigger | User invokes `/viewer` or `/viewer --port 3777` |
| Behavior | Starts a local HTTP server and opens a web UI in the default browser |
| UI Features | Dashboard with conversation list, full-text search, tag filtering, date range picker, conversation detail view with syntax-highlighted code blocks, copy-to-clipboard |
| Tech | Single-file embedded HTML/CSS/JS served by a built-in Node.js HTTP server — zero frontend dependencies |
| API | REST endpoints for the web UI to fetch data from `~/.session-vault/` |
| Lifecycle | Server runs in background until user stops it (`/viewer --stop` or Ctrl+C in terminal) |
| Port | Default `3777`, configurable via `--port` or `config.json` |
| Security | Binds to `127.0.0.1` only (localhost), no external access |

#### Web UI Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Conversation list with search bar, tag chips, date filter, sort options |
| Conversation Detail | `/conversation/:id` | Full transcript with collapsible User/Claude turns, syntax-highlighted code blocks, copy buttons |
| Tags | `/tags` | Tag cloud / list with conversation counts, click to filter |
| Projects | `/projects` | Group conversations by project with stats |

#### REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List conversations (supports `?q=`, `?tag=`, `?project=`, `?from=`, `?to=`, `?limit=`, `?offset=`) |
| `GET` | `/api/conversations/:id` | Get full conversation transcript + metadata |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |
| `GET` | `/api/tags` | List all tags with counts |
| `GET` | `/api/projects` | List all projects with stats |
| `GET` | `/api/stats` | Overall vault statistics (total conversations, total size, etc.) |

#### UI Design Principles

- **Dark mode default** — Matches developer terminal aesthetic, with light mode toggle
- **Responsive** — Works on desktop and tablet
- **Fast** — Client-side search and filtering after initial data load
- **Minimal** — No framework (React, Vue, etc.) — plain HTML + vanilla JS + CSS
- **Markdown rendering** — Render conversation Markdown with proper formatting and code highlighting
- **Keyboard navigation** — `j/k` to navigate list, `Enter` to open, `Esc` to go back, `/` to focus search

## Non-Goals (v1)

- Real-time sync across machines (local-only storage)
- Cloud backup or remote storage
- Conversation diff / comparison between sessions
- AI-powered summarization of past sessions (future v2 feature)
- Integration with external knowledge bases (Notion, Obsidian, etc.)

## Data Model

### Saved Conversation Entry

```
{
  "id": "uuid-v4",
  "project": "my-project",
  "project_path": "/home/user/my-project",
  "session_id": "original-claude-session-uuid",
  "created_at": "2026-02-19T12:00:00Z",
  "saved_at": "2026-02-19T12:30:00Z",
  "git_branch": "feature/auth",
  "git_commit": "abc1234",
  "tags": ["auth", "bugfix"],
  "note": "Fixed JWT token refresh issue",
  "summary": "Auto-generated one-line summary",
  "message_count": 42,
  "source": "manual" | "auto",
  "transcript_file": "2026-02-19_abc123.md",
  "metadata_file": "2026-02-19_abc123.meta.json"
}
```

### Storage Structure

```
~/.session-vault/
  config.json                              # Global plugin configuration
  index.json                               # Master index of all saved conversations
  projects/
    my-project/
      2026-02-19_abc123.md                 # Readable Markdown transcript
      2026-02-19_abc123.meta.json          # Metadata (tags, notes, git info)
      2026-02-20_def456.md
      2026-02-20_def456.meta.json
    another-project/
      ...
```

## Success Metrics

| Metric | Target |
|---|---|
| Save latency | < 2 seconds for a 200-message conversation |
| Search speed | < 1 second for full-text search across 1000 saved conversations |
| Storage overhead | < 2x raw JSONL size (Markdown + metadata JSON) |
| User adoption | Developers save at least 1 conversation per day |
| Viewer startup | < 1 second to launch local HTTP server |
| Viewer page load | < 500ms for dashboard with 100 conversations |

## Constraints

- Must work offline (no network calls)
- Must not modify Claude Code's internal `~/.claude/` storage
- Must work on macOS, Linux, and Windows
- Must not require any external dependencies beyond Node.js
- Must not interfere with Claude Code's normal operation
