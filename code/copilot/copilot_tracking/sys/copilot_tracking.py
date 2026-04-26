#!/usr/bin/env python3
"""
Copilot CLI tracking helper.

This tool launches Copilot CLI with OpenTelemetry file export enabled, then ingests
the emitted JSONL into SQLite so each prompt/turn can be reviewed later.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import platform
import shutil
import sqlite3
import subprocess
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple


def positive_int(value: str) -> int:
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("value must be >= 1")
    return parsed


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def default_base_dir() -> Path:
    home = Path.home()
    if os.name == "nt":
        return home / ".copilot-tracking"
    return home / ".copilot-tracking"


def default_db_path() -> Path:
    return default_base_dir() / "copilot-tracking.db"


def default_logs_dir() -> Path:
    return default_base_dir() / "logs"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def detect_active_github_login() -> Optional[str]:
    executable = shutil.which("gh")
    if not executable:
        return None

    try:
        completed = subprocess.run(
            [executable, "api", "user", "--jq", ".login"],
            capture_output=True,
            text=True,
            check=False,
        )
    except OSError:
        return None

    if completed.returncode != 0:
        return None

    login = completed.stdout.strip()
    return login or None


def configure_wrap_parser(wrap: argparse.ArgumentParser) -> None:
    wrap.add_argument("--db", type=Path, default=default_db_path(), help="SQLite output path.")
    wrap.add_argument(
        "--logs-dir",
        type=Path,
        default=default_logs_dir(),
        help="Directory for raw OTel JSONL files.",
    )
    wrap.add_argument(
        "--keep-otel-file",
        action="store_true",
        help="Keep the per-session JSONL file after ingesting it.",
    )
    wrap.add_argument(
        "--capture-content",
        action="store_true",
        default=True,
        help="Capture prompt/response content in OTel output (default: on).",
    )
    wrap.add_argument(
        "--no-capture-content",
        action="store_false",
        dest="capture_content",
        help="Do not capture prompt/response content.",
    )


def build_wrap_parser(*, add_help: bool) -> argparse.ArgumentParser:
    wrap = argparse.ArgumentParser(
        prog="copilot_tracking.py wrap",
        description="Launch Copilot CLI with tracking enabled.",
        add_help=add_help,
    )
    configure_wrap_parser(wrap)
    if not add_help:
        wrap.add_argument(
            "--wrapper-help",
            action="help",
            help="Show tracking wrapper help instead of forwarding --help to copilot.",
        )
    return wrap


def split_wrap_args(argv: Sequence[str]) -> Tuple[List[str], List[str]]:
    wrap_flags = {"--keep-otel-file", "--capture-content", "--no-capture-content", "--wrapper-help"}
    wrap_value_options = {"--db", "--logs-dir"}
    wrap_args: List[str] = []
    index = 0

    while index < len(argv):
        token = argv[index]
        if token == "--":
            return wrap_args, list(argv[index + 1 :])
        if token in wrap_flags:
            wrap_args.append(token)
            index += 1
            continue
        if token in wrap_value_options:
            wrap_args.append(token)
            index += 1
            if index < len(argv):
                wrap_args.append(argv[index])
                index += 1
            continue
        break

    return wrap_args, list(argv[index:])


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    argv = list(argv) if argv is not None else sys.argv[1:]
    if argv and argv[0] == "wrap":
        wrap_args, copilot_args = split_wrap_args(argv[1:])
        namespace = build_wrap_parser(add_help=False).parse_args(wrap_args)
        namespace.command = "wrap"
        namespace.copilot_args = copilot_args
        return namespace

    parser = argparse.ArgumentParser(
        description="Track Copilot CLI prompt durations, tokens, and tool usage via OTel JSONL."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    wrap = subparsers.add_parser("wrap", help="Launch Copilot CLI with tracking enabled.")
    configure_wrap_parser(wrap)

    ingest = subparsers.add_parser("ingest", help="Ingest an existing OTel JSONL file.")
    ingest.add_argument("--db", type=Path, default=default_db_path(), help="SQLite output path.")
    ingest.add_argument("--otel-file", type=Path, required=True, help="OTel JSONL file path.")
    ingest.add_argument("--session-id", required=True, help="Session identifier for the import.")
    ingest.add_argument("--command-line", default="copilot", help="Recorded command line.")
    ingest.add_argument("--exit-code", type=int, default=0, help="Recorded process exit code.")

    report = subparsers.add_parser("report", help="Show recent tracked prompts.")
    report.add_argument("--db", type=Path, default=default_db_path(), help="SQLite DB path.")
    report.add_argument(
        "--live",
        action="store_true",
        help="Read from the latest raw OTel JSONL file instead of the SQLite DB.",
    )
    report.add_argument(
        "--logs-dir",
        type=Path,
        default=default_logs_dir(),
        help="Directory for raw OTel JSONL files when using --live.",
    )
    report.add_argument(
        "--otel-file",
        type=Path,
        default=None,
        help="Read a specific raw OTel JSONL file when using --live.",
    )
    report.add_argument("--limit", type=positive_int, default=20, help="Rows to display.")
    report.add_argument(
        "limit_arg",
        nargs="?",
        type=positive_int,
        default=None,
        help="Number of rows to display.",
    )
    report.add_argument(
        "--session-id", default=None, help="Filter to one tracked session identifier."
    )

    recent = subparsers.add_parser("recent", help="Show the latest tracked result(s).")
    recent.add_argument("--db", type=Path, default=default_db_path(), help="SQLite DB path.")
    recent.add_argument(
        "--live",
        action="store_true",
        help="Read from the latest raw OTel JSONL file instead of the SQLite DB.",
    )
    recent.add_argument(
        "--logs-dir",
        type=Path,
        default=default_logs_dir(),
        help="Directory for raw OTel JSONL files when using --live.",
    )
    recent.add_argument(
        "--otel-file",
        type=Path,
        default=None,
        help="Read a specific raw OTel JSONL file when using --live.",
    )
    recent.add_argument(
        "limit",
        nargs="?",
        type=positive_int,
        default=1,
        help="Number of recent results to display.",
    )
    recent.add_argument(
        "--session-id", default=None, help="Filter to one tracked session identifier."
    )

    sessions = subparsers.add_parser("sessions", help="Show tracked sessions.")
    sessions.add_argument("--db", type=Path, default=default_db_path(), help="SQLite DB path.")
    sessions.add_argument("--limit", type=positive_int, default=20, help="Rows to display.")

    clear = subparsers.add_parser("clear", help="Delete all tracked data.")
    clear.add_argument("--db", type=Path, default=default_db_path(), help="SQLite DB path.")
    clear.add_argument(
        "--logs-dir",
        type=Path,
        default=default_logs_dir(),
        help="Directory for raw OTel JSONL files.",
    )
    clear.add_argument(
        "--yes",
        action="store_true",
        help="Actually delete the tracking DB and remaining JSONL files.",
    )

    args = parser.parse_args(argv)
    if getattr(args, "command", None) == "report" and getattr(args, "limit_arg", None) is not None:
        args.limit = args.limit_arg
    return args


def adapt_attribute_value(value: Any) -> Any:
    if not isinstance(value, dict):
        return value

    scalar_keys = (
        "stringValue",
        "intValue",
        "doubleValue",
        "boolValue",
        "bytesValue",
    )
    for key in scalar_keys:
        if key in value:
            return value[key]
    if "arrayValue" in value:
        values = value["arrayValue"].get("values", [])
        return [adapt_attribute_value(item) for item in values]
    if "kvlistValue" in value:
        values = value["kvlistValue"].get("values", [])
        return {
            item.get("key"): adapt_attribute_value(item.get("value"))
            for item in values
            if isinstance(item, dict) and "key" in item
        }
    return value


def attributes_to_dict(raw_attrs: Any) -> Dict[str, Any]:
    if raw_attrs is None:
        return {}
    if isinstance(raw_attrs, dict):
        return {
            key: adapt_attribute_value(value)
            for key, value in raw_attrs.items()
        }
    if isinstance(raw_attrs, list):
        result: Dict[str, Any] = {}
        for item in raw_attrs:
            if isinstance(item, dict) and "key" in item:
                result[item["key"]] = adapt_attribute_value(item.get("value"))
        return result
    return {}


def otlp_time_to_unix_nano(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None
    if isinstance(value, (list, tuple)) and len(value) == 2:
        try:
            return int(value[0]) * 1_000_000_000 + int(value[1])
        except (TypeError, ValueError):
            return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def span_events_to_dicts(events: Any) -> List[Dict[str, Any]]:
    if not isinstance(events, list):
        return []
    normalized: List[Dict[str, Any]] = []
    for event in events:
        if not isinstance(event, dict):
            continue
        normalized.append(
            {
                "name": event.get("name"),
                "timeUnixNano": otlp_time_to_unix_nano(
                    event.get("timeUnixNano") or event.get("time")
                ),
                "attributes": attributes_to_dict(event.get("attributes")),
            }
        )
    return normalized


def iso_from_unix_nano(value: Any) -> Optional[str]:
    unix_nano = otlp_time_to_unix_nano(value)
    if unix_nano is None:
        return None
    timestamp = unix_nano / 1_000_000_000
    return dt.datetime.fromtimestamp(timestamp, tz=dt.timezone.utc).isoformat()


def duration_ms(start_nano: Any, end_nano: Any) -> Optional[float]:
    start_value = otlp_time_to_unix_nano(start_nano)
    end_value = otlp_time_to_unix_nano(end_nano)
    if start_value is None or end_value is None:
        return None
    try:
        return round((end_value - start_value) / 1_000_000, 3)
    except (TypeError, ValueError):
        return None


def normalize_span(span: Dict[str, Any], resource_attrs: Dict[str, Any], scope_name: str) -> Dict[str, Any]:
    start_time_raw = span.get("startTimeUnixNano")
    if start_time_raw in (None, ""):
        start_time_raw = span.get("startTime")
    end_time_raw = span.get("endTimeUnixNano")
    if end_time_raw in (None, ""):
        end_time_raw = span.get("endTime")
    return {
        "trace_id": span.get("traceId"),
        "span_id": span.get("spanId"),
        "parent_span_id": span.get("parentSpanId"),
        "name": span.get("name"),
        "kind": span.get("kind"),
        "start_time": iso_from_unix_nano(start_time_raw),
        "end_time": iso_from_unix_nano(end_time_raw),
        "duration_ms": duration_ms(start_time_raw, end_time_raw),
        "attributes": attributes_to_dict(span.get("attributes")),
        "events": span_events_to_dicts(span.get("events")),
        "resource_attributes": resource_attrs,
        "scope_name": scope_name,
        "raw": span,
    }


def extract_spans_from_record(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    spans: List[Dict[str, Any]] = []
    if record.get("type") == "span":
        resource = record.get("resource") or {}
        scope_info = record.get("scope") or record.get("instrumentationScope") or {}
        return [
            normalize_span(
                record,
                attributes_to_dict(resource.get("attributes")),
                scope_info.get("name", ""),
            )
        ]

    resource_spans = record.get("resourceSpans")
    if not isinstance(resource_spans, list):
        return spans

    for resource_span in resource_spans:
        if not isinstance(resource_span, dict):
            continue
        resource_attrs = attributes_to_dict(
            (resource_span.get("resource") or {}).get("attributes")
        )
        scope_spans = resource_span.get("scopeSpans") or resource_span.get("instrumentationLibrarySpans") or []
        for scope_span in scope_spans:
            if not isinstance(scope_span, dict):
                continue
            scope_info = scope_span.get("scope") or scope_span.get("instrumentationLibrary") or {}
            scope_name = scope_info.get("name", "")
            for span in scope_span.get("spans", []):
                if isinstance(span, dict):
                    spans.append(normalize_span(span, resource_attrs, scope_name))
    return spans


def walk_json(value: Any) -> Iterable[Any]:
    yield value
    if isinstance(value, dict):
        for nested in value.values():
            yield from walk_json(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from walk_json(nested)


def extract_string_candidates(value: Any) -> List[str]:
    strings: List[str] = []
    for item in walk_json(value):
        if isinstance(item, str):
            stripped = item.strip()
            if stripped:
                strings.append(stripped)
    return strings


def serialize_compact(value: Any) -> Optional[str]:
    if value in (None, "", [], {}):
        return None
    if isinstance(value, str):
        return value.strip() or None
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def first_non_empty(values: Iterable[Optional[str]]) -> Optional[str]:
    for value in values:
        if value:
            return value
    return None


def parse_jsonish(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if not stripped or stripped[0] not in "[{":
        return value
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return value


def extract_message_texts(message: Any) -> List[str]:
    if isinstance(message, str):
        stripped = message.strip()
        return [stripped] if stripped else []
    if not isinstance(message, dict):
        return []

    texts: List[str] = []
    content = message.get("content")
    if isinstance(content, str):
        stripped = content.strip()
        if stripped:
            texts.append(stripped)
    elif isinstance(content, list):
        for item in content:
            texts.extend(extract_message_texts(item))

    for part in message.get("parts", []):
        if not isinstance(part, dict):
            continue
        part_type = part.get("type")
        part_content = part.get("content")
        if part_type in (None, "text") and isinstance(part_content, str):
            stripped = part_content.strip()
            if stripped:
                texts.append(stripped)
        elif isinstance(part_content, list):
            for item in part_content:
                texts.extend(extract_message_texts(item))

    text_value = message.get("text")
    if isinstance(text_value, str):
        stripped = text_value.strip()
        if stripped:
            texts.append(stripped)

    return texts


def extract_user_messages(value: Any) -> List[str]:
    return extract_role_messages(value, "user")


def extract_role_messages(value: Any, role: str) -> List[str]:
    parsed = parse_jsonish(value)
    if isinstance(parsed, list):
        messages: List[str] = []
        for item in parsed:
            messages.extend(extract_role_messages(item, role))
        return messages
    if isinstance(parsed, dict):
        if parsed.get("role") == role:
            return extract_message_texts(parsed)
        messages: List[str] = []
        for nested in parsed.values():
            messages.extend(extract_role_messages(nested, role))
        return messages
    return []


def dedupe_preserve_order(values: Iterable[str]) -> List[str]:
    seen: set[str] = set()
    ordered: List[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def collect_prompt_candidates(attributes: Dict[str, Any], events: List[Dict[str, Any]]) -> List[str]:
    keys = (
        "gen_ai.input.messages",
        "gen_ai.user.message",
        "input",
        "prompt",
        "request.prompt",
        "messages",
    )
    candidates: List[str] = []
    for key in keys:
        if key in attributes:
            value = serialize_compact(attributes[key])
            if value:
                candidates.append(value)

    for event in events:
        event_attrs = event.get("attributes", {})
        for key in keys:
            if key in event_attrs:
                value = serialize_compact(event_attrs[key])
                if value:
                    candidates.append(value)

    if not candidates:
        flattened = []
        for key, value in attributes.items():
            lowered = key.lower()
            if "prompt" in lowered or ("input" in lowered and "token" not in lowered):
                flattened.extend(extract_string_candidates(value))
        if flattened:
            candidates.append("\n".join(flattened[:20]))

    return candidates


def collect_user_instruction_candidates(
    attributes: Dict[str, Any],
    events: List[Dict[str, Any]],
) -> List[str]:
    keys = (
        "gen_ai.input.messages",
        "gen_ai.user.message",
        "input",
        "prompt",
        "request.prompt",
        "messages",
    )
    candidates: List[str] = []
    for key in keys:
        if key in attributes:
            candidates.extend(extract_user_messages(attributes[key]))

    for event in events:
        event_attrs = event.get("attributes", {})
        for key in keys:
            if key in event_attrs:
                candidates.extend(extract_user_messages(event_attrs[key]))

    return dedupe_preserve_order(candidates)


def collect_response_candidates(attributes: Dict[str, Any], events: List[Dict[str, Any]]) -> List[str]:
    keys = (
        "gen_ai.output.messages",
        "gen_ai.assistant.message",
        "output",
        "response",
        "response.text",
    )
    candidates: List[str] = []
    for key in keys:
        if key in attributes:
            value = serialize_compact(attributes[key])
            if value:
                candidates.append(value)

    for event in events:
        event_attrs = event.get("attributes", {})
        for key in keys:
            if key in event_attrs:
                value = serialize_compact(event_attrs[key])
                if value:
                    candidates.append(value)

    return candidates


def number_from_value(value: Any) -> Optional[int]:
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value))
        except ValueError:
            return None
    return None


def best_number(attributes: Dict[str, Any], *keys: str) -> Optional[int]:
    for key in keys:
        if key in attributes:
            value = number_from_value(attributes[key])
            if value is not None:
                return value
    return None


def best_float(attributes: Dict[str, Any], *keys: str) -> Optional[float]:
    for key in keys:
        if key in attributes:
            value = attributes[key]
            try:
                return float(value)
            except (TypeError, ValueError):
                continue
    return None


def choose_model(attributes: Dict[str, Any]) -> Optional[str]:
    for key in (
        "gen_ai.request.model",
        "gen_ai.response.model",
        "llm.model_name",
        "model",
    ):
        if key in attributes:
            value = serialize_compact(attributes[key])
            if value:
                return value
    return None


def collect_account_candidates(
    attributes: Dict[str, Any],
    events: List[Dict[str, Any]],
    *,
    resource_attributes: Optional[Dict[str, Any]] = None,
) -> List[str]:
    keys = (
        "github.copilot.user.login",
        "github.user.login",
        "github.login",
        "gen_ai.user.id",
        "enduser.id",
        "user.id",
        "account.name",
        "account",
    )
    candidates: List[str] = []
    for source in (attributes, resource_attributes or {}):
        for key in keys:
            if key in source:
                value = serialize_compact(source[key])
                if value:
                    candidates.append(value)

    for event in events:
        event_attrs = event.get("attributes", {})
        for key in keys:
            if key in event_attrs:
                value = serialize_compact(event_attrs[key])
                if value:
                    candidates.append(value)

    return dedupe_preserve_order(candidates)


def build_descendants(spans: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    children: Dict[str, List[Dict[str, Any]]] = {}
    for span in spans:
        parent = span.get("parent_span_id") or ""
        children.setdefault(parent, []).append(span)
    return children


def descendants_for(root: Dict[str, Any], children_map: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    stack = list(children_map.get(root.get("span_id") or "", []))
    while stack:
        span = stack.pop()
        result.append(span)
        stack.extend(children_map.get(span.get("span_id") or "", []))
    return result


def infer_turns(spans: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_trace: Dict[str, List[Dict[str, Any]]] = {}
    for span in spans:
        trace_id = span.get("trace_id")
        if trace_id:
            by_trace.setdefault(trace_id, []).append(span)

    turns: List[Dict[str, Any]] = []
    for trace_spans in by_trace.values():
        children_map = build_descendants(trace_spans)
        roots = [span for span in trace_spans if span.get("name") == "invoke_agent"]
        if not roots:
            roots = [span for span in trace_spans if not span.get("parent_span_id")]

        for root in sorted(roots, key=lambda item: item.get("start_time") or ""):
            descendants = descendants_for(root, children_map)
            all_spans = [root, *descendants]
            chat_spans = [span for span in all_spans if str(span.get("name", "")).startswith("chat")]
            tool_spans = [span for span in all_spans if str(span.get("name", "")).startswith("execute_tool")]

            prompt = first_non_empty(
                collect_prompt_candidates(root["attributes"], root["events"])
                + [
                    first_non_empty(
                        collect_prompt_candidates(span["attributes"], span["events"])
                    )
                    for span in chat_spans
                ]
            )
            instructions = dedupe_preserve_order(
                collect_user_instruction_candidates(root["attributes"], root["events"])
                + [
                    instruction
                    for span in chat_spans
                    for instruction in collect_user_instruction_candidates(
                        span["attributes"],
                        span["events"],
                    )
                ]
            )
            response = first_non_empty(
                collect_response_candidates(root["attributes"], root["events"])
                + [
                    first_non_empty(
                        collect_response_candidates(span["attributes"], span["events"])
                    )
                    for span in chat_spans
                ]
            )

            input_tokens = None
            output_tokens = None
            total_tokens = None
            context_input_tokens = None
            context_window_pct = None
            model = choose_model(root["attributes"])
            account = first_non_empty(
                collect_account_candidates(
                    root["attributes"],
                    root["events"],
                    resource_attributes=root["resource_attributes"],
                )
                + [
                    first_non_empty(
                        collect_account_candidates(
                            span["attributes"],
                            span["events"],
                            resource_attributes=span["resource_attributes"],
                        )
                    )
                    for span in chat_spans
                ]
            )

            for span in chat_spans:
                attrs = span["attributes"]
                model = model or choose_model(attrs)
                input_tokens = input_tokens or best_number(
                    attrs,
                    "gen_ai.usage.input_tokens",
                    "gen_ai.usage.prompt_tokens",
                    "llm.token_count.prompt",
                )
                output_tokens = output_tokens or best_number(
                    attrs,
                    "gen_ai.usage.output_tokens",
                    "gen_ai.usage.completion_tokens",
                    "llm.token_count.completion",
                )
                total_tokens = total_tokens or best_number(
                    attrs,
                    "gen_ai.usage.total_tokens",
                    "llm.token_count.total",
                )
                context_input_tokens = context_input_tokens or best_number(
                    attrs,
                    "gen_ai.usage.input_tokens",
                    "gen_ai.usage.prompt_tokens",
                    "gen_ai.request.max_input_tokens",
                )
                context_window_pct = context_window_pct or best_float(
                    attrs,
                    "github.copilot.context.window.usage",
                    "context.window.usage",
                )

            tool_duration = round(
                sum(span.get("duration_ms") or 0 for span in tool_spans), 3
            )

            turns.append(
                {
                    "trace_id": root.get("trace_id"),
                    "span_id": root.get("span_id"),
                    "started_at": root.get("start_time"),
                    "ended_at": root.get("end_time"),
                    "duration_ms": root.get("duration_ms"),
                    "prompt": prompt,
                    "instructions": instructions,
                    "response": response,
                    "model": model,
                    "account": account,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                    "context_input_tokens": context_input_tokens,
                    "context_window_pct": context_window_pct,
                    "llm_calls": len(chat_spans),
                    "tool_calls": len(tool_spans),
                    "tool_duration_ms": tool_duration,
                    "raw_json": json.dumps(all_spans, ensure_ascii=False),
                }
            )

    turns.sort(key=lambda item: item.get("started_at") or "")
    return turns


def fill_missing_turn_accounts(turns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    fallback_account = first_non_empty(turn.get("account") for turn in turns)
    if not fallback_account:
        fallback_account = detect_active_github_login()
    if not fallback_account:
        return turns

    for turn in turns:
        if not turn.get("account"):
            turn["account"] = fallback_account
    return turns


SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    command_line TEXT NOT NULL,
    otel_file TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    exit_code INTEGER,
    platform TEXT,
    account TEXT,
    capture_content INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    trace_id TEXT,
    root_span_id TEXT,
    started_at TEXT,
    ended_at TEXT,
    duration_ms REAL,
    account TEXT,
    prompt TEXT,
    response TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    context_input_tokens INTEGER,
    context_window_pct REAL,
    llm_calls INTEGER NOT NULL DEFAULT 0,
    tool_calls INTEGER NOT NULL DEFAULT 0,
    tool_duration_ms REAL,
    raw_json TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, trace_id, root_span_id),
    FOREIGN KEY(session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_turns_session_started_at
    ON turns(session_id, started_at);

CREATE TABLE IF NOT EXISTS instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    turn_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    trace_id TEXT,
    root_span_id TEXT,
    ordinal INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(session_id, trace_id, root_span_id, ordinal),
    FOREIGN KEY(turn_id) REFERENCES turns(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_instructions_session_turn
    ON instructions(session_id, turn_id, ordinal);
"""


def connect_db(path: Path) -> sqlite3.Connection:
    ensure_parent(path)
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = ON")
    with conn:
        conn.executescript(SCHEMA)
        existing_session_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(sessions)").fetchall()
        }
        if "account" not in existing_session_columns:
            conn.execute("ALTER TABLE sessions ADD COLUMN account TEXT")

        existing_turn_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(turns)").fetchall()
        }
        if "account" not in existing_turn_columns:
            conn.execute("ALTER TABLE turns ADD COLUMN account TEXT")

        repair_account_columns(conn)
    return conn


def infer_account_from_turn_raw_json(rows: Iterable[Sequence[Any]]) -> Optional[str]:
    spans: List[Dict[str, Any]] = []
    for row in rows:
        raw_json = row[0] if row else None
        if not raw_json:
            continue
        try:
            parsed = json.loads(raw_json)
        except (TypeError, json.JSONDecodeError):
            continue
        if isinstance(parsed, list):
            spans.extend(item for item in parsed if isinstance(item, dict))
    if not spans:
        return None
    turns = infer_turns(spans)
    return first_non_empty(turn.get("account") for turn in turns)


def infer_account_from_otel_path(otel_file: Optional[str]) -> Optional[str]:
    if not otel_file:
        return None
    path = Path(otel_file)
    if not path.exists() or not path.is_file():
        return None
    try:
        _session_id, turns = load_turns_from_otel_file(path)
    except (OSError, ValueError):
        return None
    return first_non_empty(turn.get("account") for turn in turns)


def repair_account_columns(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        UPDATE turns
        SET account = (
            SELECT s.account
            FROM sessions s
            WHERE s.session_id = turns.session_id
        )
        WHERE COALESCE(turns.account, '') = ''
          AND EXISTS (
              SELECT 1
              FROM sessions s
              WHERE s.session_id = turns.session_id
                AND COALESCE(s.account, '') <> ''
          )
        """
    )
    conn.execute(
        """
        UPDATE sessions
        SET account = (
            SELECT t.account
            FROM turns t
            WHERE t.session_id = sessions.session_id
              AND COALESCE(t.account, '') <> ''
            ORDER BY t.started_at
            LIMIT 1
        )
        WHERE COALESCE(sessions.account, '') = ''
        """
    )

    active_login: Optional[str] = None
    missing_sessions = conn.execute(
        """
        SELECT session_id, otel_file
        FROM sessions
        WHERE COALESCE(account, '') = ''
        ORDER BY started_at
        """
    ).fetchall()

    for session_id, otel_file in missing_sessions:
        raw_rows = conn.execute(
            """
            SELECT raw_json
            FROM turns
            WHERE session_id = ?
            ORDER BY started_at, id
            """,
            (session_id,),
        ).fetchall()
        account = infer_account_from_turn_raw_json(raw_rows)
        if not account:
            account = infer_account_from_otel_path(otel_file)
        if not account:
            if active_login is None:
                active_login = detect_active_github_login()
            account = active_login
        if not account:
            continue
        conn.execute(
            "UPDATE sessions SET account = ? WHERE session_id = ?",
            (account, session_id),
        )
        conn.execute(
            """
            UPDATE turns
            SET account = ?
            WHERE session_id = ?
              AND COALESCE(account, '') = ''
            """,
            (account, session_id),
        )


def read_jsonl_records(path: Path, *, allow_partial_last_line: bool = False) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    raw_lines = path.read_text(encoding="utf-8").splitlines()
    for line_number, raw_line in enumerate(raw_lines, start=1):
        line = raw_line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError as exc:
            if allow_partial_last_line and line_number == len(raw_lines):
                break
            raise ValueError(f"Invalid JSON on line {line_number}: {exc}") from exc
        if isinstance(parsed, dict):
            records.append(parsed)
    return records


def latest_otel_file(logs_dir: Path) -> Optional[Path]:
    if not logs_dir.exists() or not logs_dir.is_dir():
        return None
    candidates = [path for path in logs_dir.rglob("*.jsonl") if path.is_file()]
    if not candidates:
        return None
    return max(candidates, key=lambda path: (path.stat().st_mtime_ns, path.name))


def load_turns_from_otel_file(otel_file: Path) -> Tuple[str, List[Dict[str, Any]]]:
    records = read_jsonl_records(otel_file, allow_partial_last_line=True)
    spans: List[Dict[str, Any]] = []
    for record in records:
        spans.extend(extract_spans_from_record(record))
    return otel_file.stem, fill_missing_turn_accounts(infer_turns(spans))


def find_turn_id(conn: sqlite3.Connection, session_id: str, turn: Dict[str, Any]) -> Optional[int]:
    row = conn.execute(
        """
        SELECT id
        FROM turns
        WHERE session_id = ? AND trace_id IS ? AND root_span_id IS ?
        """,
        (session_id, turn["trace_id"], turn["span_id"]),
    ).fetchone()
    if row is None:
        return None
    return int(row[0])


def ingest_otel_file(
    db_path: Path,
    otel_file: Path,
    session_id: str,
    command_line: str,
    exit_code: int,
    capture_content: bool = True,
) -> Tuple[int, int]:
    conn = connect_db(db_path)
    records = read_jsonl_records(otel_file)
    spans: List[Dict[str, Any]] = []
    for record in records:
        spans.extend(extract_spans_from_record(record))

    turns = fill_missing_turn_accounts(infer_turns(spans))
    account = first_non_empty(turn.get("account") for turn in turns)

    started_at = turns[0]["started_at"] if turns else utc_now()
    ended_at = turns[-1]["ended_at"] if turns else utc_now()

    with conn:
        conn.execute(
            """
            INSERT INTO sessions (
                session_id, command_line, otel_file, started_at, ended_at, exit_code,
                platform, account, capture_content, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                ended_at = excluded.ended_at,
                exit_code = excluded.exit_code,
                account = COALESCE(excluded.account, sessions.account)
            """,
            (
                session_id,
                command_line,
                str(otel_file),
                started_at,
                ended_at,
                exit_code,
                platform.platform(),
                account,
                1 if capture_content else 0,
                utc_now(),
            ),
        )

        inserted = 0
        for turn in turns:
            cursor = conn.execute(
                """
                INSERT OR IGNORE INTO turns (
                    session_id, trace_id, root_span_id, started_at, ended_at, duration_ms,
                    account, prompt, response, model, input_tokens, output_tokens, total_tokens,
                    context_input_tokens, context_window_pct, llm_calls, tool_calls,
                    tool_duration_ms, raw_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    turn["trace_id"],
                    turn["span_id"],
                    turn["started_at"],
                    turn["ended_at"],
                    turn["duration_ms"],
                    turn.get("account"),
                    turn["prompt"],
                    turn["response"],
                    turn["model"],
                    turn["input_tokens"],
                    turn["output_tokens"],
                    turn["total_tokens"],
                    turn["context_input_tokens"],
                    turn["context_window_pct"],
                    turn["llm_calls"],
                    turn["tool_calls"],
                    turn["tool_duration_ms"],
                    turn["raw_json"],
                    utc_now(),
                ),
            )
            turn_id = cursor.lastrowid if cursor.rowcount > 0 else find_turn_id(conn, session_id, turn)
            if turn_id is not None:
                if turn.get("account"):
                    conn.execute(
                        """
                        UPDATE turns
                        SET account = COALESCE(account, ?)
                        WHERE id = ?
                        """,
                        (turn["account"], turn_id),
                    )
                for ordinal, instruction in enumerate(turn.get("instructions", []), start=1):
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO instructions (
                            turn_id, session_id, trace_id, root_span_id, ordinal, content, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            turn_id,
                            session_id,
                            turn["trace_id"],
                            turn["span_id"],
                            ordinal,
                            instruction,
                            utc_now(),
                        ),
                    )
            if cursor.rowcount > 0:
                inserted += 1

    conn.close()
    return inserted, len(turns)


def run_wrap_command(args: argparse.Namespace) -> int:
    logs_dir = args.logs_dir
    logs_dir.mkdir(parents=True, exist_ok=True)

    session_id = dt.datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]
    otel_file = logs_dir / f"{session_id}.jsonl"
    db_path: Path = args.db

    env = os.environ.copy()
    env["COPILOT_OTEL_ENABLED"] = "true"
    env["COPILOT_OTEL_FILE_EXPORTER_PATH"] = str(otel_file)
    env["COPILOT_OTEL_EXPORTER_TYPE"] = "file"
    env["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = (
        "true" if args.capture_content else "false"
    )

    copilot_args = list(args.copilot_args)
    if copilot_args and copilot_args[0] == "--":
        copilot_args = copilot_args[1:]

    command = ["copilot", *copilot_args]
    executable = shutil.which(command[0])
    if not executable:
        print(
            "error: `copilot` command was not found in PATH. "
            "Install GitHub Copilot CLI and make sure the command is available "
            "in the current shell before running this wrapper.",
            file=sys.stderr,
        )
        return 127

    command[0] = executable
    completed = subprocess.run(command, env=env)

    if not otel_file.exists():
        print(
            f"warning: no OTel file was created at {otel_file}. "
            "Make sure your Copilot CLI version supports monitoring.",
            file=sys.stderr,
        )
        return completed.returncode

    inserted, detected = ingest_otel_file(
        db_path=db_path,
        otel_file=otel_file,
        session_id=session_id,
        command_line=" ".join(command),
        exit_code=completed.returncode,
        capture_content=args.capture_content,
    )

    if not args.keep_otel_file:
        otel_file.unlink(missing_ok=True)

    print(
        f"tracked session {session_id}: imported {inserted}/{detected} turns into {db_path}",
        file=sys.stderr,
    )
    return completed.returncode


def print_rows(headers: Sequence[str], rows: Sequence[Sequence[Any]]) -> None:
    widths = [len(header) for header in headers]
    prepared_rows: List[List[str]] = []
    for row in rows:
        prepared_row = ["" if value is None else str(value) for value in row]
        prepared_rows.append(prepared_row)
        for index, cell in enumerate(prepared_row):
            widths[index] = min(max(widths[index], len(cell)), 80)

    fmt = "  ".join(f"{{:{width}}}" for width in widths)
    print(fmt.format(*headers))
    print(fmt.format(*["-" * width for width in widths]))
    for row in prepared_rows:
        clipped = [
            cell if len(cell) <= widths[index] else cell[: widths[index] - 1] + "…"
            for index, cell in enumerate(row)
        ]
        print(fmt.format(*clipped))


def compact_display_text(value: Any, *, role: Optional[str] = None) -> str:
    if role is not None:
        messages = dedupe_preserve_order(extract_role_messages(value, role))
        if messages:
            return "\n".join(messages)

    serialized = serialize_compact(parse_jsonish(value))
    return serialized or ""


def format_same_session(value: bool) -> str:
    return "yes" if value else "no"


def context_tokens_for_display(turn: Dict[str, Any]) -> int:
    return int(turn.get("context_input_tokens") or turn.get("input_tokens") or 0)


def annotate_single_session_turns(
    session_id: str,
    turns: Sequence[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    annotated: List[Dict[str, Any]] = []
    for session_turn, turn in enumerate(
        sorted(turns, key=lambda item: item.get("started_at") or ""),
        start=1,
    ):
        annotated.append(
            {
                **turn,
                "session_id": session_id,
                "session_turn": session_turn,
                "same_session": session_turn > 1,
            }
        )
    return annotated


def print_recent_turns(rows: Sequence[Sequence[Any]]) -> int:
    if not rows:
        print("No tracked results found.")
        return 0

    for index, row in enumerate(rows, start=1):
        (
            session_id,
            account,
            started_at,
            duration_ms_value,
            model,
            same_session,
            session_turn,
            context_input_tokens,
            input_tokens,
            output_tokens,
            tool_calls,
            prompt,
            response,
        ) = row
        print(
            f"[{index}] {started_at}  session={session_id}  "
            f"account={account or '-'}  "
            f"model={model or '-'}  ms={duration_ms_value or 0}  "
            f"same_sess={same_session}  sess_turn={session_turn}  "
            f"ctx_in={context_input_tokens}  in={input_tokens}  "
            f"out={output_tokens}  tools={tool_calls}"
        )
        print("prompt:")
        print(compact_display_text(prompt, role="user") or "-")
        print("response:")
        print(compact_display_text(response, role="assistant") or "-")
        if index != len(rows):
            print()
    return 0


def build_report_rows_from_turns(
    session_id: str,
    turns: Sequence[Dict[str, Any]],
    limit: int,
) -> List[Tuple[Any, ...]]:
    recent_turns = sorted(
        annotate_single_session_turns(session_id, turns),
        key=lambda item: item.get("started_at") or "",
        reverse=True,
    )[:limit]
    return [
        (
            turn.get("session_id"),
            turn.get("account") or "",
            turn.get("started_at"),
            round(turn.get("duration_ms") or 0, 1),
            turn.get("model") or "",
            format_same_session(bool(turn.get("same_session"))),
            turn.get("session_turn") or 0,
            context_tokens_for_display(turn),
            turn.get("input_tokens") or 0,
            turn.get("output_tokens") or 0,
            turn.get("tool_calls") or 0,
            compact_display_text(turn.get("prompt"), role="user").replace("\n", " "),
        )
        for turn in recent_turns
    ]


def run_report_command(args: argparse.Namespace) -> int:
    if args.live:
        otel_file = args.otel_file or latest_otel_file(args.logs_dir)
        if otel_file is None:
            print_rows(
                [
                    "session_id",
                    "account",
                    "started_at",
                    "ms",
                    "model",
                    "same_sess",
                    "sess_turn",
                    "ctx_in",
                    "in_tok",
                    "out_tok",
                    "tools",
                    "prompt",
                ],
                [],
            )
            return 0

        session_id, turns = load_turns_from_otel_file(otel_file)
        if args.session_id and args.session_id != session_id:
            print_rows(
                [
                    "session_id",
                    "account",
                    "started_at",
                    "ms",
                    "model",
                    "same_sess",
                    "sess_turn",
                    "ctx_in",
                    "in_tok",
                    "out_tok",
                    "tools",
                    "prompt",
                ],
                [],
            )
            return 0

        rows = build_report_rows_from_turns(session_id, turns, args.limit)
        print_rows(
            [
                "session_id",
                "account",
                "started_at",
                "ms",
                "model",
                "same_sess",
                "sess_turn",
                "ctx_in",
                "in_tok",
                "out_tok",
                "tools",
                "prompt",
            ],
            rows,
        )
        return 0

    conn = connect_db(args.db)
    query = """
        SELECT
            t.session_id,
            COALESCE(t.account, s.account, ''),
            t.started_at,
            ROUND(t.duration_ms, 1),
            COALESCE(t.model, ''),
            CASE
                WHEN (
                    SELECT COUNT(*)
                    FROM turns t2
                    WHERE t2.session_id = t.session_id
                      AND (
                        COALESCE(t2.started_at, '') < COALESCE(t.started_at, '')
                        OR (
                            COALESCE(t2.started_at, '') = COALESCE(t.started_at, '')
                            AND t2.id <= t.id
                        )
                      )
                ) > 1 THEN 'yes'
                ELSE 'no'
            END,
            (
                SELECT COUNT(*)
                FROM turns t2
                WHERE t2.session_id = t.session_id
                  AND (
                    COALESCE(t2.started_at, '') < COALESCE(t.started_at, '')
                    OR (
                        COALESCE(t2.started_at, '') = COALESCE(t.started_at, '')
                        AND t2.id <= t.id
                    )
                  )
            ),
            COALESCE(t.context_input_tokens, t.input_tokens, 0),
            COALESCE(t.input_tokens, 0),
            COALESCE(t.output_tokens, 0),
            COALESCE(t.tool_calls, 0),
            REPLACE(COALESCE(t.prompt, ''), CHAR(10), ' ')
        FROM turns t
        LEFT JOIN sessions s ON s.session_id = t.session_id
    """
    params: List[Any] = []
    if args.session_id:
        query += " WHERE t.session_id = ?"
        params.append(args.session_id)
    query += " ORDER BY t.started_at DESC LIMIT ?"
    params.append(args.limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    print_rows(
        [
            "session_id",
            "account",
            "started_at",
            "ms",
            "model",
            "same_sess",
            "sess_turn",
            "ctx_in",
            "in_tok",
            "out_tok",
            "tools",
            "prompt",
        ],
        rows,
    )
    return 0


def run_recent_command(args: argparse.Namespace) -> int:
    if args.live:
        otel_file = args.otel_file or latest_otel_file(args.logs_dir)
        if otel_file is None:
            print("No live OTel JSONL file found.")
            return 0

        session_id, turns = load_turns_from_otel_file(otel_file)
        if args.session_id and args.session_id != session_id:
            print(f"No live OTel JSONL file found for session {args.session_id}.")
            return 0

        recent_turns = sorted(
            annotate_single_session_turns(session_id, turns),
            key=lambda item: item.get("started_at") or "",
            reverse=True,
        )[: args.limit]
        rows = [
            (
                turn.get("session_id"),
                turn.get("account") or "",
                turn.get("started_at"),
                round(turn.get("duration_ms") or 0, 1),
                turn.get("model") or "",
                format_same_session(bool(turn.get("same_session"))),
                turn.get("session_turn") or 0,
                context_tokens_for_display(turn),
                turn.get("input_tokens") or 0,
                turn.get("output_tokens") or 0,
                turn.get("tool_calls") or 0,
                turn.get("prompt"),
                turn.get("response"),
            )
            for turn in recent_turns
        ]
        return print_recent_turns(rows)

    conn = connect_db(args.db)
    query = """
        SELECT
            t.session_id,
            COALESCE(t.account, s.account, ''),
            t.started_at,
            ROUND(t.duration_ms, 1),
            COALESCE(t.model, ''),
            CASE
                WHEN (
                    SELECT COUNT(*)
                    FROM turns t2
                    WHERE t2.session_id = t.session_id
                      AND (
                        COALESCE(t2.started_at, '') < COALESCE(t.started_at, '')
                        OR (
                            COALESCE(t2.started_at, '') = COALESCE(t.started_at, '')
                            AND t2.id <= t.id
                        )
                      )
                ) > 1 THEN 'yes'
                ELSE 'no'
            END,
            (
                SELECT COUNT(*)
                FROM turns t2
                WHERE t2.session_id = t.session_id
                  AND (
                    COALESCE(t2.started_at, '') < COALESCE(t.started_at, '')
                    OR (
                        COALESCE(t2.started_at, '') = COALESCE(t.started_at, '')
                        AND t2.id <= t.id
                    )
                  )
            ),
            COALESCE(t.context_input_tokens, t.input_tokens, 0),
            COALESCE(t.input_tokens, 0),
            COALESCE(t.output_tokens, 0),
            COALESCE(t.tool_calls, 0),
            t.prompt,
            t.response
        FROM turns t
        LEFT JOIN sessions s ON s.session_id = t.session_id
    """
    params: List[Any] = []
    if args.session_id:
        query += " WHERE t.session_id = ?"
        params.append(args.session_id)
    query += " ORDER BY t.started_at DESC LIMIT ?"
    params.append(args.limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return print_recent_turns(rows)


def run_sessions_command(args: argparse.Namespace) -> int:
    conn = connect_db(args.db)
    rows = conn.execute(
        """
        SELECT
            s.session_id,
            s.account,
            s.started_at,
            s.ended_at,
            s.exit_code,
            COUNT(t.id) AS turns,
            s.command_line
        FROM sessions s
        LEFT JOIN turns t ON t.session_id = s.session_id
        GROUP BY s.session_id, s.account, s.started_at, s.ended_at, s.exit_code, s.command_line
        ORDER BY s.started_at DESC
        LIMIT ?
        """,
        (args.limit,),
    ).fetchall()
    conn.close()
    print_rows(
        ["session_id", "account", "started_at", "ended_at", "exit", "turns", "command"],
        rows,
    )
    return 0


def count_existing_records(db_path: Path) -> Tuple[int, int]:
    if not db_path.exists():
        return 0, 0

    conn = sqlite3.connect(db_path)
    try:
        table_names = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
        sessions = (
            int(conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0])
            if "sessions" in table_names
            else 0
        )
        turns = (
            int(conn.execute("SELECT COUNT(*) FROM turns").fetchone()[0])
            if "turns" in table_names
            else 0
        )
        return sessions, turns
    finally:
        conn.close()


def sqlite_sidecar_paths(db_path: Path) -> List[Path]:
    return [Path(f"{db_path}{suffix}") for suffix in ("-wal", "-shm", "-journal")]


def delete_logs_dir_contents(logs_dir: Path) -> int:
    if not logs_dir.exists() or not logs_dir.is_dir():
        return 0

    log_files = [path for path in logs_dir.rglob("*.jsonl") if path.is_file()]
    for path in log_files:
        path.unlink()

    directories = sorted(
        [path for path in logs_dir.rglob("*") if path.is_dir()],
        key=lambda path: len(path.parts),
        reverse=True,
    )
    for directory in directories:
        try:
            directory.rmdir()
        except OSError:
            pass
    try:
        logs_dir.rmdir()
    except OSError:
        pass

    return len(log_files)


def run_clear_command(args: argparse.Namespace) -> int:
    if not args.yes:
        print(
            "error: clear is destructive. Re-run with --yes to delete tracked data.",
            file=sys.stderr,
        )
        return 2

    sessions, turns = count_existing_records(args.db)
    db_files = [args.db, *sqlite_sidecar_paths(args.db)]
    removed_db_files = 0
    for path in db_files:
        if path.exists():
            path.unlink()
            removed_db_files += 1

    removed_logs = delete_logs_dir_contents(args.logs_dir)
    print(
        "deleted "
        f"{sessions} sessions, {turns} turns, "
        f"{removed_logs} JSONL files, and {removed_db_files} SQLite files"
    )
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    if args.command == "wrap":
        return run_wrap_command(args)
    if args.command == "ingest":
        inserted, detected = ingest_otel_file(
            db_path=args.db,
            otel_file=args.otel_file,
            session_id=args.session_id,
            command_line=args.command_line,
            exit_code=args.exit_code,
        )
        print(f"imported {inserted}/{detected} turns into {args.db}")
        return 0
    if args.command == "report":
        return run_report_command(args)
    if args.command == "recent":
        return run_recent_command(args)
    if args.command == "sessions":
        return run_sessions_command(args)
    if args.command == "clear":
        return run_clear_command(args)
    raise AssertionError(f"unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
