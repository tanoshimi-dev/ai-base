---
name: save
description: Save the current conversation to the session vault with optional tags and notes. Also manages auto-save config.
argument-hint: "[tags] [--note \"desc\"] [--save-path dir] [--enable-auto] [--disable-auto]"
disable-model-invocation: true
---

# Save Current Conversation

Save this conversation to the session vault using the `save_conversation` MCP tool.

## Argument Parsing

Parse `$ARGUMENTS` for:
- **Tags**: comma-separated list (e.g. `refactor,auth,bugfix`)
- **Note**: `--note "description of the conversation"` flag
- **Save path**: `--save-path "/path/to/dir"` flag — custom directory to save the transcript to
- **--enable-auto**: enable auto-save on session end (config-only, no save)
- **--disable-auto**: disable auto-save on session end (config-only, no save)

## Examples

- `/session-vault:save` — save with no tags or note
- `/session-vault:save auth,login` — save with tags
- `/session-vault:save auth --note "Fixed OAuth token refresh"` — tags + note
- `/session-vault:save --save-path D:/backups/vault` — save to a custom directory
- `/session-vault:save --enable-auto` — enable auto-save (does not save current session)
- `/session-vault:save --disable-auto` — disable auto-save

## Steps

### Config-only mode (`--enable-auto` / `--disable-auto`)

If `$ARGUMENTS` contains `--enable-auto` or `--disable-auto`:

1. Read the current vault config from `~/.session-vault/config.json` (create with defaults if missing).
2. Set `auto_save` to `true` or `false` accordingly.
3. Write the updated config back.
4. Confirm the change to the user: "Auto-save has been **enabled/disabled**. Conversations will/will not be saved automatically when sessions end."
5. **Do not proceed to save the conversation.** Return immediately.

### Normal save mode

1. **Locate the transcript file.** Run a `find` command to locate the current session transcript:
   ```
   find ~/.claude/projects -name "${CLAUDE_SESSION_ID}.jsonl" -type f 2>/dev/null
   ```
   If not found, tell the user the transcript could not be located and ask them to provide the path.

2. **Determine the project path.** Use the current working directory as the `project_path`.

3. **Call `save_conversation`** with these parameters:
   - `transcript_path`: the path found in step 1
   - `project_path`: current working directory
   - `session_id`: `${CLAUDE_SESSION_ID}`
   - `tags`: parsed from arguments (array of strings), omit if none provided
   - `note`: parsed from `--note` flag, omit if not provided
   - `save_path`: parsed from `--save-path` flag, omit if not provided

4. **Report the result** to the user, showing:
   - Vault ID (short form)
   - Project name
   - Tags applied
   - Message count
   - Saved timestamp

## Error Handling

- If the transcript file cannot be found, suggest the user check that `~/.claude/projects/` exists and that the session has messages.
- If the vault directory is not writable, tell the user to check permissions on `~/.session-vault/`.
- If the transcript exceeds the size limit, inform the user of the current `max_transcript_size_mb` setting and how to increase it.
