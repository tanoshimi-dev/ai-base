---
name: export
description: Export saved conversations to markdown, JSON, or HTML files.
argument-hint: "<id|all> [md|json|html] [output_dir]"
disable-model-invocation: true
---

# Export Conversations

Export saved conversations to files using the `export_conversation` MCP tool.

## Argument Parsing

Positional arguments from `$ARGUMENTS`:
- **id** (`$0`, required): conversation ID or `all` to export everything
- **format** (`$1`, optional): `md`, `json`, or `html` — defaults to `md`
- **output_dir** (`$2`, optional): output directory — defaults to current working directory

## Examples

- `/session-vault:export abc12345` — export as markdown to current directory
- `/session-vault:export abc12345 json` — export as JSON
- `/session-vault:export abc12345 html ./exports` — export as HTML to ./exports
- `/session-vault:export all json ./backup` — export all conversations as JSON

## Steps

1. **Validate arguments.** The `id` argument is required. If missing, ask the user to provide a conversation ID or `all`. Suggest running `/session-vault:history` to find an ID.

2. **Call `export_conversation`** with:
   - `id`: from `$0`
   - `format`: from `$1`, or `"md"` if not provided
   - `output_dir`: from `$2`, omit if not provided (tool defaults to cwd)

3. **Report the result** to the user:
   - Number of conversations exported
   - File paths of exported files
   - Format used
