#!/usr/bin/env python3
"""
Claude Code usage tracking tool.

Collects per-turn metrics (tokens, tools, duration) via Claude Code hooks
and stores them in SQLite for review and analysis.

Usage:
    claude_tracking.py install              # register hooks in ~/.claude/settings.json
    claude_tracking.py status               # show hook status and DB stats
    claude_tracking.py recent [N]           # show last N turns with full detail
    claude_tracking.py report [N]           # summary table of last N turns
    claude_tracking.py sessions [N]         # list last N sessions
    claude_tracking.py tools [N]            # tool usage stats
    claude_tracking.py clear --yes          # delete all tracked data
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import platform
import shutil
import sqlite3
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple


# ─────────────────────────────── helpers ──────────────────────────────────

def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be >= 1")
    return parsed


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def default_base_dir() -> Path:
    return Path.home() / ".claude-tracking"


def default_db_path() -> Path:
    return default_base_dir() / "claude-tracking.db"


def default_logs_dir() -> Path:
    return default_base_dir() / "logs"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def claude_settings_path() -> Path:
    return Path.home() / ".claude" / "settings.json"


# ─────────────────────────────── DB schema ────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    account TEXT,
    model TEXT,
    platform TEXT,
    cwd TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    turn_index INTEGER NOT NULL,
    started_at TEXT,
    ended_at TEXT,
    duration_ms REAL,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cache_read_tokens INTEGER,
    cache_write_tokens INTEGER,
    tool_calls INTEGER NOT NULL DEFAULT 0,
    tool_duration_ms REAL,
    prompt TEXT,
    response TEXT,
    raw_json TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, turn_index),
    FOREIGN KEY(session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_turns_session_started_at
    ON turns(session_id, started_at);

CREATE TABLE IF NOT EXISTS tool_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turn_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    ordinal INTEGER NOT NULL,
    tool_name TEXT NOT NULL,
    duration_ms REAL,
    input_json TEXT,
    output_json TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, turn_id, ordinal),
    FOREIGN KEY(turn_id) REFERENCES turns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_turn
    ON tool_calls(turn_id, ordinal);
"""


def connect_db(path: Path) -> sqlite3.Connection:
    ensure_parent(path)
    conn = sqlite3.connect(str(path))
    conn.execute("PRAGMA foreign_keys = ON")
    with conn:
        conn.executescript(SCHEMA)
    return conn


# ──────────────────────────── transcript parsing ──────────────────────────

def _sanitize(s: Optional[str]) -> Optional[str]:
    """Replace lone surrogates that SQLite's UTF-8 encoder rejects."""
    if s is None:
        return None
    return s.encode("utf-8", errors="replace").decode("utf-8")


def extract_text_from_content(content: Any) -> str:
    """Extract plain text from a Claude message content field."""
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ""
    parts: List[str] = []
    for block in content:
        if isinstance(block, str):
            stripped = block.strip()
            if stripped:
                parts.append(stripped)
        elif isinstance(block, dict):
            block_type = block.get("type", "")
            if block_type == "text":
                text = block.get("text", "")
                if isinstance(text, str) and text.strip():
                    parts.append(text.strip())
            # tool_use and tool_result blocks intentionally skipped
    return "\n".join(parts)


def is_tool_result_only(content: Any) -> bool:
    """Return True if content consists solely of tool_result blocks (no user text)."""
    if not isinstance(content, list) or not content:
        return False
    for block in content:
        if not isinstance(block, dict):
            return False
        if block.get("type") != "tool_result":
            return False
    return True


def unwrap_message(record: Dict[str, Any]) -> Dict[str, Any]:
    """Handle both bare message dicts and wrapped {"type": ..., "message": {...}} records."""
    if "role" in record:
        return record
    return record.get("message") or record


def read_transcript(transcript_path: str) -> List[Dict[str, Any]]:
    """Read Claude Code conversation transcript JSONL."""
    path = Path(transcript_path)
    if not path.exists():
        return []
    records: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, dict):
            records.append(obj)
    return records


def parse_transcript_turns(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Group transcript records into per-turn summaries.

    A "turn" is one human prompt followed by Claude's final response.
    Tool calls interspersed between them (tool_use in assistant messages,
    tool_result in user messages) are part of the same turn.

    Returns a list of dicts: prompt, response, model, token counts.
    """
    turns: List[Dict[str, Any]] = []
    i = 0
    while i < len(records):
        msg = unwrap_message(records[i])
        role = msg.get("role", "")

        if role != "user":
            i += 1
            continue

        content = msg.get("content", "")
        # Skip tool_result-only user messages — they belong to the previous turn
        if is_tool_result_only(content):
            i += 1
            continue

        prompt_text = extract_text_from_content(content)

        # Collect all following messages until the next real user message
        assistant_msgs: List[Dict[str, Any]] = []
        j = i + 1
        while j < len(records):
            next_msg = unwrap_message(records[j])
            next_role = next_msg.get("role", "")
            if next_role == "user":
                if not is_tool_result_only(next_msg.get("content", "")):
                    break  # next real user message → end of current turn
            elif next_role == "assistant":
                assistant_msgs.append(next_msg)
            j += 1

        if not assistant_msgs:
            i += 1
            continue

        last_asst = assistant_msgs[-1]
        response_text = extract_text_from_content(last_asst.get("content", ""))

        # Aggregate usage across all assistant messages in this turn
        total_input = 0
        total_output = 0
        total_cache_read = 0
        total_cache_write = 0
        model: Optional[str] = None
        for asst in assistant_msgs:
            usage = asst.get("usage") or {}
            total_input += int(usage.get("input_tokens") or 0)
            total_output += int(usage.get("output_tokens") or 0)
            total_cache_read += int(usage.get("cache_read_input_tokens") or 0)
            total_cache_write += int(usage.get("cache_creation_input_tokens") or 0)
            if not model:
                model = asst.get("model") or None

        turns.append({
            "prompt": prompt_text or None,
            "response": response_text or None,
            "model": model,
            "input_tokens": total_input or None,
            "output_tokens": total_output or None,
            "cache_read_tokens": total_cache_read or None,
            "cache_write_tokens": total_cache_write or None,
        })

        i = j

    return turns


# ───────────────────────── pending tool-event log ─────────────────────────

def _tools_log_path(logs_dir: Path, session_id: str) -> Path:
    return logs_dir / f"{session_id}.tools.jsonl"


def append_tool_event(logs_dir: Path, session_id: str, event: Dict[str, Any]) -> None:
    path = _tools_log_path(logs_dir, session_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, ensure_ascii=False) + "\n")


def read_pending_tool_events(logs_dir: Path, session_id: str) -> List[Dict[str, Any]]:
    path = _tools_log_path(logs_dir, session_id)
    if not path.exists():
        return []
    events: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


def clear_pending_tool_events(logs_dir: Path, session_id: str) -> None:
    path = _tools_log_path(logs_dir, session_id)
    if path.exists():
        path.unlink()


# ────────────────────────────── hook handlers ─────────────────────────────

def handle_hook_stop(
    payload: Dict[str, Any],
    db_path: Path,
    logs_dir: Path,
    capture_content: bool,
    account: Optional[str] = None,
) -> None:
    """Invoked by the Claude Code Stop hook. Writes one turn row to the DB."""
    session_id = payload.get("session_id", "")
    transcript_path = payload.get("transcript_path", "")
    # --account arg takes priority; fall back to payload fields if ever provided
    if not account:
        account = payload.get("account_uuid") or payload.get("account") or None
    if not session_id:
        return

    now = utc_now()
    cwd = os.getcwd()

    # Parse transcript to get all turns; we want turn N (1-based)
    records = read_transcript(transcript_path) if transcript_path else []
    transcript_turns = parse_transcript_turns(records)

    # Consume pending tool events accumulated since the last Stop
    tool_events = read_pending_tool_events(logs_dir, session_id)
    clear_pending_tool_events(logs_dir, session_id)

    # Compute timing from tool event timestamps when available
    ts_list = [e["timestamp"] for e in tool_events if e.get("timestamp")]
    started_at = min(ts_list) if ts_list else now
    ended_at = now
    duration_ms: Optional[float] = None
    if ts_list:
        try:
            start_dt = dt.datetime.fromisoformat(started_at)
            end_dt = dt.datetime.fromisoformat(ended_at)
            duration_ms = round((end_dt - start_dt).total_seconds() * 1000, 3)
        except (ValueError, TypeError):
            pass

    # Tool metrics
    tool_count = len(tool_events)
    tool_duration = round(
        sum(float(e.get("duration_ms") or 0) for e in tool_events), 3
    ) if tool_events else None

    conn = connect_db(db_path)
    try:
        existing_count: int = conn.execute(
            "SELECT COUNT(*) FROM turns WHERE session_id = ?",
            (session_id,),
        ).fetchone()[0]
        turn_index = existing_count + 1

        # Resolve turn data from transcript (turn_index is 1-based)
        turn_data: Dict[str, Any] = {}
        if 0 <= (turn_index - 1) < len(transcript_turns):
            turn_data = transcript_turns[turn_index - 1]
        elif transcript_turns:
            turn_data = transcript_turns[-1]

        model = turn_data.get("model")
        prompt = turn_data.get("prompt") if capture_content else None
        response = turn_data.get("response") if capture_content else None

        with conn:
            # Upsert session
            conn.execute(
                """
                INSERT INTO sessions (session_id, started_at, ended_at, account, model, platform, cwd, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    ended_at = excluded.ended_at,
                    account = COALESCE(sessions.account, excluded.account),
                    model = COALESCE(sessions.model, excluded.model)
                """,
                (session_id, started_at, ended_at, account, model, platform.platform(), cwd, now),
            )

            # Insert turn (ignore duplicate on re-fire)
            cursor = conn.execute(
                """
                INSERT OR IGNORE INTO turns (
                    session_id, turn_index, started_at, ended_at, duration_ms,
                    model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
                    tool_calls, tool_duration_ms, prompt, response, raw_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    turn_index,
                    started_at,
                    ended_at,
                    duration_ms,
                    model,
                    turn_data.get("input_tokens"),
                    turn_data.get("output_tokens"),
                    turn_data.get("cache_read_tokens"),
                    turn_data.get("cache_write_tokens"),
                    tool_count,
                    tool_duration,
                    _sanitize(prompt),
                    _sanitize(response),
                    _sanitize(json.dumps(payload, ensure_ascii=False)),
                    now,
                ),
            )
            turn_id = cursor.lastrowid if cursor.rowcount > 0 else None

            # Insert tool call rows
            if turn_id and tool_events:
                for ordinal, event in enumerate(tool_events, start=1):
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO tool_calls (
                            turn_id, session_id, ordinal, tool_name,
                            duration_ms, input_json, output_json, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            turn_id,
                            session_id,
                            ordinal,
                            event.get("tool_name", ""),
                            event.get("duration_ms"),
                            json.dumps(event["tool_input"], ensure_ascii=False)
                            if capture_content and event.get("tool_input") is not None
                            else None,
                            json.dumps(event["tool_response"], ensure_ascii=False)
                            if capture_content and event.get("tool_response") is not None
                            else None,
                            now,
                        ),
                    )
    finally:
        conn.close()


def handle_hook_post_tool_use(
    payload: Dict[str, Any],
    logs_dir: Path,
) -> None:
    """Invoked by the Claude Code PostToolUse hook. Appends a tool event."""
    session_id = payload.get("session_id", "")
    if not session_id:
        return
    event: Dict[str, Any] = {
        "tool_name": payload.get("tool_name", ""),
        "tool_input": payload.get("tool_input"),
        "tool_response": payload.get("tool_response"),
        "duration_ms": payload.get("duration_ms"),
        "timestamp": utc_now(),
    }
    append_tool_event(logs_dir, session_id, event)


# ───────────────────────────── install / uninstall ────────────────────────

_HOOK_MARKER = "claude_tracking"


def _load_settings(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")) or {}
    except (json.JSONDecodeError, OSError):
        return {}


def _save_settings(path: Path, settings: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(settings, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _is_tracking_hook(entry: Any) -> bool:
    """Return True if a hook entry was written by this tool."""
    if not isinstance(entry, dict):
        return False
    for hook in entry.get("hooks", []):
        if isinstance(hook, dict) and _HOOK_MARKER in hook.get("command", ""):
            return True
    return False


def _build_hook_entries(
    script_path: Path,
    db_path: Path,
    logs_dir: Path,
    capture_content: bool,
    account: Optional[str] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    python = shutil.which("python3") or shutil.which("python") or "python3"
    # On Windows, Claude Code runs hooks via bash which strips backslashes.
    # Convert all paths to forward slashes so bash can resolve them correctly.
    def to_fwd(p: str) -> str:
        return p.replace("\\", "/")

    script = to_fwd(str(script_path.resolve()))
    db = to_fwd(str(db_path.resolve()))
    logs = to_fwd(str(logs_dir.resolve()))
    python = to_fwd(python)
    content_flag = "" if capture_content else " --no-capture-content"
    account_flag = f' --account "{account}"' if account else ""

    base = f'{python} "{script}"'
    db_args = f'--db "{db}" --logs-dir "{logs}"'
    return {
        "PostToolUse": [
            {
                "matcher": "",
                "hooks": [
                    {"type": "command", "command": f"{base} hook {db_args} post_tool_use"},
                ],
            }
        ],
        "Stop": [
            {
                "hooks": [
                    {"type": "command", "command": f"{base} hook {db_args} stop{content_flag}{account_flag}"},
                ],
            }
        ],
    }


def run_install_command(args: argparse.Namespace) -> int:
    script_path = Path(__file__).resolve()
    db_path: Path = args.db.resolve()
    logs_dir: Path = args.logs_dir.resolve()
    capture_content: bool = args.capture_content
    account: Optional[str] = getattr(args, "account", None) or None
    settings_path = claude_settings_path()

    settings = _load_settings(settings_path)
    hooks = settings.setdefault("hooks", {})
    new_entries = _build_hook_entries(script_path, db_path, logs_dir, capture_content, account)

    changed = False
    for event_name, entries in new_entries.items():
        existing = hooks.get(event_name, [])
        filtered = [e for e in existing if not _is_tracking_hook(e)]
        hooks[event_name] = filtered + entries
        if hooks[event_name] != existing:
            changed = True

    if changed or getattr(args, "force", False):
        _save_settings(settings_path, settings)
        print(f"Installed claude-tracking hooks → {settings_path}")
        print(f"  DB:      {db_path}")
        print(f"  Logs:    {logs_dir}")
        print(f"  Account: {account or '(not set — re-run with --account EMAIL to populate)'}")
        print(f"  Content capture: {'on' if capture_content else 'off'}")
    else:
        print("Hooks already up to date (use --force to re-install).")
    return 0


def run_uninstall_command(_args: argparse.Namespace) -> int:
    settings_path = claude_settings_path()
    settings = _load_settings(settings_path)
    hooks = settings.get("hooks", {})

    changed = False
    for event_name in list(hooks.keys()):
        before = hooks[event_name]
        after = [e for e in before if not _is_tracking_hook(e)]
        if after != before:
            changed = True
        if after:
            hooks[event_name] = after
        else:
            del hooks[event_name]

    if not hooks:
        settings.pop("hooks", None)

    if changed:
        _save_settings(settings_path, settings)
        print(f"Removed claude-tracking hooks from {settings_path}")
    else:
        print("No claude-tracking hooks found in settings.")
    return 0


# ────────────────────────────────── status ────────────────────────────────

def run_status_command(args: argparse.Namespace) -> int:
    settings_path = claude_settings_path()
    settings = _load_settings(settings_path)
    hooks = settings.get("hooks", {})

    installed: List[str] = []
    for event_name, entries in hooks.items():
        for entry in entries:
            if _is_tracking_hook(entry):
                installed.append(event_name)

    if installed:
        print(f"Hooks: installed ({', '.join(sorted(set(installed)))})")
    else:
        print("Hooks: NOT installed  →  run: claude_tracking.py install")

    db_path: Path = args.db
    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        try:
            sessions = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
            turns_count = conn.execute("SELECT COUNT(*) FROM turns").fetchone()[0]
            tc = conn.execute("SELECT COUNT(*) FROM tool_calls").fetchone()[0]
        except sqlite3.OperationalError:
            sessions = turns_count = tc = 0
        finally:
            conn.close()
        print(f"DB: {db_path}")
        print(f"  sessions={sessions}  turns={turns_count}  tool_calls={tc}")
    else:
        print(f"DB: {db_path} (not yet created)")
    return 0


# ─────────────────────────────── reporting ────────────────────────────────

def _print_rows(headers: Sequence[str], rows: Sequence[Sequence[Any]]) -> None:
    widths = [len(h) for h in headers]
    prepared: List[List[str]] = []
    for row in rows:
        pr = ["" if v is None else str(v) for v in row]
        prepared.append(pr)
        for i, cell in enumerate(pr):
            widths[i] = min(max(widths[i], len(cell)), 80)

    fmt = "  ".join(f"{{:{w}}}" for w in widths)
    print(fmt.format(*headers))
    print(fmt.format(*["-" * w for w in widths]))
    for row in prepared:
        clipped = [
            cell if len(cell) <= widths[i] else cell[: widths[i] - 1] + "…"
            for i, cell in enumerate(row)
        ]
        print(fmt.format(*clipped))


def run_recent_command(args: argparse.Namespace) -> int:
    conn = connect_db(args.db)
    rows = conn.execute(
        """
        SELECT
            t.session_id,
            COALESCE(s.account, ''),
            t.ended_at,
            ROUND(t.duration_ms, 1),
            COALESCE(t.model, s.model, ''),
            t.turn_index,
            COALESCE(t.input_tokens, 0),
            COALESCE(t.output_tokens, 0),
            COALESCE(t.cache_read_tokens, 0),
            COALESCE(t.tool_calls, 0),
            t.prompt,
            t.response
        FROM turns t
        LEFT JOIN sessions s ON s.session_id = t.session_id
        ORDER BY t.ended_at DESC, t.id DESC
        LIMIT ?
        """,
        (args.limit,),
    ).fetchall()
    conn.close()

    if not rows:
        print("No tracked results found.")
        return 0

    for idx, row in enumerate(rows, start=1):
        (
            session_id, account, ended_at, duration_ms_val, model,
            turn_index, input_tokens, output_tokens, cache_read,
            tool_calls, prompt, response,
        ) = row
        print(
            f"[{idx}] {ended_at}  session={session_id}  "
            f"account={account or '-'}  model={model or '-'}  "
            f"ms={duration_ms_val or 0}  turn={turn_index}  "
            f"in={input_tokens}  out={output_tokens}  "
            f"cache_read={cache_read}  tools={tool_calls}"
        )
        print("prompt:")
        print(prompt or "-")
        print("response:")
        print(response or "-")
        if idx != len(rows):
            print()
    return 0


def _fetch_report_rows(db: Path, limit: int) -> List[Sequence[Any]]:
    conn = connect_db(db)
    rows = conn.execute(
        """
        SELECT
            t.session_id,
            COALESCE(s.account, ''),
            t.ended_at,
            ROUND(t.duration_ms, 1),
            COALESCE(t.model, s.model, ''),
            t.turn_index,
            COALESCE(t.input_tokens, 0),
            COALESCE(t.output_tokens, 0),
            COALESCE(t.cache_read_tokens, 0),
            COALESCE(t.tool_calls, 0),
            REPLACE(COALESCE(t.prompt, ''), CHAR(10), ' ')
        FROM turns t
        LEFT JOIN sessions s ON s.session_id = t.session_id
        ORDER BY t.ended_at DESC, t.id DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return rows


def run_report_command(args: argparse.Namespace) -> int:
    headers = ["session_id", "account", "ended_at", "ms", "model",
               "turn", "in_tok", "out_tok", "cache_read", "tools", "prompt"]

    if not getattr(args, "live", False):
        _print_rows(headers, _fetch_report_rows(args.db, args.limit))
        return 0

    interval = getattr(args, "interval", 5)
    try:
        while True:
            os.system("cls" if os.name == "nt" else "clear")
            print(f"[live] {dt.datetime.now().strftime('%H:%M:%S')}  "
                  f"refresh every {interval}s  (Ctrl+C to quit)\n")
            _print_rows(headers, _fetch_report_rows(args.db, args.limit))
            time.sleep(interval)
    except KeyboardInterrupt:
        pass
    return 0


def run_sessions_command(args: argparse.Namespace) -> int:
    conn = connect_db(args.db)
    rows = conn.execute(
        """
        SELECT
            s.session_id,
            COALESCE(s.account, ''),
            s.started_at,
            s.ended_at,
            COUNT(t.id) AS turns,
            COALESCE(s.model, ''),
            COALESCE(s.cwd, '')
        FROM sessions s
        LEFT JOIN turns t ON t.session_id = s.session_id
        GROUP BY s.session_id, s.account, s.started_at, s.ended_at, s.model, s.cwd
        ORDER BY s.started_at DESC
        LIMIT ?
        """,
        (args.limit,),
    ).fetchall()
    conn.close()
    _print_rows(
        ["session_id", "account", "started_at", "ended_at", "turns", "model", "cwd"],
        rows,
    )
    return 0


def run_tools_command(args: argparse.Namespace) -> int:
    conn = connect_db(args.db)
    rows = conn.execute(
        """
        SELECT
            tc.tool_name,
            COUNT(*) AS calls,
            ROUND(AVG(tc.duration_ms), 1) AS avg_ms,
            ROUND(SUM(tc.duration_ms), 1) AS total_ms
        FROM tool_calls tc
        GROUP BY tc.tool_name
        ORDER BY calls DESC
        LIMIT ?
        """,
        (args.limit,),
    ).fetchall()
    conn.close()
    _print_rows(["tool_name", "calls", "avg_ms", "total_ms"], rows)
    return 0


# ──────────────────────────────── clear ───────────────────────────────────

def run_clear_command(args: argparse.Namespace) -> int:
    if not args.yes:
        print("error: clear is destructive. Re-run with --yes.", file=sys.stderr)
        return 2

    db_path: Path = args.db
    logs_dir: Path = args.logs_dir
    sessions_count = turns_count = 0

    if db_path.exists():
        conn = sqlite3.connect(str(db_path))
        try:
            sessions_count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
            turns_count = conn.execute("SELECT COUNT(*) FROM turns").fetchone()[0]
        except sqlite3.OperationalError:
            pass
        finally:
            conn.close()
        db_path.unlink()
        for suffix in ("-wal", "-shm", "-journal"):
            sidecar = Path(f"{db_path}{suffix}")
            if sidecar.exists():
                sidecar.unlink()

    log_count = 0
    if logs_dir.exists() and logs_dir.is_dir():
        log_files = list(logs_dir.rglob("*.jsonl"))
        for f in log_files:
            f.unlink()
        log_count = len(log_files)
        for d in sorted(
            [p for p in logs_dir.rglob("*") if p.is_dir()],
            key=lambda p: len(p.parts),
            reverse=True,
        ):
            try:
                d.rmdir()
            except OSError:
                pass
        try:
            logs_dir.rmdir()
        except OSError:
            pass

    print(
        f"Deleted {sessions_count} sessions, {turns_count} turns, {log_count} JSONL files."
    )
    return 0


# ───────────────────────────── argument parser ────────────────────────────

def _add_db_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH",
                   help="SQLite database path.")
    p.add_argument("--logs-dir", type=Path, default=default_logs_dir(), metavar="PATH",
                   help="Directory for per-session tool-event JSONL files.")


def _add_capture_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--capture-content", action="store_true", default=True,
                   help="Store prompt/response/tool I/O text (default: on).")
    p.add_argument("--no-capture-content", action="store_false", dest="capture_content",
                   help="Omit prompt/response/tool I/O text from storage.")


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="claude_tracking.py",
        description="Track Claude Code usage: tokens, tools, and turn metrics.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # ── hook (internal, called by Claude Code hooks) ──
    hook_parser = subparsers.add_parser("hook", help="Hook event receiver (internal use).")
    _add_db_args(hook_parser)
    hook_sub = hook_parser.add_subparsers(dest="hook_event", required=True)

    stop_p = hook_sub.add_parser("stop")
    _add_capture_args(stop_p)
    stop_p.add_argument("--account", default=None, metavar="EMAIL",
                        help="Account identifier embedded by install (do not set manually).")

    hook_sub.add_parser("post_tool_use")

    # ── install / uninstall ──
    install_p = subparsers.add_parser("install", help="Register hooks in ~/.claude/settings.json.")
    _add_db_args(install_p)
    _add_capture_args(install_p)
    install_p.add_argument("--account", default=None, metavar="EMAIL",
                           help="Your account email. Embedded in the hook command so every turn is tagged.")
    install_p.add_argument("--force", action="store_true",
                           help="Re-write hooks even if already present.")

    uninstall_p = subparsers.add_parser("uninstall", help="Remove hooks from settings.json.")
    # no args needed

    # ── status ──
    status_p = subparsers.add_parser("status", help="Show hook status and DB stats.")
    status_p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH")

    # ── reporting ──
    recent_p = subparsers.add_parser("recent", help="Show latest turn details.")
    recent_p.add_argument("limit", nargs="?", type=positive_int, default=1,
                          help="Number of turns to display (default: 1).")
    recent_p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH")

    report_p = subparsers.add_parser("report", help="Summary table of recent turns.")
    report_p.add_argument("limit_arg", nargs="?", type=positive_int, default=None)
    report_p.add_argument("--limit", type=positive_int, default=20)
    report_p.add_argument("--live", action="store_true",
                          help="Auto-refresh the report until Ctrl+C.")
    report_p.add_argument("--interval", type=positive_int, default=5, metavar="SEC",
                          help="Refresh interval in seconds for --live (default: 5).")
    report_p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH")

    sessions_p = subparsers.add_parser("sessions", help="List recent sessions.")
    sessions_p.add_argument("limit_arg", nargs="?", type=positive_int, default=None)
    sessions_p.add_argument("--limit", type=positive_int, default=20)
    sessions_p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH")

    tools_p = subparsers.add_parser("tools", help="Tool usage statistics.")
    tools_p.add_argument("limit_arg", nargs="?", type=positive_int, default=None)
    tools_p.add_argument("--limit", type=positive_int, default=30)
    tools_p.add_argument("--db", type=Path, default=default_db_path(), metavar="PATH")

    # ── clear ──
    clear_p = subparsers.add_parser("clear", help="Delete all tracked data.")
    _add_db_args(clear_p)
    clear_p.add_argument("--yes", action="store_true",
                         help="Actually delete the data (safety gate).")

    args = parser.parse_args(list(argv) if argv is not None else sys.argv[1:])

    # Positional limit_arg → limit
    for cmd in ("report", "sessions", "tools"):
        if args.command == cmd and getattr(args, "limit_arg", None) is not None:
            args.limit = args.limit_arg

    return args


# ───────────────────────────────── main ───────────────────────────────────

def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)

    if args.command == "hook":
        try:
            payload: Dict[str, Any] = json.loads(sys.stdin.read())
        except (json.JSONDecodeError, OSError):
            return 1
        if args.hook_event == "stop":
            handle_hook_stop(
                payload, args.db, args.logs_dir, args.capture_content,
                account=getattr(args, "account", None) or None,
            )
        elif args.hook_event == "post_tool_use":
            handle_hook_post_tool_use(payload, args.logs_dir)
        return 0

    if args.command == "install":
        return run_install_command(args)
    if args.command == "uninstall":
        return run_uninstall_command(args)
    if args.command == "status":
        return run_status_command(args)
    if args.command == "recent":
        return run_recent_command(args)
    if args.command == "report":
        return run_report_command(args)
    if args.command == "sessions":
        return run_sessions_command(args)
    if args.command == "tools":
        return run_tools_command(args)
    if args.command == "clear":
        return run_clear_command(args)

    raise AssertionError(f"unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
