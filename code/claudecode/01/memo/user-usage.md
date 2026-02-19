# Claude Code Session Vault — User Usage Guide

## Installation

```bash
# Install the plugin
claude plugin install session-vault

# Or load locally during development
claude --plugin-dir ./session-vault
```

After installation, the following slash commands become available:

| Command | Short Description |
|---|---|
| `/session-vault:save` | Save the current conversation |
| `/session-vault:history` | Browse saved conversations |
| `/session-vault:extract` | Extract content from a saved conversation |
| `/session-vault:vault-clear` | Delete saved conversations |
| `/session-vault:export` | Export conversations to files |
| `/session-vault:viewer` | Open conversation viewer in browser |

## Usage Scenarios

### Scenario 1: Save a conversation after a debugging session

You just spent 30 minutes debugging a tricky async issue with Claude. You want to save this for future reference.

```
You: /session-vault:save async-bug
```

Claude responds:

```
Saved conversation to vault.
  ID:      a1b2c3d4
  Tags:    async-bug
  Summary: Debugged race condition in useEffect cleanup, fixed with AbortController
  Path:    ~/.session-vault/projects/my-app/2026-02-19_a1b2c3d4.md
```

### Scenario 2: Save with a custom note

```
You: /session-vault:save auth,security --note "Important: decided to use httpOnly cookies instead of localStorage for JWT"
```

### Scenario 3: Browse conversation history

```
You: /session-vault:history
```

Claude responds:

```
Saved conversations (showing 5 most recent):

  #  ID        Date        Tags           Summary
  1  a1b2c3d4  2026-02-19  async-bug      Debugged race condition in useEffect cleanup
  2  e5f6g7h8  2026-02-18  auth,security  Switched JWT storage to httpOnly cookies
  3  i9j0k1l2  2026-02-17  refactor       Extracted API client into separate module
  4  m3n4o5p6  2026-02-15  setup          Initial project scaffolding with Vite + React
  5  q7r8s9t0  2026-02-14  ci             Set up GitHub Actions for PR checks

  Total: 12 saved conversations
  Use `/session-vault:history search <query>` to search.
```

### Scenario 4: Search for a specific past conversation

```
You: /session-vault:history search JWT token refresh
```

Claude responds:

```
Found 2 conversations matching "JWT token refresh":

  #  ID        Date        Score  Summary
  1  e5f6g7h8  2026-02-18  0.95   Switched JWT storage to httpOnly cookies
  2  u1v2w3x4  2026-02-10  0.62   Initial auth implementation with JWT

  Use `/session-vault:extract <id>` to view full content.
```

### Scenario 5: Filter by tag

```
You: /session-vault:history auth
```

Shows only conversations tagged with `auth`.

### Scenario 6: Extract decisions from a past conversation

```
You: /session-vault:extract e5f6g7h8 --section decisions
```

Claude responds:

```
Decisions from conversation e5f6g7h8 (2026-02-18):

  1. Use httpOnly cookies instead of localStorage for JWT storage
     Reason: Prevents XSS attacks from accessing tokens

  2. Set refresh token rotation with 7-day expiry
     Reason: Balance between security and user convenience

  3. Add CSRF token to all state-changing requests
     Reason: httpOnly cookies are vulnerable to CSRF
```

### Scenario 7: Extract code snippets

```
You: /session-vault:extract e5f6g7h8 --section code
```

Claude responds with all code blocks from that conversation.

### Scenario 8: View full conversation

```
You: /session-vault:extract e5f6g7h8
```

Displays the complete Markdown transcript.

### Scenario 9: Export for sharing with teammates

```
You: /session-vault:export e5f6g7h8
```

Claude responds:

```
Exported conversation to:
  ./session-vault-export/2026-02-18_auth-security.md
```

### Scenario 10: Export all conversations as JSON

```
You: /session-vault:export all --format json --output ./docs/sessions/
```

### Scenario 11: Clear old conversations

```
You: /session-vault:vault-clear --older-than 90d
```

Claude responds:

```
Found 3 conversations older than 90 days:

  1  z1a2b3c4  2025-11-01  setup    Initial environment setup
  2  d5e6f7g8  2025-10-28  debug    Fixed build error on CI
  3  h9i0j1k2  2025-10-15  scratch  Quick prototype test

Delete these 3 conversations? (This cannot be undone)
```

### Scenario 12: Clear by tag

```
You: /session-vault:vault-clear --tag scratch
```

### Scenario 13: Auto-save (hands-free)

Enable auto-save so every session is captured automatically:

```
You: /session-vault:save --enable-auto
```

Claude responds:

```
Auto-save enabled. All future sessions will be saved automatically when they end.
  Tag: auto
  Disable with: /session-vault:save --disable-auto
```

Now every time you end a session (exit Claude Code or `/clear`), the conversation is saved to the vault with the `auto` tag.

### Scenario 14: Open the browser viewer

```
You: /session-vault:viewer
```

Claude responds:

```
Session Vault viewer started.
  URL:  http://localhost:3777
  PID:  12345

Opened in your default browser.
Stop with: /session-vault:viewer --stop
```

Your browser opens to a dashboard showing all saved conversations. You can:
- Search across all conversations in the search bar
- Filter by tag chips or project dropdown
- Click any conversation to read the full transcript
- Copy code blocks with one click
- Toggle dark/light mode
- Navigate with keyboard shortcuts (`j/k` to move, `Enter` to open, `/` to search)

### Scenario 15: Open viewer on a custom port

```
You: /session-vault:viewer --port 8080
```

Useful if port 3777 is already in use.

### Scenario 16: Stop the viewer

```
You: /session-vault:viewer --stop
```

Claude responds:

```
Session Vault viewer stopped.
```

### Scenario 17: Use viewer alongside Claude Code

A typical workflow:

1. Work with Claude Code on a feature
2. `/session-vault:save feature,auth` to save the conversation
3. `/session-vault:viewer` to open the browser
4. In the browser, search through past conversations to recall a decision from last week
5. Copy a code snippet from a past conversation
6. Paste it back into your editor
7. Continue working with Claude Code

The viewer runs in the background — you can keep it open while using Claude Code.

## Configuration

The plugin stores its config at `~/.session-vault/config.json`:

```json
{
  "auto_save": false,
  "auto_save_tags": ["auto"],
  "auto_save_min_messages": 5,
  "default_export_format": "md",
  "redact_env_vars": true,
  "redact_patterns": [
    "(?i)(api[_-]?key|secret|token|password)\\s*[:=]\\s*\\S+"
  ],
  "max_transcript_size_mb": 10,
  "viewer_port": 3777
}
```

| Option | Default | Description |
|---|---|---|
| `auto_save` | `false` | Auto-save conversations on session end |
| `auto_save_tags` | `["auto"]` | Tags applied to auto-saved conversations |
| `auto_save_min_messages` | `5` | Minimum messages to trigger auto-save (skip trivial sessions) |
| `default_export_format` | `"md"` | Default export format |
| `redact_env_vars` | `true` | Strip environment variables from saved transcripts |
| `redact_patterns` | (see above) | Regex patterns for redacting secrets |
| `max_transcript_size_mb` | `10` | Skip saving conversations larger than this |
| `viewer_port` | `3777` | Default port for the browser viewer |

## Tips

- **Tag conventions**: Use consistent tags like `bugfix`, `feature`, `refactor`, `decision`, `setup` for easy filtering later
- **Notes are searchable**: The `--note` text is included in search, so be descriptive
- **Git branch is auto-captured**: You can find conversations by branch even without explicit tags
- **Combine with `claude --resume`**: Use `/history` to find a session ID, then `claude --resume <session-id>` to pick up where you left off in the original Claude Code session
