---
name: viewer
description: Start or stop the session vault web viewer for browsing conversations in a browser.
argument-hint: "[start|stop] [--port PORT]"
disable-model-invocation: true
---

# Session Vault Viewer

Start or stop the web-based conversation viewer using the `start_viewer` MCP tool.

## Argument Parsing

Parse `$ARGUMENTS` for:
- **action** (`$0`, optional): `start` or `stop` — defaults to `start`
- **--port**: port number — defaults to `3777`

## Examples

- `/session-vault:viewer` — start viewer on default port 3777
- `/session-vault:viewer start` — explicitly start
- `/session-vault:viewer stop` — stop the running viewer
- `/session-vault:viewer start --port 8080` — start on custom port

## Steps

1. **Parse arguments** for action and port.

2. **Call `start_viewer`** with:
   - `action`: from `$0`, or `"start"` if not provided
   - `port`: from `--port` flag, or `3777` if not provided

3. **Report the result** to the user:
   - If started: show the URL (e.g. `http://localhost:3777`) and PID
   - If stopped: confirm the viewer has been stopped
   - If already running: inform the user and show the existing URL
