#!/usr/bin/env python3
"""Compact Household Activity window digest for the daily change summary.

Read-only. Does not write Sessions, Activity, or Reports.

Usage:
  python3 hyperagent/scripts/household_activity_window.py --hours 24
  python3 hyperagent/scripts/household_activity_window.py --hours 24 --out /tmp/window.json
  python3 hyperagent/scripts/household_activity_window.py --self-test

Credential (GET, first match): HOUSEHOLD_ACTIVITY_READ, FLEET_ACTIVITY_WRITE,
HOUSEHOLD_ACTIVITY_WRITE_TOKEN, AIRTABLE_WRITE_TOKEN, AIRTABLE_API_KEY — then
the same keys in gitignored `.env` / `website/.env.local`. A write-only PAT
may 403; in that case exit 2 and use Airtable MCP instead.

Keep field IDs in sync with hyperagent/scripts/log_fleet_activity.py.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from typing import Any

BASE_ID = "appF7jQD4ZKrDC7e1"
API = "https://api.airtable.com/v0"
SESSIONS_TABLE = "tblUi4nmBKX2u8nFx"
ACTIVITY_TABLE = "tblNxNLyC31KDQbRl"

SESSION_FIELDS = {
    "session_id": "fldHTqDQeAEqE4JCb",
    "agent_slug": "fldzed2cCR3HyCCOb",
    "agent_name": "fld4jizroZZZVxDtb",
    "runtime": "fldoE8uXllbSMAPPS",
    "trigger": "fldG3t3bCjY8tklgv",
    "user": "fldMg0dpNURUNEkWW",
    "model": "fld5Rjoxc2q5hxR4R",
    "created": "fld4nhnuB5EmQIN4w",
}
ACTIVITY_FIELDS = {
    "summary": "fldoVtBIAKanaafMg",
    "event_id": "fldxIVVOp7VvfVQ5j",
    "session_id": "fldz1skahzUvg1vzX",
    "agent_turn_type": "fldvskIDzutu4JzQt",
    "outcome": "fldYYSYt5yVgN8dc1",
    "ai_turn_summary": "fldwmWz6k1ws9TpmP",
    "turn_started": "fldXoctP5BTnzYsAP",
}

CREDENTIAL_KEYS = (
    "HOUSEHOLD_ACTIVITY_READ",
    "FLEET_ACTIVITY_WRITE",
    "HOUSEHOLD_ACTIVITY_WRITE_TOKEN",
    "AIRTABLE_WRITE_TOKEN",
    "AIRTABLE_API_KEY",
)
ENV_FILES = (".env", "website/.env.local")
SKIP_TURN_TYPES = {"Session End"}
NARRATIVE_TURN_TYPES = {
    "Action", "Completion", "Blocker", "Error", "Decision", "Escalation", "Question",
}


def _repo_root() -> str:
    path = os.path.dirname(os.path.abspath(__file__))
    while True:
        if os.path.isdir(os.path.join(path, ".git")):
            return path
        parent = os.path.dirname(path)
        if parent == path:
            return os.getcwd()
        path = parent


def _read_env_file(path: str) -> dict[str, str]:
    values: dict[str, str] = {}
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if line.startswith("export "):
                    line = line[7:].lstrip()
                key, sep, value = line.partition("=")
                if not sep:
                    continue
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                if value:
                    values[key.strip()] = value
    except OSError:
        pass
    return values


def resolve_credential() -> tuple[str | None, str | None]:
    for key in CREDENTIAL_KEYS:
        token = os.environ.get(key)
        if token:
            return token, f"env:{key}"
    root = _repo_root()
    for rel in ENV_FILES:
        values = _read_env_file(os.path.join(root, rel))
        for key in CREDENTIAL_KEYS:
            if values.get(key):
                return values[key], f"{rel}:{key}"
    return None, None


def _choice_name(value: Any) -> str:
    if isinstance(value, dict):
        return str(value.get("name") or "")
    if value is None:
        return ""
    return str(value)


def _ai_text(value: Any) -> str:
    if isinstance(value, dict):
        if value.get("state") == "generated" and value.get("value"):
            return str(value["value"]).strip()
        return ""
    if value is None:
        return ""
    return str(value).strip()


def _parse_iso(value: str) -> dt.datetime | None:
    if not value:
        return None
    text = value.replace("Z", "+00:00")
    try:
        parsed = dt.datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed.astimezone(dt.timezone.utc)


def slug_from_session_id(session_id: str) -> str:
    """Agent slug is the prefix before '--' in a Session ID."""
    if not session_id:
        return "unknown"
    return session_id.split("--", 1)[0] or "unknown"


def build_digest(
    *,
    sessions: list[dict[str, Any]],
    activity: list[dict[str, Any]],
    window_start: dt.datetime,
    window_end: dt.datetime,
) -> dict[str, Any]:
    """Group a window of Sessions + Activity into a compact digest.

    `sessions` / `activity` are Airtable records with cellValuesByFieldId or fields.
    """
    def cells(record: dict[str, Any]) -> dict[str, Any]:
        return record.get("cellValuesByFieldId") or record.get("fields") or {}

    session_meta: dict[str, dict[str, str]] = {}
    for record in sessions:
        fields = cells(record)
        sid = str(fields.get(SESSION_FIELDS["session_id"]) or "")
        if not sid:
            continue
        session_meta[sid] = {
            "agent_slug": str(fields.get(SESSION_FIELDS["agent_slug"]) or slug_from_session_id(sid)),
            "agent_name": str(fields.get(SESSION_FIELDS["agent_name"]) or ""),
            "runtime": _choice_name(fields.get(SESSION_FIELDS["runtime"])),
            "trigger": _choice_name(fields.get(SESSION_FIELDS["trigger"])),
            "user": _choice_name(fields.get(SESSION_FIELDS["user"])),
        }

    by_slug: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "sessions": set(),
        "actions": [],
        "blockers": [],
        "session_count": 0,
    })
    blockers: list[dict[str, str]] = []
    notable: list[dict[str, str]] = []
    skipped_session_end = 0
    in_window_activity = 0

    for record in activity:
        fields = cells(record)
        started = _parse_iso(str(fields.get(ACTIVITY_FIELDS["turn_started"]) or record.get("createdTime") or ""))
        if started is None or started < window_start or started > window_end:
            continue
        in_window_activity += 1
        turn_type = _choice_name(fields.get(ACTIVITY_FIELDS["agent_turn_type"]))
        if turn_type in SKIP_TURN_TYPES:
            skipped_session_end += 1
            continue
        sid = str(fields.get(ACTIVITY_FIELDS["session_id"]) or "")
        meta = session_meta.get(sid, {})
        slug = meta.get("agent_slug") or slug_from_session_id(sid)
        bucket = by_slug[slug]
        if sid:
            bucket["sessions"].add(sid)
        summary = str(fields.get(ACTIVITY_FIELDS["summary"]) or "").strip()
        ai_summary = _ai_text(fields.get(ACTIVITY_FIELDS["ai_turn_summary"]))
        line = summary or ai_summary
        outcome = _choice_name(fields.get(ACTIVITY_FIELDS["outcome"]))
        rec_id = str(record.get("id") or "")
        item = {
            "summary": line,
            "outcome": outcome,
            "turn_type": turn_type,
            "session_id": sid,
            "record_id": rec_id,
        }
        if outcome == "Blocked" or turn_type in {"Blocker", "Error"}:
            bucket["blockers"].append(item)
            blockers.append({"agent_slug": slug, **item})
        elif line and (turn_type in NARRATIVE_TURN_TYPES or (not turn_type and summary)):
            bucket["actions"].append(item)
            notable.append({"agent_slug": slug, **item})

    agents = []
    for slug, bucket in sorted(by_slug.items()):
        agents.append({
            "slug": slug,
            "agent_name": next(
                (session_meta[s].get("agent_name") for s in bucket["sessions"] if session_meta.get(s, {}).get("agent_name")),
                slug,
            ),
            "session_count": len(bucket["sessions"]),
            "action_count": len(bucket["actions"]),
            "blocker_count": len(bucket["blockers"]),
            "actions": [row["summary"] for row in bucket["actions"][:8] if row.get("summary")],
            "blockers": [row["summary"] for row in bucket["blockers"][:8] if row.get("summary")],
        })

    return {
        "window_start": window_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window_end": window_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "session_count": len(session_meta),
        "activity_count": in_window_activity,
        "skipped_session_end": skipped_session_end,
        "blocked_count": len(blockers),
        "by_agent": agents,
        "blockers": blockers[:20],
        "notable": notable[:40],
        "activity_view": (
            "https://airtable.com/appF7jQD4ZKrDC7e1/tblNxNLyC31KDQbRl/viwPtyC2Ga4C3G0gZ"
        ),
        "reports_view": (
            "https://airtable.com/appF7jQD4ZKrDC7e1/tblFzWUIPSiIGZPln/viw8QcT43VAfp85jZ"
        ),
    }


def _get_page(token: str, table_id: str, field_ids: list[str], offset: str | None) -> dict[str, Any]:
    params: list[tuple[str, str]] = [
        ("pageSize", "100"),
        ("returnFieldsByFieldId", "true"),
        ("sort[0][field]", "fld4nhnuB5EmQIN4w" if table_id == SESSIONS_TABLE else "fldXoctP5BTnzYsAP"),
        ("sort[0][direction]", "desc"),
    ]
    for fid in field_ids:
        params.append(("fields[]", fid))
    if offset:
        params.append(("offset", offset))
    query = urllib.parse.urlencode(params)
    url = f"{API}/{BASE_ID}/{table_id}?{query}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        raise SystemExit(json.dumps({
            "success": False,
            "error": f"HTTP {exc.code} GET {table_id}",
            "detail": detail,
            "hint": "Write-only PATs cannot read; use Airtable MCP list_records_for_table.",
        })) from exc


def fetch_table(token: str, table_id: str, field_ids: list[str], window_start: dt.datetime) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = None
    stamp_field = SESSION_FIELDS["created"] if table_id == SESSIONS_TABLE else ACTIVITY_FIELDS["turn_started"]
    while True:
        page = _get_page(token, table_id, field_ids, offset)
        records = page.get("records") or []
        stop = False
        for record in records:
            fields = record.get("fields") or record.get("cellValuesByFieldId") or {}
            stamp = _parse_iso(str(fields.get(stamp_field) or record.get("createdTime") or ""))
            if stamp is not None and stamp < window_start:
                stop = True
                break
            # Normalise to cellValuesByFieldId so build_digest is one shape.
            record["cellValuesByFieldId"] = fields
            rows.append(record)
        if stop or not page.get("offset"):
            break
        offset = page.get("offset")
    return rows


def _self_test() -> None:
    window_end = dt.datetime(2026, 8, 13, 12, 0, tzinfo=dt.timezone.utc)
    window_start = window_end - dt.timedelta(hours=24)
    sessions = [{
        "id": "recS1",
        "cellValuesByFieldId": {
            SESSION_FIELDS["session_id"]: "kate--20260813T0100Z--ab",
            SESSION_FIELDS["agent_slug"]: "kate",
            SESSION_FIELDS["agent_name"]: "Kate",
            SESSION_FIELDS["runtime"]: {"name": "Cursor"},
            SESSION_FIELDS["trigger"]: {"name": "Interactive"},
            SESSION_FIELDS["user"]: {"name": "Matthew"},
        },
    }]
    activity = [
        {
            "id": "recA1",
            "createdTime": "2026-08-13T02:00:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["summary"]: "Opened PR #139",
                ACTIVITY_FIELDS["session_id"]: "kate--20260813T0100Z--ab",
                ACTIVITY_FIELDS["agent_turn_type"]: {"name": "Action"},
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T02:00:00.000Z",
            },
        },
        {
            "id": "recA2",
            "createdTime": "2026-08-13T02:01:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "kate--20260813T0100Z--ab",
                ACTIVITY_FIELDS["agent_turn_type"]: {"name": "Session End"},
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T02:01:00.000Z",
            },
        },
        {
            "id": "recA3",
            "createdTime": "2026-08-13T03:00:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["summary"]: "Killed overflow helper",
                ACTIVITY_FIELDS["session_id"]: "clive-man-context-auditor--20260813T0300Z--q7",
                ACTIVITY_FIELDS["agent_turn_type"]: {"name": "Action"},
                ACTIVITY_FIELDS["outcome"]: {"name": "Blocked"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T03:00:00.000Z",
            },
        },
    ]
    digest = build_digest(
        sessions=sessions, activity=activity,
        window_start=window_start, window_end=window_end,
    )
    assert digest["activity_count"] == 3, digest
    assert digest["skipped_session_end"] == 1, digest
    assert digest["blocked_count"] == 1, digest
    slugs = {row["slug"] for row in digest["by_agent"]}
    assert slugs == {"kate", "clive-man-context-auditor"}, slugs
    kate = next(row for row in digest["by_agent"] if row["slug"] == "kate")
    assert kate["actions"] == ["Opened PR #139"], kate
    assert slug_from_session_id("clive-man-context-auditor--20260813T0300Z--q7") == (
        "clive-man-context-auditor"
    )
    print(json.dumps({"success": True, "self_test": "ok"}))


def main() -> None:
    parser = argparse.ArgumentParser(description="Household Activity window digest")
    parser.add_argument("--hours", type=int, default=24)
    parser.add_argument("--out", help="Write JSON to this path as well as stdout")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        _self_test()
        return

    token, source = resolve_credential()
    if not token:
        print(json.dumps({
            "success": False,
            "error": "no read credential",
            "hint": "Use Airtable MCP list_records_for_table, or set HOUSEHOLD_ACTIVITY_READ.",
        }), file=sys.stderr)
        sys.exit(2)

    window_end = dt.datetime.now(dt.timezone.utc)
    window_start = window_end - dt.timedelta(hours=max(1, args.hours))
    sessions = fetch_table(token, SESSIONS_TABLE, list(SESSION_FIELDS.values()), window_start)
    activity = fetch_table(token, ACTIVITY_TABLE, list(ACTIVITY_FIELDS.values()), window_start)
    digest = build_digest(
        sessions=sessions,
        activity=activity,
        window_start=window_start,
        window_end=window_end,
    )
    digest["credential_source"] = source
    digest["success"] = True
    text = json.dumps(digest, ensure_ascii=False, indent=2)
    print(text)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(text + "\n")


if __name__ == "__main__":
    main()
