---
name: vault-clear
description: Delete conversations from the vault with safety preview. Requires at least one filter argument.
argument-hint: "[--older-than 30d] [--tag name] [--id uuid]"
disable-model-invocation: true
---

# Vault Clear

Delete conversations from the vault using the `delete_conversations` MCP tool.

**SAFETY: This is a destructive operation. Always preview before deleting. Never bulk-delete without a filter.**

## Argument Parsing

Parse `$ARGUMENTS` for:
- **--older-than**: age threshold (e.g. `30d`, `6m`, `1y`)
- **--tag**: delete conversations with this tag
- **--id**: delete a specific conversation by UUID

At least one filter argument is required. If none are provided, tell the user they must specify at least one filter and show usage examples. **Never call delete_conversations without at least one filter.**

## Examples

- `/session-vault:vault-clear --older-than 30d` — delete conversations older than 30 days
- `/session-vault:vault-clear --tag temp` — delete conversations tagged "temp"
- `/session-vault:vault-clear --id abc12345` — delete a specific conversation
- `/session-vault:vault-clear --older-than 90d --tag experiment` — combine filters

## Steps

1. **Validate arguments.** Refuse to proceed if no filter arguments are provided.

2. **Preview first.** Call `delete_conversations` with `confirm: false` and the parsed filters:
   - `older_than`: from `--older-than` flag
   - `tag`: from `--tag` flag
   - `ids`: array containing the `--id` value if provided

3. **Show the preview** to the user:
   - Number of conversations that would be deleted
   - List each one with: short ID, project, summary, date, tags
   - Clearly state: "These conversations will be permanently deleted."

4. **Ask for explicit confirmation.** Wait for the user to confirm before proceeding. Do not auto-confirm.

5. **If confirmed**, call `delete_conversations` again with the same filters and `confirm: true`.

6. **Report the result**: number of conversations deleted and their IDs.
