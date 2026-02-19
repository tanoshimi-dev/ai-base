# session-vault — Build / Run / Test

All commands run from the `session-vault/` directory:

```bash
cd session-vault
```

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

Outputs compiled JS to `dist/`. Uses `tsup` (config in `tsup.config.ts`).

## Type Check

```bash
npm run typecheck
```

Runs `tsc --noEmit` — checks types without emitting files.

## Test

```bash
npm test            # single run
npm run test:watch  # watch mode (re-runs on file changes)
```

Uses `vitest`. Test files live under `tests/`.

## Format

```bash
npm run format        # auto-fix formatting
npm run format:check  # check only (CI)
```

## Dev (watch mode build)

```bash
npm run dev
```

Rebuilds on every source file change.

## Web Viewer

### Rebuild

```bash
npm run build
```

This compiles everything to `dist/` and copies `app.html` into `dist/viewer/`.

### Start Server

```bash
node dist/viewer/standalone.js        # default port 3777
node dist/viewer/standalone.js 4000   # custom port
```

### Stop Server

Press `Ctrl+C` in the terminal, or kill by PID:

```bash
# Linux/macOS — PID is stored in $VAULT_DIR/.viewer.pid
kill $(cat ~/.session-vault/.viewer.pid)
```

```powershell
# Windows — find PID by port, then kill
netstat -ano | findstr :3777
taskkill /PID <pid> /F

# Or one-liner in PowerShell
Get-NetTCPConnection -LocalPort 3777 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Open in Browser

```bash
# Windows
start http://localhost:3777

# macOS
open http://localhost:3777

# Linux
xdg-open http://localhost:3777
```

### Via Claude Code (intended usage)

The `start_viewer` MCP tool is called by Claude Code. It starts the server and auto-opens the browser.

## Verify Everything

```bash
npm run build && npm run typecheck && npm test
```
