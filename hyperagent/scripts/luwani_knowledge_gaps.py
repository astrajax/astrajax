#!/usr/bin/env python3
"""Luwani weekly knowledge-gap helper.

Read-only over Household Activity. Does not write Human Quality, Review Status,
Agent Quality, or Activity content. Builds a compact evidence pack the weekly
run uses to compare what Matthew *did* against what his stored role actually
needs (citizen-builder, not developer know-how).

Usage:
  python3 hyperagent/scripts/luwani_knowledge_gaps.py --hours 168
  python3 hyperagent/scripts/luwani_knowledge_gaps.py --hours 168 --out /tmp/gaps.json
  python3 hyperagent/scripts/luwani_knowledge_gaps.py --self-test

Credential (GET, first match): HOUSEHOLD_ACTIVITY_READ, FLEET_ACTIVITY_REVIEW,
FLEET_ACTIVITY_WRITE, HOUSEHOLD_ACTIVITY_WRITE_TOKEN, AIRTABLE_WRITE_TOKEN,
AIRTABLE_API_KEY — then the same keys in gitignored `.env` / `website/.env.local`.
A write-only PAT may 403; in that case exit 2 and use Airtable MCP instead.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

BASE_ID = "appF7jQD4ZKrDC7e1"
API = "https://api.airtable.com/v0"
ACTIVITY_TABLE = "tblNxNLyC31KDQbRl"
REPORTS_TABLE = "tblFzWUIPSiIGZPln"
OWN_SLUG = "luwani"
MAX_GAPS = 3
MIN_EVIDENCE = 2
LOW_SCORE = 3
TEXT_CLIP = 220

ACTIVITY_FIELDS = {
    "summary": "fldoVtBIAKanaafMg",
    "event_id": "fldxIVVOp7VvfVQ5j",
    "session_id": "fldz1skahzUvg1vzX",
    "user_turn_type": "fldTCd93XF8XhsVoZ",
    "agent_turn_type": "fldvskIDzutu4JzQt",
    "user_message": "fldzSTdm15GQf88Ph",
    "ai_turn_summary": "fldwmWz6k1ws9TpmP",
    "turn_started": "fldXoctP5BTnzYsAP",
    "human_quality": "fldlKDwCGDAj6fah5",
    "review_status": "fldCtTcdklAcDa9tW",
}
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
    "FLEET_ACTIVITY_REVIEW",
    "FLEET_ACTIVITY_WRITE",
    "HOUSEHOLD_ACTIVITY_WRITE_TOKEN",
    "AIRTABLE_WRITE_TOKEN",
    "AIRTABLE_API_KEY",
)
ENV_FILES = (".env", "website/.env.local")

# Citizen-builder NEED. Labels are for the report, not Airtable writes.
NEED_TOPICS: dict[str, dict[str, Any]] = {
    "craft_context": {
        "label": "Context before you start",
        "letter": "C",
        "need": "The agent needs the facts it cannot guess before it begins.",
        "keywords": ("context", "background", "what you need to know", "here's the situation"),
    },
    "craft_role_read": {
        "label": "Role and the read you want",
        "letter": "R",
        "need": "Name the perspective — sceptical, customer, operator — or you get agreeable mush.",
        "keywords": ("sceptical", "skeptical", "pam check", "read this as", "as a customer"),
    },
    "craft_action": {
        "label": "One ask, with a boundary",
        "letter": "A",
        "need": "A tight, single-purpose ask with what is in and out of scope.",
        "keywords": ("just do", "build", "fix", "don't", "do not", "scope", "only"),
    },
    "craft_format": {
        "label": "Show the shape you want",
        "letter": "F",
        "need": "The shape of the answer, and one pasted example of good, beats a paragraph of description.",
        "keywords": ("format", "for example", "like this", "one-pager", "plain english"),
    },
    "converse": {
        "label": "Steer one thing at a time",
        "letter": "CONVERSE",
        "need": "Mid-thread: correct the assumption, not the whole output; one correction per turn.",
        "keywords": ("try again", "no that's not", "that's not what i meant", "do it again"),
    },
    "capture": {
        "label": "Leave a handover, not a chat log",
        "letter": "CAPTURE",
        "need": "Bank the conclusion for the next thread or the brain — not the conversation.",
        "keywords": ("log this", "capture", "file this", "handover", "for the next thread", "paper trail"),
    },
    "trinity_gates": {
        "label": "Propose, you approve, then execute",
        "letter": None,
        "need": "Agents propose; you keep judgement. Red work is a decision, not a silent build.",
        "keywords": ("approve", "green go", "just ship", "don't ask", "red", "pam", "trinity"),
    },
    "runtime_vs_brain": {
        "label": "Where the work lives",
        "letter": None,
        "need": "Cursor / HyperAgent / a scheduled run vs stored context in the brains. Different rooms, different jobs.",
        "keywords": ("hyperagent", "cursor", "grok bot", "brain", "trusted", "workshop"),
    },
    "briefing": {
        "label": "How to brief an agent",
        "letter": None,
        "need": "A citizen-builder brief: who, what, boundary, done-when — not a technical ticket.",
        "keywords": ("brief", "@doc", "@clive", "dispatch", "can you make"),
    },
    "model_routing": {
        "label": "Which kind of thinking this is",
        "letter": None,
        "need": "Chair-level: thinking vs building vs grind. Not developer model-picking, not Horace's spend ledger.",
        "keywords": ("which model", "use grok", "use claude", "use opus", "too expensive", "frontier"),
    },
    "context_hygiene": {
        "label": "What to put in the brain",
        "letter": None,
        "need": "Conclusions and decisions belong in stored context; chat dumps do not.",
        "keywords": ("remember this", "add to the brain", "canonical", "draft truth"),
    },
}

EXCLUDED_PATTERNS = (
    re.compile(r"\btypescript\b", re.I),
    re.compile(r"\bplaywright\b", re.I),
    re.compile(r"\beslint\b", re.I),
    re.compile(r"\bcss\b", re.I),
    re.compile(r"\btsx\b", re.I),
    re.compile(r"\bgit rebase\b", re.I),
    re.compile(r"\bmerge conflict\b", re.I),
    re.compile(r"\bunit test\b", re.I),
    re.compile(r"\bpytest\b", re.I),
    re.compile(r"\bvitest\b", re.I),
    re.compile(r"\bnpm run\b", re.I),
    re.compile(r"\bwebpack\b", re.I),
    re.compile(r"\bdocker\b", re.I),
    re.compile(r"\bfield id\b", re.I),
    re.compile(r"\bfld[A-Za-z0-9]{14}\b"),
    re.compile(r"\btbl[A-Za-z0-9]{14}\b"),
)

HOUSEHOLD_OPERATOR = {
    "user_label": "Matthew",
    "archetype": "Founder",
    "primary_function": "Sales",
    "role_domain": "Commercial founder",
    "citizen_builder": True,
    "source": "fallback-household",
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


def _number(value: Any) -> float | None:
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value))
    except ValueError:
        return None


DISPATCH_BRIEF_RE = re.compile(
    r"^\s*you are\s+[A-Za-z].{0,80}?(?:\.|,|\n)",
    re.I,
)


def is_dispatch_brief(text: str) -> bool:
    """Agent-authored Route 1 / Task briefs sit in User Message. Not Matthew's craft."""
    if not text:
        return False
    head = text.strip()[:240]
    lowered = head.lower()
    if DISPATCH_BRIEF_RE.match(head):
        return True
    if lowered.startswith("follow agents/registry/"):
        return True
    if lowered.startswith("route 1"):
        return True
    body = text.lower()
    if "## goal" in body and "## provenance" in body:
        return True
    return False


def is_developer_knowhow(text: str) -> bool:
    """True when the ask is developer craft Matthew has said he does not need."""
    if not text:
        return False
    return any(pattern.search(text) for pattern in EXCLUDED_PATTERNS)


def need_topics_for_operator(profile: dict[str, Any] | None) -> list[str]:
    """Standing NEED for a citizen-builder Architect.

    Founder + commercial/sales always gets the CRAFT flywheel plus the
    chair-level operating topics. Developer topics are never in this list.
    """
    data = dict(HOUSEHOLD_OPERATOR)
    if profile:
        data.update({k: v for k, v in profile.items() if v not in (None, "")})
    topics = [
        "briefing",
        "craft_action",
        "craft_context",
        "craft_format",
        "craft_role_read",
        "converse",
        "capture",
        "trinity_gates",
        "runtime_vs_brain",
        "context_hygiene",
    ]
    if data.get("citizen_builder", True):
        topics.append("model_routing")
    # Function leaders still need briefing + gates; sales/founder adds no extra
    # engineering curriculum.
    return topics


def tag_turn(text: str) -> list[str]:
    """Keyword tags only — the weekly run still judges. Empty is allowed."""
    if not text or is_developer_knowhow(text):
        return []
    lowered = text.lower()
    hits: list[str] = []
    for topic_id, spec in NEED_TOPICS.items():
        if any(key in lowered for key in spec["keywords"]):
            hits.append(topic_id)
    return hits


def _cells(record: dict[str, Any]) -> dict[str, Any]:
    return record.get("cellValuesByFieldId") or record.get("fields") or {}


def human_turns_from_activity(
    activity: list[dict[str, Any]],
    *,
    window_start: dt.datetime,
    window_end: dt.datetime,
) -> list[dict[str, Any]]:
    """Human-authored turns in the window. Mechanical ticks are skipped."""
    turns: list[dict[str, Any]] = []
    for record in activity:
        fields = _cells(record)
        started = _parse_iso(
            str(fields.get(ACTIVITY_FIELDS["turn_started"]) or record.get("createdTime") or "")
        )
        if started is None or started < window_start or started > window_end:
            continue
        user_message = _plain_text(fields.get(ACTIVITY_FIELDS["user_message"]))
        if not user_message:
            continue
        agent_turn = _choice_name(fields.get(ACTIVITY_FIELDS["agent_turn_type"]))
        if agent_turn == "Session End":
            continue
        user_turn = _choice_name(fields.get(ACTIVITY_FIELDS["user_turn_type"]))
        line = _ai_text(fields.get(ACTIVITY_FIELDS["ai_turn_summary"])) or _clip(user_message)
        blob = f"{user_message} {line}"
        turns.append({
            "record_id": record.get("id") or "",
            "started": started.isoformat(),
            "user_turn_type": user_turn,
            "user_ask": _clip(user_message),
            "line": _clip(line),
            "human_quality": _number(fields.get(ACTIVITY_FIELDS["human_quality"])),
            "review_status": _choice_name(fields.get(ACTIVITY_FIELDS["review_status"])),
            "developer_knowhow": is_developer_knowhow(blob),
            "dispatch_brief": is_dispatch_brief(user_message),
            "topics": [] if is_dispatch_brief(user_message) else tag_turn(blob),
        })
    return turns


def select_gaps(
    turns: list[dict[str, Any]],
    *,
    need_topics: list[str],
    min_evidence: int = MIN_EVIDENCE,
    max_gaps: int = MAX_GAPS,
    low_score: float = LOW_SCORE,
) -> list[dict[str, Any]]:
    """Pattern-level gaps only. One messy question is not a gap.

    A topic becomes a candidate when it is in NEED *and* this week's activity
    actually touched it, *and* there is a cluster: at least `min_evidence`
    turns, or a low Human Quality mean across two or more scored turns.
    Developer-knowhow turns never count.
    """
    need_set = set(need_topics)
    buckets: dict[str, list[dict[str, Any]]] = {topic: [] for topic in need_topics}
    for turn in turns:
        if turn.get("developer_knowhow") or turn.get("dispatch_brief"):
            continue
        matched = [topic for topic in turn.get("topics") or [] if topic in need_set]
        if not matched:
            continue
        for topic in matched:
            buckets[topic].append(turn)

    candidates: list[dict[str, Any]] = []
    for topic, rows in buckets.items():
        if not rows:
            continue
        scored = [row for row in rows if row.get("human_quality") is not None]
        mean = (
            round(sum(row["human_quality"] for row in scored) / len(scored), 2)
            if scored else None
        )
        low_cluster = mean is not None and mean <= low_score and len(scored) >= min_evidence
        volume_cluster = len(rows) >= min_evidence
        # Isolated high-quality asks are competence, not a gap.
        if not low_cluster and not volume_cluster:
            continue
        if mean is not None and mean >= 4.5 and not low_cluster:
            # Strong scores: only keep if the cluster is a repair/converse pile-up.
            if topic != "converse" or len(rows) < 3:
                continue
        spec = NEED_TOPICS[topic]
        candidates.append({
            "topic": topic,
            "label": spec["label"],
            "letter": spec["letter"],
            "need": spec["need"],
            "evidence_count": len(rows),
            "scored_count": len(scored),
            "mean_human_quality": mean,
            "review_status_counts": _count_key(rows, "review_status"),
            "examples": [
                {
                    "user_ask": row["user_ask"],
                    "human_quality": row["human_quality"],
                    "user_turn_type": row["user_turn_type"],
                }
                for row in rows[:3]
            ],
        })

    candidates.sort(
        key=lambda item: (
            -(item["evidence_count"]),
            item["mean_human_quality"] if item["mean_human_quality"] is not None else 9,
        )
    )
    return candidates[:max_gaps]


def _count_key(rows: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        name = str(row.get(key) or "") or "(empty)"
        counts[name] = counts.get(name, 0) + 1
    return counts


def build_pack(
    *,
    turns: list[dict[str, Any]],
    operator: dict[str, Any],
    window_start: dt.datetime,
    window_end: dt.datetime,
    prior_reports: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    need_topics = need_topics_for_operator(operator)
    gaps = select_gaps(turns, need_topics=need_topics)
    scored = [row for row in turns if row.get("human_quality") is not None]
    mean = (
        round(sum(row["human_quality"] for row in scored) / len(scored), 2)
        if scored else None
    )
    return {
        "window_start": window_start.isoformat(),
        "window_end": window_end.isoformat(),
        "operator": {
            "user_label": operator.get("user_label") or HOUSEHOLD_OPERATOR["user_label"],
            "archetype": operator.get("archetype") or "",
            "primary_function": operator.get("primary_function") or "",
            "role_domain": operator.get("role_domain") or "",
            "one_line_remit": operator.get("one_line_remit") or "",
            "source": operator.get("source") or "unknown",
        },
        "need_topics": need_topics,
        "human_turn_count": len(turns),
        "scored_count": len(scored),
        "unreviewed_count": sum(
            1 for row in turns
            if not row.get("review_status") or row.get("review_status") == "Unreviewed"
        ),
        "excluded_developer_count": sum(1 for row in turns if row.get("developer_knowhow")),
        "dispatch_brief_count": sum(1 for row in turns if row.get("dispatch_brief")),
        "mean_human_quality": mean,
        "gaps": gaps,
        "quiet": len(gaps) == 0,
        "prior_luwani_reports": prior_reports or [],
    }


def prior_luwani_index(reports: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for record in reports:
        fields = _cells(record)
        slug = str(fields.get(REPORTS_FIELDS["agent_slug"]) or "")
        if slug != OWN_SLUG:
            continue
        rows.append({
            "record_id": str(record.get("id") or ""),
            "title": str(fields.get(REPORTS_FIELDS["title"]) or ""),
            "headline": str(fields.get(REPORTS_FIELDS["headline"]) or ""),
            "period_end": str(fields.get(REPORTS_FIELDS["period_end"]) or ""),
        })
    return rows[:8]


def _get_page(
    token: str,
    table_id: str,
    field_ids: list[str],
    offset: str | None,
) -> dict[str, Any]:
    params: list[tuple[str, str]] = [
        ("pageSize", "100"),
        ("returnFieldsByFieldId", "true"),
    ]
    for fid in field_ids:
        params.append(("fields[]", fid))
    if offset:
        params.append(("offset", offset))
    query = urllib.parse.urlencode(params)
    url = f"{API}/{BASE_ID}/{table_id}?{query}"
    request = urllib.request.Request(
        url, headers={"Authorization": f"Bearer {token}"}, method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as err:
        if err.code in {401, 403}:
            raise SystemExit(2) from err
        raise


def _paginate(token: str, table_id: str, field_ids: list[str]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        payload = _get_page(token, table_id, field_ids, offset)
        records.extend(payload.get("records") or [])
        offset = payload.get("offset") or None
        if not offset:
            break
        if table_id == REPORTS_TABLE and len(records) >= 100:
            break
    return records


def fetch_window(token: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    activity = _paginate(token, ACTIVITY_TABLE, list(ACTIVITY_FIELDS.values()))
    reports = _paginate(token, REPORTS_TABLE, list(REPORTS_FIELDS.values()))
    return activity, reports


def _self_test() -> None:
    window_start = dt.datetime(2026, 8, 12, tzinfo=dt.timezone.utc)
    window_end = dt.datetime(2026, 8, 19, tzinfo=dt.timezone.utc)
    activity = [
        {
            "id": "rec1",
            "createdTime": "2026-08-15T10:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-15T10:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "Build it, don't ask me again, just ship.",
                ACTIVITY_FIELDS["human_quality"]: 2,
                ACTIVITY_FIELDS["review_status"]: {"name": "Reviewed"},
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Brief"},
                ACTIVITY_FIELDS["ai_turn_summary"]: {
                    "state": "generated",
                    "value": "Asked to skip the approval gate and ship.",
                },
            },
        },
        {
            "id": "rec2",
            "createdTime": "2026-08-16T10:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-16T10:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "Green go — approve the Phase B and execute.",
                ACTIVITY_FIELDS["human_quality"]: 3,
                ACTIVITY_FIELDS["review_status"]: {"name": "Reviewed"},
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Decision"},
            },
        },
        {
            "id": "rec3",
            "createdTime": "2026-08-16T11:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-16T11:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "Can you write the Playwright tests and the CSS?",
                ACTIVITY_FIELDS["human_quality"]: 2,
                ACTIVITY_FIELDS["review_status"]: {"name": "Reviewed"},
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Brief"},
            },
        },
        {
            "id": "rec4",
            "createdTime": "2026-08-17T09:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-17T09:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "What is a merge conflict?",
                ACTIVITY_FIELDS["human_quality"]: None,
                ACTIVITY_FIELDS["review_status"]: {"name": "Unreviewed"},
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Question"},
            },
        },
        {
            "id": "rec5",
            "createdTime": "2026-08-17T12:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-17T12:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "Log this decision for the next thread please.",
                ACTIVITY_FIELDS["human_quality"]: 5,
                ACTIVITY_FIELDS["review_status"]: {"name": "Reviewed"},
                ACTIVITY_FIELDS["user_turn_type"]: {"name": "Brief"},
            },
        },
        {
            "id": "rec6",
            "createdTime": "2026-08-10T12:00:00.000Z",
            "fields": {
                ACTIVITY_FIELDS["turn_started"]: "2026-08-10T12:00:00.000Z",
                ACTIVITY_FIELDS["user_message"]: "Just ship it without asking.",
                ACTIVITY_FIELDS["human_quality"]: 1,
            },
        },
    ]
    turns = human_turns_from_activity(
        activity, window_start=window_start, window_end=window_end,
    )
    assert len(turns) == 5, turns
    assert sum(1 for row in turns if row["developer_knowhow"]) == 2, turns
    pack = build_pack(
        turns=turns,
        operator=HOUSEHOLD_OPERATOR,
        window_start=window_start,
        window_end=window_end,
    )
    gap_topics = [gap["topic"] for gap in pack["gaps"]]
    assert "trinity_gates" in gap_topics, pack["gaps"]
    assert "capture" not in gap_topics, pack["gaps"]
    assert pack["gaps"][0]["evidence_count"] >= 2
    assert pack["excluded_developer_count"] == 2, pack
    assert pack["human_turn_count"] == 5
    # One isolated high-quality Capture is not a gap.
    capture_only = select_gaps(
        [row for row in turns if "capture" in row["topics"]],
        need_topics=["capture"],
    )
    assert capture_only == [], capture_only
    # Developer asks never become NEED gaps.
    assert is_developer_knowhow("please add Playwright coverage")
    assert not is_developer_knowhow("Approve this, then Doc can build.")
    need = need_topics_for_operator({"archetype": "Founder", "primary_function": "Sales"})
    assert "briefing" in need and "trinity_gates" in need
    assert "typescript" not in need
    quiet = select_gaps(
        [{
            "developer_knowhow": False,
            "topics": ["briefing"],
            "human_quality": 5,
            "user_ask": "Please brief Doc on the wall copy.",
            "user_turn_type": "Brief",
            "review_status": "Reviewed",
        }],
        need_topics=["briefing"],
    )
    assert quiet == [], quiet
    print("luwani_knowledge_gaps self-test ok")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hours", type=int, default=168)
    parser.add_argument("--out", default="")
    parser.add_argument("--need-json", default="", help="Optional operator profile JSON file")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    if args.self_test:
        _self_test()
        return 0

    window_end = dt.datetime.now(dt.timezone.utc)
    window_start = window_end - dt.timedelta(hours=args.hours)
    operator = dict(HOUSEHOLD_OPERATOR)
    if args.need_json:
        with open(args.need_json, encoding="utf-8") as handle:
            operator.update(json.load(handle))
            operator["source"] = args.need_json

    token, source = resolve_credential()
    if not token:
        print("no Household Activity read credential; use Airtable MCP", file=sys.stderr)
        return 2
    try:
        activity, reports = fetch_window(token)
    except SystemExit as err:
        if err.code == 2:
            print(f"credential {source} cannot GET; use Airtable MCP", file=sys.stderr)
        raise

    turns = human_turns_from_activity(
        activity, window_start=window_start, window_end=window_end,
    )
    pack = build_pack(
        turns=turns,
        operator=operator,
        window_start=window_start,
        window_end=window_end,
        prior_reports=prior_luwani_index(reports),
    )
    pack["credential_source"] = source
    text = json.dumps(pack, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as handle:
            handle.write(text)
            handle.write("\n")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
