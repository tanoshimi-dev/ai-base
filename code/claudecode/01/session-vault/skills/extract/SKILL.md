---
name: extract
description: Retrieve and display a saved conversation from the vault by ID, with optional section filtering.
argument-hint: "<id> [full|decisions|code|errors]"
---

# Extract Conversation

Retrieve a saved conversation using the `get_conversation` MCP tool.

## Argument Parsing

Parse `$ARGUMENTS` for:
- **id** (required, `$0`): conversation ID (full UUID or short prefix)
- **section** (optional, `$1`): one of `full`, `decisions`, `code`, `errors` — defaults to `full`

## Examples

- `/session-vault:extract abc12345` — full conversation
- `/session-vault:extract abc12345 decisions` — only decisions
- `/session-vault:extract abc12345 code` — only code blocks
- `/session-vault:extract abc12345 errors` — only errors

## Steps

1. **Validate arguments.** The `id` argument is required. If missing, ask the user to provide a conversation ID. Suggest running `/session-vault:history` to find one.

2. **Call `get_conversation`** with:
   - `id`: the conversation ID from `$0`
   - `section`: the section from `$1`, or `"full"` if not provided

3. **Display the result** with a metadata header:
   ```
   ## Conversation: <summary>
   - **ID:** <full id>
   - **Project:** <project>
   - **Saved:** <date>
   - **Tags:** <tags>
   - **Messages:** <count>
   ```
   Followed by the conversation content.
