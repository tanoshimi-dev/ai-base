# Claude Tracking Tool — Development Plan

## Overview

`claude-tracking` is a CLI usage tracking tool for Claude Code, modeled after `copilot_tracking`.
It captures per-turn metrics (tokens, tools, duration, prompts/responses) via Claude Code's
hooks system and stores them in SQLite for later querying and reporting.

---

## Key Design Decision: Hooks vs. Wrapping

`copilot_tracking` works by wrapping the CLI and enabling OTel file export via environment variables.
Claude Code does not expose OTel telemetry, but it has a native **hooks system** that fires scripts
at well-defined lifecycle points. This is the primary collection mechanism.

| Concern           | copilot_tracking          | claude_tracking              |
|-------------------|---------------------------|------------------------------|
| Data source       | OTel JSONL (file export)  | Claude Code hooks (stdin JSON)|
| Wrap mechanism    | `wrap` subcommand         | Hooks registered in settings.json |
| Token counts      | OTel LLM spans            | `stop` hook payload (`usage`) |
| Tool usage        | OTel tool spans           | `post_tool_use` hook payload  |
| Session boundary  | One CLI invocation        | One `claude` session (session_id) |
| Account           | `gh api user` fallback    | `--account EMAIL` at install time (embedded in hook command) |

---

## Available Hook Events

Claude Code fires these hooks with JSON payloads on stdin:

| Hook              | When fired                          | Key payload fields                        |
|-------------------|-------------------------------------|-------------------------------------------|
| `PreToolUse`      | Before each tool call               | `session_id`, `tool_name`, `tool_input`   |
| `PostToolUse`     | After each tool call                | `+ tool_response`, duration               |
| `Notification`    | On user-visible notification        | `session_id`, `message`                   |
| `Stop`            | When Claude finishes a turn         | `session_id`, `usage` (tokens), `model`   |
| `SubagentStop`    | When a subagent finishes            | same as Stop                              |

The `Stop` hook is the primary source for per-turn summaries. `PostToolUse` provides tool metrics.

---

## Database Schema

### `sessions` table

| Column         | Type    | Description                              |
|----------------|---------|------------------------------------------|
| `session_id`   | TEXT PK | Claude Code session ID (from hook payload)|
| `started_at`   | TEXT    | First event timestamp (ISO 8601)         |
| `ended_at`     | TEXT    | Last event timestamp                     |
| `account`      | TEXT    | Resolved user/account name               |
| `model`        | TEXT    | Model name used in session               |
| `platform`     | TEXT    | OS platform                              |
| `cwd`          | TEXT    | Working directory at session start       |
| `turns`        | INTEGER | Total turn count                         |

### `turns` table

| Column                | Type    | Description                              |
|-----------------------|---------|------------------------------------------|
| `id`                  | INTEGER PK AUTOINCREMENT |                          |
| `session_id`          | TEXT FK | References `sessions.session_id`         |
| `turn_index`          | INTEGER | 1-based turn number within session       |
| `started_at`          | TEXT    | Turn start timestamp                     |
| `ended_at`            | TEXT    | Turn end timestamp (Stop hook fires)     |
| `duration_ms`         | REAL    | Wall time from first PreToolUse to Stop  |
| `model`               | TEXT    | Model for this turn                      |
| `input_tokens`        | INTEGER | From Stop hook usage.input_tokens        |
| `output_tokens`       | INTEGER | From Stop hook usage.output_tokens       |
| `cache_read_tokens`   | INTEGER | Cache read tokens (if available)         |
| `cache_write_tokens`  | INTEGER | Cache write tokens (if available)        |
| `tool_calls`          | INTEGER | Count of PostToolUse events in turn      |
| `tool_duration_ms`    | REAL    | Summed tool execution time               |
| `prompt`              | TEXT    | User message text (if capture enabled)   |
| `response`            | TEXT    | Assistant response text (if capture enabled)|
| `raw_json`            | TEXT    | Full Stop hook payload JSON              |
| UNIQUE constraint     |         | `(session_id, turn_index)`               |

### `tool_calls` table

| Column          | Type    | Description                              |
|-----------------|---------|------------------------------------------|
| `id`            | INTEGER PK AUTOINCREMENT |                          |
| `turn_id`       | INTEGER FK | References `turns.id`                 |
| `session_id`    | TEXT    | Denormalized for fast queries            |
| `ordinal`       | INTEGER | 1-based order within turn                |
| `tool_name`     | TEXT    | e.g. `Bash`, `Read`, `Edit`              |
| `duration_ms`   | REAL    | From PostToolUse timing                  |
| `input_json`    | TEXT    | Tool input (if capture enabled)          |
| `output_json`   | TEXT    | Tool output (if capture enabled)         |
| UNIQUE          |         | `(session_id, turn_id, ordinal)`         |

---

## CLI Commands

Invoked as: `claude-track <command> [options]`

### Data commands

| Command             | Description                                          |
|---------------------|------------------------------------------------------|
| `install`           | Register hooks in Claude Code settings.json          |
| `uninstall`         | Remove hooks from settings.json                      |
| `ingest <file>`     | Manually import a saved hook event JSONL             |

### Reporting commands

| Command             | Description                                          |
|---------------------|------------------------------------------------------|
| `recent [N]`        | Show last N turns with full detail (default: 1)      |
| `report [N]`        | Summary table of last N turns (default: 20)          |
| `sessions [N]`      | List last N sessions with metadata (default: 10)     |
| `tools [N]`         | Top tool usage stats across last N turns             |

### Maintenance commands

| Command             | Description                                          |
|---------------------|------------------------------------------------------|
| `clear --yes`       | Delete all tracked data                              |
| `status`            | Show hook installation status and DB stats           |

### Global options

| Option                  | Default                              |
|-------------------------|--------------------------------------|
| `--db PATH`             | `~/.claude-tracking/claude-tracking.db` |
| `--logs-dir PATH`       | `~/.claude-tracking/logs/`           |
| `--no-capture-content`  | Omit prompt/response/tool I/O text   |

### `install`-only options

| Option              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `--account EMAIL`   | Embeds the email into the Stop hook command so every session row is tagged. Claude Code hook payloads do not include account info, so this is the only reliable way to populate `sessions.account`. |
| `--force`           | Re-write hooks even if already present. Required when changing `--account`. |

---

## Hook Installation (`install` command)

The `install` command adds hook entries to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "python /path/to/claude_tracking.py hook --db ... --logs-dir ... post_tool_use" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "python /path/to/claude_tracking.py hook --db ... --logs-dir ... stop --account you@example.com" }
        ]
      }
    ]
  }
}
```

> **Why `--account` is in the command string, not the payload:**  
> Claude Code's Stop hook payload contains `session_id` and `transcript_path` but no user identity.  
> The account email is embedded by `install --account EMAIL` once and replayed on every hook fire.

The hook script reads JSON from stdin and appends the event to a per-session JSONL file,
then calls the ingestion logic to upsert into SQLite.

---

## File Structure

```
claude_tracking/
├── DEVPLAN.md                          # This file
├── README.md                           # Usage guide (to be written)
├── sys/
│   ├── claude_tracking.py              # Core Python implementation (main entry point)
│   ├── claude-track.sh                 # Bash wrapper: claude-track <cmd>
│   └── claude-track.ps1                # PowerShell wrapper
└── doc/
    └── database_schema.md              # Schema reference
```

---

## Implementation Phases

### Phase 1 — Hook Receiver & Storage (MVP)
- [x] Hook handler: reads stdin JSON, appends to per-session JSONL
- [x] Ingest: parses JSONL, upserts sessions/turns/tool_calls into SQLite
- [x] `install` / `uninstall` commands
- [x] `status` command

### Phase 2 — Reporting
- [x] `recent [N]` — detailed turn view
- [x] `report [N]` — summary table
- [x] `sessions [N]` — session list
- [x] `tools [N]` — tool usage stats

### Phase 3 — Polish
- [x] `--no-capture-content` flag
- [x] Account resolution — `--account EMAIL` flag at install time (payload has no account info)
- [x] Shell wrappers (bash + PowerShell)
- [x] README documentation

---

## Differences from copilot_tracking

1. **No wrapping needed** — hooks are registered declaratively; no `wrap` subcommand required
2. **Real-time ingestion** — each hook fires immediately; no post-session ingest step
3. **Richer tool data** — `PostToolUse` captures tool name, input, output, and duration natively
4. **Cache tokens** — Claude API exposes cache read/write token counts; tracked separately
5. **No OTel dependency** — hooks deliver structured JSON directly; no JSONL normalization layer
6. **Prompt/response capture** — currently not available from hook payloads (Stop hook does not
   include message text); this may change or require a different approach (e.g. transcript parsing)

---

## Resolved Questions

1. **Prompt/response text** — Stop payload does NOT include message text. Resolved by parsing the
   transcript JSONL at `transcript_path` (included in the payload). User turns and assistant turns
   are grouped into logical turns; tool-result-only user messages are skipped.

2. **turn_index** — Not provided by the payload. Derived as `COUNT(*) + 1` from existing rows for
   that `session_id` at the time the Stop hook fires.

3. **session_id stability** — Confirmed stable: same value across all PostToolUse and Stop events
   within one `claude` session.

4. **Cache token field names** — Confirmed: `cache_read_input_tokens` and
   `cache_creation_input_tokens` in the assistant message `usage` object inside the transcript.

5. **Account** — Stop hook payload contains no user identity. Resolved by embedding `--account EMAIL`
   in the hook command at install time via `install --account EMAIL --force`.
