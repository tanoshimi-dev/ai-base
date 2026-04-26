#!/usr/bin/env bash
# claude-track — thin wrapper around claude_tracking.py
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/claude_tracking.py" "$@"
