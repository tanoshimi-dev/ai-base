# Session Vault

A Claude Code plugin for saving, reviewing, and managing conversation history.

Session Vault captures your Claude Code conversations and stores them locally so you can search, review, and export them later. Every session is parsed into clean Markdown and indexed for fast retrieval.

## Quick Start

```bash
# Clone and build
cd session-vault
npm install
npm run build

# Install as a Claude Code plugin
claude plugin add ./session-vault
```

Once installed, the plugin registers an MCP server and 6 slash commands automatically.

## Slash Commands

### `/session-vault:save [tags] [--note "desc"]`

Save the current conversation to the vault.

```
/session-vault:save                              # save with no tags
/session-vault:save auth,login                   # save with tags
/session-vault:save bugfix --note "Fixed #42"    # save with tags + note
/session-vault:save --enable-auto                # enable auto-save on session end
/session-vault:save --disable-auto               # disable auto-save
```

### `/session-vault:history [query] [--tag name] [--project name]`

List or search saved conversations.

```
/session-vault:history                           # list recent conversations
/session-vault:history auth                      # search for "auth"
/session-vault:history --tag bugfix              # filter by tag
/session-vault:history OAuth --project my-app    # search within a project
```

### `/session-vault:extract <id> [full|decisions|code|errors]`

Retrieve a saved conversation by ID.

```
/session-vault:extract abc12345                  # full transcript
/session-vault:extract abc12345 decisions        # only decisions
/session-vault:extract abc12345 code             # only code blocks
/session-vault:extract abc12345 errors           # only errors
```

Short IDs are supported (min 4 characters, must be unambiguous).

### `/session-vault:vault-clear [--older-than 30d] [--tag name] [--id uuid]`

Delete conversations from the vault. Always previews before deleting.

```
/session-vault:vault-clear --older-than 30d      # older than 30 days
/session-vault:vault-clear --tag temp            # by tag
/session-vault:vault-clear --id abc12345         # specific conversation
```

At least one filter is required. The command always shows a preview first and asks for confirmation.

### `/session-vault:export <id|all> [md|json|html] [output_dir]`

Export conversations to files.

```
/session-vault:export abc12345                   # export as markdown
/session-vault:export abc12345 json              # export as JSON
/session-vault:export all html ./exports         # export all as HTML
```

### `/session-vault:viewer [start|stop] [--port PORT]`

Start or stop the web viewer for browsing conversations in a browser.

```
/session-vault:viewer                            # start on port 3777
/session-vault:viewer start --port 8080          # custom port
/session-vault:viewer stop                       # stop the viewer
```

## MCP Tools

The plugin also exposes 7 MCP tools that Claude can use directly:

| Tool | Description |
|------|-------------|
| `save_conversation` | Save a conversation transcript to the vault |
| `list_conversations` | List saved conversations with optional filters |
| `search_conversations` | Full-text search across conversations |
| `get_conversation` | Retrieve a conversation by ID with section filtering |
| `delete_conversations` | Delete conversations (preview + confirm) |
| `export_conversation` | Export to Markdown, JSON, or HTML |
| `start_viewer` | Start/stop the web viewer |

## Auto-Save

Session Vault can automatically save conversations when sessions end.

Enable via slash command:
```
/session-vault:save --enable-auto
```

Or edit `~/.session-vault/config.json` directly:
```json
{
  "auto_save": true,
  "auto_save_min_messages": 5
}
```

Auto-saved conversations are tagged with `auto` and only saved when the message count meets the `auto_save_min_messages` threshold.

## Configuration

Config file: `~/.session-vault/config.json`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_save` | boolean | `false` | Auto-save conversations on session end |
| `auto_save_min_messages` | integer | `5` | Minimum messages before auto-save triggers |
| `max_transcript_size_mb` | number | `10` | Maximum transcript file size in MB |
| `viewer_port` | integer | `3777` | Default port for the web viewer |
| `default_export_format` | string | `"md"` | Default export format (`md`, `json`, `html`) |
| `redaction_rules` | array | `[]` | Regex patterns to redact from saved transcripts |

### Redaction Rules

Automatically scrub sensitive data from saved transcripts:

```json
{
  "redaction_rules": [
    { "pattern": "sk-[a-zA-Z0-9]+", "replacement": "[API_KEY]" },
    { "pattern": "password=[^ ]+", "replacement": "password=[REDACTED]" }
  ]
}
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VAULT_DIR` | Override the vault storage directory (default: `~/.session-vault`) |

## Storage Layout

```
~/.session-vault/
  config.json                          # Plugin configuration
  index.json                           # Master index of all conversations
  projects/
    <project-slug>/
      2026-02-19_a1b2c3d4.md           # Markdown transcript
      2026-02-19_a1b2c3d4.meta.json    # Metadata (tags, summary, git info)
```

The index is automatically rebuilt from `.meta.json` files if it becomes corrupted or is deleted.

## Web Viewer

The built-in web viewer provides a browser UI for browsing conversations:

```
/session-vault:viewer
```

Opens `http://localhost:3777` with:
- Conversation list with search and filtering
- Full transcript viewer
- Tag and project aggregation
- Stats dashboard

## Troubleshooting

### Transcript file not found

The save command locates transcripts in `~/.claude/projects/<slug>/<session-id>.jsonl`. If this fails:
- Ensure the session has at least one message
- Check that `~/.claude/projects/` exists
- Provide the transcript path manually when prompted

### Vault directory not writable

Check permissions on `~/.session-vault/`:
```bash
ls -la ~/.session-vault
chmod 755 ~/.session-vault
```

### Transcript too large

If a transcript exceeds the size limit:
```json
{ "max_transcript_size_mb": 50 }
```

Increase the limit in `~/.session-vault/config.json`. Files over 5 MB are automatically stream-parsed to reduce memory usage.

### Index seems out of date

The index auto-rebuilds when corruption is detected. To force a rebuild, delete the index file:
```bash
rm ~/.session-vault/index.json
```

The next operation will scan all `.meta.json` files and regenerate the index.

### Auto-save not working

1. Check that auto-save is enabled: `cat ~/.session-vault/config.json`
2. Ensure `auto_save` is `true` and `auto_save_min_messages` is not too high
3. The hook only fires on normal session end (not on crashes)

## Development

```bash
npm install          # install dependencies
npm run build        # build the plugin
npm run dev          # build with watch mode
npm test             # run tests
npm run test:watch   # run tests with watch mode
npm run typecheck    # type-check without emitting
npm run format       # format with prettier
```

## License

MIT
