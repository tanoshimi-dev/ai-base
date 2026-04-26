"""
End-to-end sample test for the Stop hook.
Fires a fake Stop payload directly into handle_hook_stop, then queries the DB
to confirm session.account is recorded correctly.
"""
import json
import sqlite3
import tempfile
import pathlib
import sys
import os

# Run from repo root or sys.path
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import claude_tracking as ct

# ── config ────────────────────────────────────────────────────────────────
ACCOUNT   = "keijimitaki@gmail.com"
SESSION   = "test-session-001"
DB_PATH   = pathlib.Path(tempfile.mkdtemp()) / "test.db"
LOGS_DIR  = DB_PATH.parent / "logs"

# ── fake Stop payload (mirrors what Claude Code sends) ────────────────────
PAYLOAD = {
    "session_id": SESSION,
    "transcript_path": "",          # empty → no transcript parsing
    "hook_event_name": "Stop",
}

# ── fire the hook ─────────────────────────────────────────────────────────
print("Firing Stop hook...")
ct.handle_hook_stop(
    payload=PAYLOAD,
    db_path=DB_PATH,
    logs_dir=LOGS_DIR,
    capture_content=False,
    account=ACCOUNT,
)
print(f"  DB: {DB_PATH}")

# ── query results ─────────────────────────────────────────────────────────
conn = sqlite3.connect(str(DB_PATH))
session_row = conn.execute(
    "SELECT session_id, account, model, platform FROM sessions WHERE session_id = ?",
    (SESSION,),
).fetchone()
turn_row = conn.execute(
    "SELECT turn_index, input_tokens, output_tokens, tool_calls FROM turns WHERE session_id = ?",
    (SESSION,),
).fetchone()
conn.close()

# ── report ────────────────────────────────────────────────────────────────
print()
print("=== sessions row ===")
if session_row:
    sid, account, model, platform = session_row
    print(f"  session_id : {sid}")
    print(f"  account    : {account!r}   <-- should be '{ACCOUNT}'")
    print(f"  model      : {model!r}")
    print(f"  platform   : {platform!r}")
else:
    print("  ERROR: no session row found")

print()
print("=== turns row ===")
if turn_row:
    idx, inp, out, tools = turn_row
    print(f"  turn_index   : {idx}")
    print(f"  input_tokens : {inp!r}")
    print(f"  output_tokens: {out!r}")
    print(f"  tool_calls   : {tools}")
else:
    print("  ERROR: no turn row found")

# ── pass/fail ─────────────────────────────────────────────────────────────
print()
if session_row and session_row[1] == ACCOUNT:
    print("PASS: account is recorded correctly")
else:
    print("FAIL: account is still null or wrong")
    sys.exit(1)
