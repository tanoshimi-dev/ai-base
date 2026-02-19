# MCP Inspector — Debug & Test session-vault

`@modelcontextprotocol/inspector` is a web UI for interacting with MCP servers.
Use it to list tools, send requests, and inspect raw JSON-RPC messages.

## Install

```bash
npm install -g @modelcontextprotocol/inspector
```

Or use without installing via `npx` (shown below).

## Quick Start

From the `session-vault/` directory:

```bash
cd session-vault
npm run build
npx @modelcontextprotocol/inspector node dist/server.js
```

With environment variables:

```bash
npx @modelcontextprotocol/inspector -e VAULT_DIR=C:/Users/rehop/.session-vault node dist/server.js
```

## Open in Browser (Important)

The terminal output will print a URL **with a session token**:

```
⚙️ Proxy server listening on port 6277
🔑 Session token: abc123def456...
🔗 Open inspector: http://127.0.0.1:6274?token=abc123def456...
```

**You must use the full URL including `?token=...`.**
Opening `http://127.0.0.1:6274` without the token will fail with:

> Connection Error - Did you add the proxy session token in Configuration?

If you accidentally opened it without the token:
- Go back to the terminal and copy the full URL, or
- Expand **Configuration** in the web UI and paste the token there

## Web UI Fields (Manual Setup)

If connecting via the web UI form instead of CLI:

| Field            | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Transport Type   | `STDIO`                                                 |
| Command          | `node`                                                  |
| Arguments        | `E:/dev/vs_code/products/ai-base/code/claudecode/01/session-vault/dist/server.js` |

Expand **Environment Variables** to add `VAULT_DIR` if needed (default is `~/.session-vault`).

## Using the Inspector

Once connected, the right panel becomes active:

### Tools Tab

- Click **List Tools** to see all 7 registered tools
- Select a tool to view its input schema
- Fill in parameters and click **Run** to execute
- Example: run `list_conversations` with no arguments to see saved conversations

### Resources Tab

- Lists any resources the server exposes

### History Tab

- Shows raw JSON-RPC request/response pairs
- Most useful for debugging — see exactly what the server receives and returns

### Server Notifications

- Shows log messages and notifications emitted by the server

## Dev Workflow (Live Reload)

Run watch mode in one terminal:

```bash
npm run dev
```

Run the inspector in another terminal:

```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

After a code change:
1. `tsup` rebuilds `dist/server.js` automatically
2. In the Inspector, click **Disconnect** then **Connect** to restart the server

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Blank page after clicking Environment Variables | Known UI bug in v0.15.0. Kill inspector (Ctrl+C) and relaunch via CLI |
| "Connection Error - proxy session token" | Use the full URL with `?token=...` from terminal output |
| Server not found / ENOENT | Make sure `npm run build` succeeded and `dist/server.js` exists |
| Tools list empty | Check the server started without errors in the terminal |
| Port already in use | Kill old inspector process: `taskkill /F /IM node.exe` or find PID with `netstat -ano | findstr :6274` |
