#!/usr/bin/env python3
"""Compact Household Activity window digest for the daily change summary.

Read-only. Does not write Sessions, Activity, or Reports. Reports are indexed
(title / type / headline / link) — Body is never fetched. Activity is read
through both turn labels and the four text fields: User Message, Reply Digest,
AI Turn Summary, Summary. The digest stores a one-liner plus short clips —
not full chat transcripts.

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
REPORTS_TABLE = "tblFzWUIPSiIGZPln"
OWN_SLUG = "summarize-changes-daily"

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
    "user_turn_type": "fldTCd93XF8XhsVoZ",  # AI-owned; read only
    "agent_turn_type": "fldvskIDzutu4JzQt",
    "user_message": "fldzSTdm15GQf88Ph",
    "reply_digest": "fldBj92Hu9gDesX6u",
    "outcome": "fldYYSYt5yVgN8dc1",
    "ai_turn_summary": "fldwmWz6k1ws9TpmP",
    "turn_started": "fldXoctP5BTnzYsAP",
}
# Index only — never fetch Body (fldt5UAqRVsm0mICy).
REPORTS_FIELDS = {
    "title": "fldr0pNUAYm9jEITx",
    "report_type": "fld3uIBw78HahcUms",
    "agent_slug": "fldijGsAXxwMikENa",
    "headline": "fldyI1UVIyIcSVhkj",
    "period_start": "fldnbnJgwJhjpOPz2",
    "period_end": "fldc1uSKfB1wE0MfE",
}

CREDENTIAL_KEYS = (
    "HOUSEHOLD_ACTIVITY_READ",
    "FLEET_ACTIVITY_WRITE",
    "HOUSEHOLD_ACTIVITY_WRITE_TOKEN",
    "AIRTABLE_WRITE_TOKEN",
    "AIRTABLE_API_KEY",
)
ENV_FILES = (".env", "website/.env.local")
SKIP_AGENT_TURN_TYPES = {"Session End"}
# Open Ended is unclassified chat filler — not a daily-note signal.
SKIP_USER_TURN_TYPES = {"Open Ended"}
HUMAN_NARRATIVE_TYPES = {"Decision", "Correction", "Brief", "Question"}
AGENT_NARRATIVE_TYPES = {
    "Action", "Completion", "Blocker", "Error", "Decision", "Escalation", "Question",
}
# Clips in the digest JSON — full transcripts stay in Airtable.
TEXT_CLIP = 280


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


def _plain_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        return str(value.get("value") or "").strip()
    return str(value).strip()


def _clip(text: str, limit: int = TEXT_CLIP) -> str:
    collapsed = " ".join(text.split())
    if len(collapsed) <= limit:
        return collapsed
    return collapsed[: limit - 1].rstrip() + "…"


def _turn_line(fields: dict[str, Any]) -> tuple[str, str, str, str]:
    """One-liner plus clips from the four Activity text fields.

    Preference: generated AI Turn Summary → mechanical Summary → User Message
    → Reply Digest. Returns (line, source, user_ask_clip, reply_clip).
    """
    summary = _plain_text(fields.get(ACTIVITY_FIELDS["summary"]))
    ai_summary = _ai_text(fields.get(ACTIVITY_FIELDS["ai_turn_summary"]))
    user_message = _plain_text(fields.get(ACTIVITY_FIELDS["user_message"]))
    reply_digest = _plain_text(fields.get(ACTIVITY_FIELDS["reply_digest"]))
    if ai_summary:
        line, source = ai_summary, "ai_turn_summary"
    elif summary:
        line, source = summary, "summary"
    elif user_message:
        line, source = _clip(user_message), "user_message"
    elif reply_digest:
        line, source = _clip(reply_digest), "reply_digest"
    else:
        line, source = "", ""
    return line, source, _clip(user_message) if user_message else "", _clip(reply_digest) if reply_digest else ""


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
        "human_turns": [],
        # Dispatch tickets stay in their own bucket: an agent's brief to a minion
        # is not a human turn, and the two must not be conflated.
        "dispatch_tickets": [],
        "session_count": 0,
    })
    blockers: list[dict[str, str]] = []
    notable: list[dict[str, str]] = []
    dispatch_tickets: list[dict[str, str]] = []
    human_turns: list[dict[str, str]] = []
    questions: list[dict[str, str]] = []
    skipped_session_end = 0
    skipped_open_ended = 0
    in_window_activity = 0
    exchange_count = 0
    user_turn_counts: dict[str, int] = defaultdict(int)
    agent_turn_counts: dict[str, int] = defaultdict(int)
    line_source_counts: dict[str, int] = defaultdict(int)

    for record in activity:
        fields = cells(record)
        started = _parse_iso(str(fields.get(ACTIVITY_FIELDS["turn_started"]) or record.get("createdTime") or ""))
        if started is None or started < window_start or started > window_end:
            continue
        in_window_activity += 1
        agent_turn = _choice_name(fields.get(ACTIVITY_FIELDS["agent_turn_type"]))
        user_turn = _choice_name(fields.get(ACTIVITY_FIELDS["user_turn_type"]))
        agent_turn_counts[agent_turn or "(empty)"] += 1
        user_turn_counts[user_turn or "(empty)"] += 1
        if agent_turn in SKIP_AGENT_TURN_TYPES:
            skipped_session_end += 1
            continue
        # A dispatch ticket — a child session's first turn, carrying the brief in
        # User Message with no reply yet — is the job the agent was handed. It is
        # never filler, so it survives the Open Ended skip.
        is_dispatch_ticket = bool(
            not agent_turn
            and _plain_text(fields.get(ACTIVITY_FIELDS["user_message"]))
            and not _plain_text(fields.get(ACTIVITY_FIELDS["reply_digest"]))
        )
        if user_turn in SKIP_USER_TURN_TYPES and not agent_turn and not is_dispatch_ticket:
            skipped_open_ended += 1
            continue
        sid = str(fields.get(ACTIVITY_FIELDS["session_id"]) or "")
        meta = session_meta.get(sid, {})
        slug = meta.get("agent_slug") or slug_from_session_id(sid)
        bucket = by_slug[slug]
        if sid:
            bucket["sessions"].add(sid)
        line, line_source, user_ask, reply_clip = _turn_line(fields)
        if user_ask or reply_clip:
            exchange_count += 1
        if line_source:
            line_source_counts[line_source] += 1
        outcome = _choice_name(fields.get(ACTIVITY_FIELDS["outcome"]))
        rec_id = str(record.get("id") or "")
        item = {
            "summary": line,
            "line_source": line_source,
            "user_ask": user_ask,
            "reply_clip": reply_clip,
            "outcome": outcome,
            "user_turn_type": user_turn,
            "agent_turn_type": agent_turn,
            "turn_type": agent_turn or user_turn,
            "session_id": sid,
            "record_id": rec_id,
            "user": meta.get("user") or "",
        }
        is_blocker = (
            outcome in {"Blocked", "Failed"}
            or agent_turn in {"Blocker", "Error"}
            or user_turn == "Error"
        )
        is_question = user_turn == "Question" or agent_turn in {"Question", "Escalation"}
        is_human = user_turn in HUMAN_NARRATIVE_TYPES or (
            not user_turn and not agent_turn and bool(user_ask)
        )
        is_agent_work = agent_turn in AGENT_NARRATIVE_TYPES or (
            not agent_turn and not user_turn and bool(line) and not user_ask
        )
        tagged = {"agent_slug": slug, **item}
        if is_dispatch_ticket:
            bucket["dispatch_tickets"].append(item)
            dispatch_tickets.append(tagged)
        elif is_blocker:
            bucket["blockers"].append(item)
            blockers.append(tagged)
        elif is_human:
            bucket["human_turns"].append(item)
            human_turns.append(tagged)
            if is_question:
                questions.append(tagged)
        elif is_question:
            questions.append(tagged)
        elif line and is_agent_work:
            bucket["actions"].append(item)
            notable.append(tagged)

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
            "human_turn_count": len(bucket["human_turns"]),
            "dispatch_ticket_count": len(bucket["dispatch_tickets"]),
            "actions": [row["summary"] for row in bucket["actions"][:8] if row.get("summary")],
            "blockers": [row["summary"] for row in bucket["blockers"][:8] if row.get("summary")],
            "human_turns": [row["summary"] for row in bucket["human_turns"][:8] if row.get("summary")],
            "dispatch_tickets": [
                row["summary"] for row in bucket["dispatch_tickets"][:8] if row.get("summary")
            ],
        })

    return {
        "window_start": window_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window_end": window_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "session_count": len(session_meta),
        "activity_count": in_window_activity,
        "skipped_session_end": skipped_session_end,
        "skipped_open_ended": skipped_open_ended,
        "blocked_count": len(blockers),
        "human_turn_count": len(human_turns),
        "dispatch_ticket_count": len(dispatch_tickets),
        "question_count": len(questions),
        "exchange_count": exchange_count,
        "user_turn_counts": dict(user_turn_counts),
        "agent_turn_counts": dict(agent_turn_counts),
        "line_source_counts": dict(line_source_counts),
        "by_agent": agents,
        "blockers": blockers[:20],
        "human_turns": human_turns[:40],
        "dispatch_tickets": dispatch_tickets[:40],
        "questions": questions[:20],
        "notable": notable[:40],
        "activity_view": (
            "https://airtable.com/appF7jQD4ZKrDC7e1/tblNxNLyC31KDQbRl/viwPtyC2Ga4C3G0gZ"
        ),
        "reports_view": (
            "https://airtable.com/appF7jQD4ZKrDC7e1/tblFzWUIPSiIGZPln/viw8QcT43VAfp85jZ"
        ),
    }


def build_reports_index(
    records: list[dict[str, Any]],
    *,
    window_start: dt.datetime,
    window_end: dt.datetime,
) -> dict[str, Any]:
    """Index Reports filed in the window. Never includes Body."""

    def cells(record: dict[str, Any]) -> dict[str, Any]:
        return record.get("cellValuesByFieldId") or record.get("fields") or {}

    standing: list[dict[str, str]] = []
    prior_self: list[dict[str, str]] = []
    for record in records:
        created = _parse_iso(str(record.get("createdTime") or ""))
        if created is None or created < window_start or created > window_end:
            continue
        fields = cells(record)
        rec_id = str(record.get("id") or "")
        slug = str(fields.get(REPORTS_FIELDS["agent_slug"]) or "")
        item = {
            "id": rec_id,
            "title": str(fields.get(REPORTS_FIELDS["title"]) or ""),
            "report_type": _choice_name(fields.get(REPORTS_FIELDS["report_type"])),
            "agent_slug": slug,
            "headline": str(fields.get(REPORTS_FIELDS["headline"]) or ""),
            "period_start": str(fields.get(REPORTS_FIELDS["period_start"]) or ""),
            "period_end": str(fields.get(REPORTS_FIELDS["period_end"]) or ""),
            "url": f"https://airtable.com/{BASE_ID}/{REPORTS_TABLE}/{rec_id}" if rec_id else "",
        }
        if slug == OWN_SLUG:
            prior_self.append(item)
        else:
            standing.append(item)
    return {
        "filed_count": len(standing) + len(prior_self),
        "standing": standing,
        "prior_self": prior_self,
    }


def _sort_field_for(table_id: str) -> str:
    if table_id == SESSIONS_TABLE:
        return SESSION_FIELDS["created"]
    if table_id == ACTIVITY_TABLE:
        return ACTIVITY_FIELDS["turn_started"]
    return REPORTS_FIELDS["period_end"]


def _get_page(token: str, table_id: str, field_ids: list[str], offset: str | None) -> dict[str, Any]:
    params: list[tuple[str, str]] = [
        ("pageSize", "100"),
        ("returnFieldsByFieldId", "true"),
        ("sort[0][field]", _sort_field_for(table_id)),
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
    if table_id == SESSIONS_TABLE:
        stamp_field = SESSION_FIELDS["created"]
    elif table_id == ACTIVITY_TABLE:
        stamp_field = ACTIVITY_FIELDS["turn_started"]
    else:
        stamp_field = None
    while True:
        page = _get_page(token, table_id, field_ids, offset)
        records = page.get("records") or []
        stop = False
        for record in records:
            fields = record.get("fields") or record.get("cellValuesByFieldId") or {}
            stamp_raw = record.get("createdTime") if stamp_field is None else fields.get(stamp_field)
            stamp = _parse_iso(str(stamp_raw or record.get("createdTime") or ""))
            if (
                table_id != REPORTS_TABLE
                and stamp is not None
                and stamp < window_start
            ):
                stop = True
                break
            # Normalise to cellValuesByFieldId so build_digest is one shape.
            record["cellValuesByFieldId"] = fields
            rows.append(record)
        if stop or not page.get("offset"):
            break
        offset = page.get("offset")
        if table_id == REPORTS_TABLE and len(rows) >= 100:
            break
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
    }, {
        "id": "recS2",
        "cellValuesByFieldId": {
            SESSION_FIELDS["session_id"]: "doc-workshop-proposer--20260812T0931Z--b1",
            SESSION_FIELDS["agent_slug"]: "doc-workshop-proposer",
            SESSION_FIELDS["agent_name"]: "Doc's Workshop Proposer",
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
        {
            "id": "recA4",
            "createdTime": "2026-08-12T09:37:41.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "doc-workshop-proposer--20260812T0931Z--b1",
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Decision"},
                ACTIVITY_FIELDS["user_message"]: (
                    "Matthew has approved, verbatim:\n\n"
                    "> **Approved: build Ruth Steward from the cleared single pack.**"
                ),
                ACTIVITY_FIELDS["reply_digest"]: (
                    "Built @ruth-steward, created three Household Register map tables, "
                    "and ran the first estate-read scan."
                ),
                ACTIVITY_FIELDS["ai_turn_summary"]: {
                    "state": "generated",
                    "value": "Matthew approved Ruth Steward Phase B.",
                },
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-12T16:00:00.000Z",
            },
        },
        {
            "id": "recA5",
            "createdTime": "2026-08-13T04:24:55.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "clive-man-activity-intake-cursor--20260813T0423Z--uc01",
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Brief"},
                ACTIVITY_FIELDS["user_message"]: (
                    "Process the remaining eligible Household Activity exchanges now. "
                    "Treat this run as UNCAPPED."
                ),
                ACTIVITY_FIELDS["reply_digest"]: "Uncapped Activity Intake: written=142 skipped=1.",
                ACTIVITY_FIELDS["ai_turn_summary"]: {
                    "state": "generated",
                    "value": "Asked for an uncapped intake run; 142 V1 rows written.",
                },
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T04:24:55.000Z",
            },
        },
        {
            "id": "recA6",
            "createdTime": "2026-08-13T04:30:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "kate--20260813T0100Z--ab",
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Open Ended"},
                ACTIVITY_FIELDS["user_message"]: "Thanks",
                ACTIVITY_FIELDS["reply_digest"]: "Anytime.",
                ACTIVITY_FIELDS["ai_turn_summary"]: {
                    "state": "generated",
                    "value": "Casual chat, not a daily-note signal.",
                },
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T04:30:00.000Z",
            },
        },
        {
            "id": "recA7",
            "createdTime": "2026-08-13T04:40:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "clive-man-activity-intake-cursor--20260813T0423Z--uc01",
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Decision"},
                ACTIVITY_FIELDS["user_message"]: "Try now",
                ACTIVITY_FIELDS["reply_digest"]: "Dry run complete: 143 eligible, V1 would create 0.",
                ACTIVITY_FIELDS["ai_turn_summary"]: {
                    "state": "error",
                    "errorType": "emptyDependency",
                    "value": None,
                },
                ACTIVITY_FIELDS["outcome"]: {"name": "Completed"},
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T04:40:00.000Z",
            },
        },
        {
            # Dispatch ticket: a child session's first turn, brief in User Message
            # and no reply yet. Even misclassified as Open Ended it must survive,
            # or the sweep cannot read what the child was asked to do.
            "id": "recA8",
            "createdTime": "2026-08-13T04:45:00.000Z",
            "cellValuesByFieldId": {
                ACTIVITY_FIELDS["session_id"]: "doc-workshop-proposer--20260812T0931Z--b1",
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Open Ended"},
                ACTIVITY_FIELDS["user_message"]: "Draft the Ruth Steward pack for challenge.",
                ACTIVITY_FIELDS["turn_started"]: "2026-08-13T04:45:00.000Z",
            },
        },
    ]
    digest = build_digest(
        sessions=sessions, activity=activity,
        window_start=window_start, window_end=window_end,
    )
    assert digest["activity_count"] == 8, digest
    assert digest["skipped_session_end"] == 1, digest
    assert digest["skipped_open_ended"] == 1, digest
    assert digest["blocked_count"] == 1, digest
    assert digest["human_turn_count"] == 3, digest
    assert digest["exchange_count"] == 4, digest
    # The ticket is readable, and kept out of the human-narrative lane.
    assert digest["dispatch_ticket_count"] == 1, digest
    ticket_lines = [row["summary"] for row in digest["dispatch_tickets"]]
    assert ticket_lines == ["Draft the Ruth Steward pack for challenge."], digest["dispatch_tickets"]
    assert "Draft the Ruth Steward pack for challenge." not in [
        row["summary"] for row in digest["human_turns"]
    ], digest["human_turns"]
    proposer = next(row for row in digest["by_agent"] if row["slug"] == "doc-workshop-proposer")
    assert proposer["dispatch_ticket_count"] == 1, proposer
    slugs = {row["slug"] for row in digest["by_agent"]}
    assert slugs == {
        "kate",
        "clive-man-context-auditor",
        "doc-workshop-proposer",
        "clive-man-activity-intake-cursor",
    }, slugs
    kate = next(row for row in digest["by_agent"] if row["slug"] == "kate")
    assert kate["actions"] == ["Opened PR #139"], kate
    assert kate["human_turns"] == [], kate
    human_lines = [row["summary"] for row in digest["human_turns"]]
    assert "Matthew approved Ruth Steward Phase B." in human_lines, digest["human_turns"]
    assert "Asked for an uncapped intake run; 142 V1 rows written." in human_lines
    assert "Try now" in human_lines, digest["human_turns"]
    ruth = next(row for row in digest["human_turns"] if "Ruth Steward" in row["summary"])
    assert ruth["line_source"] == "ai_turn_summary", ruth
    assert "Approved: build Ruth Steward" in ruth["user_ask"], ruth
    try_now = next(row for row in digest["human_turns"] if row["summary"] == "Try now")
    assert try_now["line_source"] == "user_message", try_now
    assert digest["line_source_counts"]["ai_turn_summary"] == 2, digest["line_source_counts"]
    assert digest["line_source_counts"]["user_message"] == 2, digest["line_source_counts"]
    assert digest["line_source_counts"]["summary"] == 2, digest["line_source_counts"]
    assert digest["user_turn_counts"]["Decision"] == 2, digest["user_turn_counts"]
    assert digest["user_turn_counts"]["Brief"] == 1, digest["user_turn_counts"]
    # Human rows must not also appear as mechanical agent actions.
    notable_lines = [row["summary"] for row in digest["notable"]]
    assert "Matthew approved Ruth Steward Phase B." not in notable_lines
    clipped, source, ask, _reply = _turn_line({
        ACTIVITY_FIELDS["user_message"]: "x" * 400,
    })
    assert source == "user_message"
    assert clipped.endswith("…")
    assert len(clipped) == TEXT_CLIP
    assert len(ask) == TEXT_CLIP
    assert slug_from_session_id("clive-man-context-auditor--20260813T0300Z--q7") == (
        "clive-man-context-auditor"
    )
    reports = [
        {
            "id": "recR1",
            "createdTime": "2026-08-12T19:26:27.000Z",
            "cellValuesByFieldId": {
                REPORTS_FIELDS["title"]: "Ward Round 17 — 12 August 2026",
                REPORTS_FIELDS["report_type"]: {"name": "Ward Round"},
                REPORTS_FIELDS["agent_slug"]: "dr-halvard-bjornson",
                REPORTS_FIELDS["headline"]: "Moderate window; overflow did not repeat",
                REPORTS_FIELDS["period_end"]: "2026-08-12",
            },
        },
        {
            "id": "recR2",
            "createdTime": "2026-08-13T05:28:38.000Z",
            "cellValuesByFieldId": {
                REPORTS_FIELDS["title"]: "Daily change summary — 13 Aug 2026",
                REPORTS_FIELDS["report_type"]: {"name": "Handoff"},
                REPORTS_FIELDS["agent_slug"]: OWN_SLUG,
                REPORTS_FIELDS["headline"]: "Inaugural filing",
            },
        },
        {
            "id": "recR3",
            "createdTime": "2026-08-10T07:04:22.000Z",
            "cellValuesByFieldId": {
                REPORTS_FIELDS["title"]: "Weekly Ledger — 10 Aug 2026",
                REPORTS_FIELDS["report_type"]: {"name": "Spend Digest"},
                REPORTS_FIELDS["agent_slug"]: "horace-farthing",
                REPORTS_FIELDS["headline"]: "Old ledger outside window",
            },
        },
    ]
    index = build_reports_index(
        reports, window_start=window_start, window_end=window_end,
    )
    assert index["filed_count"] == 2, index
    assert len(index["standing"]) == 1, index
    assert index["standing"][0]["title"].startswith("Ward Round 17"), index
    assert "body" not in index["standing"][0]
    assert len(index["prior_self"]) == 1, index
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
    reports = fetch_table(token, REPORTS_TABLE, list(REPORTS_FIELDS.values()), window_start)
    digest = build_digest(
        sessions=sessions,
        activity=activity,
        window_start=window_start,
        window_end=window_end,
    )
    digest["reports"] = build_reports_index(
        reports, window_start=window_start, window_end=window_end,
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
