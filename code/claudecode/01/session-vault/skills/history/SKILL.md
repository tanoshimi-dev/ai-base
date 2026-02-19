---
name: history
description: List or search saved conversations in the session vault. Supports text search, tag filtering, and project filtering.
argument-hint: "[query] [--tag name] [--project name]"
---

# Conversation History

Browse and search saved conversations using `list_conversations` or `search_conversations` MCP tools.

## Argument Parsing

Parse `$ARGUMENTS` for:
- **Query**: free-text search terms (any argument not prefixed with `--`)
- **--tag**: filter by tag name
- **--project**: filter by project name

## Routing

- **No query text** → use `list_conversations`
- **Query text present** → use `search_conversations`

Both tools accept `tag` and `project` as optional filters.

## Examples

- `/session-vault:history` — list recent conversations
- `/session-vault:history auth` — search for "auth"
- `/session-vault:history --tag bugfix` — list conversations tagged "bugfix"
- `/session-vault:history OAuth refresh --project my-app` — search within a project

## Steps

1. **Parse arguments** into query, tag, and project components.

2. **Call the appropriate tool:**
   - No query → `list_conversations` with optional `tag`, `project`, `limit: 20`
   - With query → `search_conversations` with `query`, optional `tag`, `project`

3. **Format results as a readable table** with columns:
   - **ID** (first 8 characters)
   - **Date** (human-readable)
   - **Project**
   - **Summary** (truncated to ~60 chars)
   - **Tags**

4. **Show total count** and mention if more results are available beyond the displayed page.
