---
name: save
description: Save the current conversation to the session vault with optional tags and notes.
argument-hint: "[tags] [--note \"description\"]"
disable-model-invocation: true
---

# Save Current Conversation

Save this conversation to the session vault using the `save_conversation` MCP tool.

## Argument Parsing

Parse `$ARGUMENTS` for:
- **Tags**: comma-separated list (e.g. `refactor,auth,bugfix`)
- **Note**: `--note "description of the conversation"` flag

Examples:
- `/session-vault:save` — save with no tags or note
- `/session-vault:save auth,login` — save with tags
- `/session-vault:save auth --note "Fixed OAuth token refresh"` — tags + note

## Steps

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

4. **Report the result** to the user, showing:
   - Vault ID (short form)
   - Project name
   - Tags applied
   - Message count
   - Saved timestamp
