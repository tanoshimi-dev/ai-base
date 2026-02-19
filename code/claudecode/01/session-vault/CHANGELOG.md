# Changelog

## 0.2.0

### Features

- **Custom save path**: Specify a custom directory when saving conversations via the `save_path` parameter
- **Per-project save paths**: Configure default save directories per project in `project_save_paths` config
- Auto-save hook respects `project_save_paths` configuration

## 0.1.0

Initial release.

### Features

- **Storage layer**: Local vault at `~/.session-vault/` with Markdown transcripts and JSON metadata
- **7 MCP tools**: save, list, search, get, delete, export, start-viewer
- **6 slash commands**: `/session-vault:save`, `history`, `extract`, `vault-clear`, `export`, `viewer`
- **Web viewer**: Built-in browser UI for browsing conversations (single-file SPA served from Node.js)
- **Auto-save hook**: Automatically save conversations on session end via `SessionEnd` hook
- **Section extraction**: Extract decisions, code blocks, or errors from saved conversations
- **Full-text search**: Search across conversation content, summaries, tags, and notes
- **Export formats**: Markdown, JSON, and HTML export with batch support (`all`)
- **Redaction rules**: Regex-based automatic scrubbing of sensitive data (API keys, passwords)
- **Index auto-recovery**: Automatic rebuild from `.meta.json` files on corruption
- **Streaming parser**: Large transcripts (>5 MB) parsed line-by-line to avoid memory issues
- **Short ID support**: Use ID prefixes (min 4 chars) for convenience
- **Cross-platform**: Windows, macOS, and Linux path handling
