#!/usr/bin/env python3
"""Clive's Man Activity Intake v0.1 — Household Activity → V1 Proposed.

Reads Sessions + Activity via HOUSEHOLD_ACTIVITY_READ; creates V1 Context Amendment
Version rows via AMBIENT_V1_CREATE (UNVERIFIED until minted). Actor:
clive-man-activity-intake-hyperagent. Checkpoint stream:
household-activity:activity:clive-man-activity-intake:v1 with runtime lease interlock.

Does NOT read or advance legacy thread stream
hyperagent:eligible-threads:clive-man-ambient-capture:v1.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

from household_activity_config import (
    ACT,
    ACTOR_HYPERAGENT,
    ACTION_CLASS,
    AMENDMENT_VERSIONS_TABLE,
    AV,
    BACKOFF_SECONDS,
    CAP_FAIL,
    CAP_FIRST_LIVE,
    CAP_STEADY,
    CAPTURE_SOURCE_CHAT,
    CHECKPOINT_APPEND_CRED_ENV,
    CHECKPOINT_TABLE,
    CHUNK_SIZE,
    CP,
    CP_BACKLOG,
    CP_BACKLOG_NAME,
    CP_EVENT_TYPE,
    CP_EVENT_TYPE_NAME,
    CP_STREAM_STATE,
    CP_STREAM_STATE_NAME,
    CRED_ROLE_CHECKPOINT_APPEND,
    CRED_ROLE_GET_TABLES,
    CRED_ROLE_POST_TABLES,
    CRED_ROLE_READ,
    CRED_ROLE_V1_CREATE,
    DEFAULT_LEASE_MINUTES,
    DEFAULT_RUNTIME_OWNER,
    DRAFT_TRUTH_TABLE,
    EXCLUDED_AGENT_SLUGS,
    EXCLUDED_EVENT_TYPES,
    EXECUTOR_ADAPTER_VERSION,
    FIRST_LIVE_COMPLETE_ENV,
    FORBIDDEN_WORKSHOP_TABLES,
    HA,
    HOUSEHOLD_BASE_ID,
    LEGACY_THREAD_STREAM_KEY,
    MAX_429_RETRIES,
    READ_CRED_ENV,
    REQUIRED_CANDIDATE_KEYS,
    SEMANTIC_AFTER_KEYS,
    SESSIONS_TABLE,
    STREAM_KEY,
    V1_STAGE,
    V1_VERDICT,
    WORKSHOP_BASE_ID,
    WRITE_CRED_ENV,
)
from household_activity_read import (
    activity_event_type,
    activity_reply_digest,
    activity_session_record_id,
    activity_user_message,
    enforce_read_path,
    list_activity,
    list_sessions,
    session_agent_slug,
)

API = "https://api.airtable.com/v0"


class IntakeError(Exception):
    pass


class LeaseHeld(IntakeError):
    pass


class CheckpointBlocked(IntakeError):
    pass


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _iso_utc(dt: datetime | None = None) -> str:
    dt = dt or _utc_now()
    return dt.replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")


def _table_from_path(path: str, base_id: str) -> str | None:
    parts = path.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == base_id.lstrip("/"):
        return parts[1].split("?")[0]
    return None


def _enforce_path_for_role(method: str, path: str, credential_role: str) -> None:
    base_id = HOUSEHOLD_BASE_ID if credential_role == CRED_ROLE_READ else WORKSHOP_BASE_ID
    table = _table_from_path(path, base_id)
    if credential_role == CRED_ROLE_READ:
        enforce_read_path(method, path)
        return
    if method not in ("GET", "POST"):
        raise IntakeError(f"forbidden HTTP method {method!r} for role {credential_role}")
    if not table:
        return
    forbidden = FORBIDDEN_WORKSHOP_TABLES
    if table in forbidden:
        raise IntakeError(f"forbidden table {table!r} for role {credential_role}")
    if method == "GET":
        allowed = CRED_ROLE_GET_TABLES.get(credential_role, frozenset())
        if table not in allowed:
            raise IntakeError(f"role {credential_role} may not GET {table!r}")
    elif method == "POST":
        allowed = CRED_ROLE_POST_TABLES.get(credential_role, frozenset())
        if table not in allowed:
            raise IntakeError(f"role {credential_role} may not POST {table!r}")


def _token_for_role(credential_role: str) -> str:
    env_map = {
        CRED_ROLE_READ: READ_CRED_ENV,
        CRED_ROLE_V1_CREATE: WRITE_CRED_ENV,
        CRED_ROLE_CHECKPOINT_APPEND: CHECKPOINT_APPEND_CRED_ENV,
    }
    env_name = env_map.get(credential_role)
    if not env_name:
        raise IntakeError(f"unknown credential role {credential_role!r}")
    tok = os.environ.get(env_name, "")
    if not tok:
        raise IntakeError(f"credential {env_name} not present (UNVERIFIED until minted)")
    return tok


def airtable_request(
    method: str,
    path: str,
    *,
    credential_role: str,
    body: dict[str, Any] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    _enforce_path_for_role(method, path, credential_role)
    if dry_run and method != "GET":
        return {"records": [], "dry_run": True, "method": method, "path": path}
    token = _token_for_role(credential_role)
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    attempt = 0
    while True:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_429_RETRIES:
                time.sleep(BACKOFF_SECONDS[min(attempt, len(BACKOFF_SECONDS) - 1)])
                attempt += 1
                continue
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            if token in detail:
                detail = detail.replace(token, "<redacted>")
            raise IntakeError(
                f"Airtable HTTP {exc.code} on {method} {path} "
                f"(role {credential_role}): {detail}"
            ) from exc


def v1_cap_for_run() -> int:
    if os.environ.get(FIRST_LIVE_COMPLETE_ENV, "").lower() == "true":
        return CAP_STEADY
    return CAP_FIRST_LIVE


def is_excluded_session(session_fields: dict[str, Any]) -> bool:
    slug = session_agent_slug(session_fields)
    return slug in EXCLUDED_AGENT_SLUGS


def is_eligible_exchange_row(
    activity_fields: dict[str, Any],
    session_fields: dict[str, Any] | None,
) -> tuple[bool, str]:
    if session_fields and is_excluded_session(session_fields):
        return False, "excluded_session_agent"
    event_type = activity_event_type(activity_fields)
    if event_type in EXCLUDED_EVENT_TYPES:
        return False, f"excluded_event_type:{event_type}"
    user_msg = activity_user_message(activity_fields)
    reply = activity_reply_digest(activity_fields)
    if not user_msg or not reply:
        return False, "incomplete_exchange"
    return True, "eligible"


def passes_rubric(candidate: dict[str, Any]) -> tuple[bool, str]:
    """Deterministic five-test rubric gate (phase-one heuristic)."""
    title = str(candidate.get("title") or "").strip()
    text = str(candidate.get("canonical_text") or "").strip()
    if len(text) < 20:
        return False, "not_durable"
    if not title:
        return False, "not_actionable"
    if not candidate.get("capture_source_chat_session", "").startswith("rec"):
        return False, "not_attributable"
    conf = candidate.get("confidence")
    if conf is not None and isinstance(conf, (int, float)) and conf < 0.35:
        return False, "low_confidence"
    return True, "passed"


def parse_cursor_token_json(raw: str) -> dict[str, Any]:
    if not raw or not str(raw).strip():
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def check_runtime_lease(
    cursor_token: dict[str, Any],
    *,
    runtime_owner: str = DEFAULT_RUNTIME_OWNER,
    now: datetime | None = None,
) -> tuple[bool, str]:
    """Return (may_proceed, reason). Fresh foreign lease → refuse."""
    now = now or _utc_now()
    owner = str(cursor_token.get("runtime_owner") or "").strip()
    lease_raw = cursor_token.get("lease_until_utc")
    if not owner or owner == runtime_owner:
        return True, "owner_match_or_unset"
    if not lease_raw:
        return True, "foreign_owner_expired_lease_missing"
    try:
        lease_until = datetime.fromisoformat(str(lease_raw).replace("Z", "+00:00"))
        if lease_until.tzinfo is None:
            lease_until = lease_until.replace(tzinfo=timezone.utc)
    except ValueError:
        return True, "invalid_lease_parse_treat_expired"
    if lease_until > now:
        return False, f"lease_held_by_{owner}_until_{lease_raw}"
    return True, "lease_expired"


def build_lease_token(
    *,
    runtime_owner: str = DEFAULT_RUNTIME_OWNER,
    activity_cursor: dict[str, Any] | None = None,
    lease_minutes: int = DEFAULT_LEASE_MINUTES,
) -> dict[str, Any]:
    until = _utc_now() + timedelta(minutes=lease_minutes)
    return {
        "runtime_owner": runtime_owner,
        "lease_until_utc": _iso_utc(until),
        "activity_cursor": activity_cursor or {},
    }


def build_after_payload(candidate: dict[str, Any]) -> dict[str, Any]:
    # Executor CREATE_DRAFT_TRUTH allowlist only. Sessions rec id stays on the
    # candidate / evidence — putting capture_source_chat_session here makes every
    # Cleared V2 fail with forbidden/unknown payload keys.
    payload: dict[str, Any] = {
        "title": candidate["title"],
        "canonical_text": candidate["canonical_text"],
        "brain_slug": candidate["brain_slug"],
        "capture_source": CAPTURE_SOURCE_CHAT,
    }
    for key in ("proposed_category", "brain_theme", "record_type", "horizon"):
        if candidate.get(key):
            payload[key] = candidate[key]
    return payload


def validate_candidate(candidate: dict[str, Any], *, actor: str = ACTOR_HYPERAGENT) -> list[str]:
    errors: list[str] = []
    for key in REQUIRED_CANDIDATE_KEYS:
        val = candidate.get(key)
        if val in (None, "", [], {}):
            errors.append(f"missing {key}")
    chat = candidate.get("capture_source_chat_session")
    if not str(chat or "").startswith("rec"):
        errors.append("capture_source_chat_session must be Sessions rec… id")
    after = candidate.get("after_payload") or build_after_payload(candidate)
    unknown = set(after) - SEMANTIC_AFTER_KEYS
    if unknown:
        errors.append(f"unknown after_payload keys: {sorted(unknown)}")
    if after.get("capture_source") != CAPTURE_SOURCE_CHAT:
        errors.append("after_payload capture_source must be Chat Session")
    if candidate.get("created_by_agent") and candidate.get("created_by_agent") != actor:
        errors.append(f"created_by_agent must be {actor!r}")
    return errors


def validate_manifest(manifest: dict[str, Any], *, actor: str = ACTOR_HYPERAGENT) -> list[str]:
    errors: list[str] = []
    if manifest.get("created_by_agent") != actor:
        errors.append(f"created_by_agent must be {actor!r}")
    if manifest.get("action_class") != ACTION_CLASS:
        errors.append(f"action_class must be {ACTION_CLASS!r}")
    if manifest.get("stage") != V1_STAGE:
        errors.append(f"stage must be {V1_STAGE!r}")
    table = manifest.get("table_id") or manifest.get("write_table_id")
    if table == DRAFT_TRUTH_TABLE:
        errors.append("forbidden direct Draft Brain Truth write")
    if table and table != AMENDMENT_VERSIONS_TABLE:
        errors.append(f"write table must be {AMENDMENT_VERSIONS_TABLE!r}")
    if manifest.get("target_record_id"):
        errors.append("CREATE_DRAFT_TRUTH must not carry target_record_id")
    return errors


def _amendment_version_id(dedupe_key: str, run_id: str) -> str:
    digest = hashlib.sha256(f"{run_id}:{dedupe_key}".encode()).hexdigest()[:12]
    return f"cav-activity-{digest}-v1"


def build_v1_fields(candidate: dict[str, Any], run_id: str, *, actor: str = ACTOR_HYPERAGENT) -> dict[str, Any]:
    dedupe = candidate["dedupe_key"]
    after_payload = candidate.get("after_payload") or build_after_payload(candidate)
    return {
        AV["amendment_version_id"]: _amendment_version_id(dedupe, run_id),
        AV["run_id"]: run_id,
        AV["stage"]: V1_STAGE,
        AV["challenger_verdict"]: V1_VERDICT,
        AV["target_base_id"]: candidate.get("target_base_id") or WORKSHOP_BASE_ID,
        AV["target_table_id"]: candidate.get("target_table_id") or DRAFT_TRUTH_TABLE,
        AV["action_class"]: ACTION_CLASS,
        AV["adapter_version"]: EXECUTOR_ADAPTER_VERSION,
        AV["reason"]: candidate.get("reason") or "Household Activity exchange intake",
        AV["evidence"]: candidate.get("evidence"),
        AV["confidence"]: candidate.get("confidence"),
        AV["v1_report_record_id"]: candidate["v1_report_record_id"],
        AV["tier"]: candidate.get("tier") or "Amber",
        AV["dedupe_key"]: dedupe,
        AV["created_by_agent"]: actor,
        AV["after_payload"]: json.dumps(after_payload, ensure_ascii=False),
    }


def build_candidate_from_activity(
    activity_rec: dict[str, Any],
    session_rec: dict[str, Any] | None,
    *,
    v1_report_record_id: str,
) -> dict[str, Any]:
    if not session_rec:
        raise IntakeError("resolved Sessions row required for activity candidate")
    af = activity_rec.get("fields") or {}
    session_id = session_rec.get("id") or activity_session_record_id(af)
    event_id = str(af.get(ACT["event_id"]) or activity_rec.get("id") or "")
    user_msg = activity_user_message(af)
    reply = activity_reply_digest(af)
    title = (reply[:120] + "…") if len(reply) > 120 else reply
    canonical = f"Exchange evidence from session {session_id}:\nUser: {user_msg}\nReply: {reply}"
    dedupe_key = f"ha-exchange:{session_id}:{event_id}"
    return {
        "title": title or f"Activity exchange {event_id}",
        "canonical_text": canonical,
        "brain_slug": "clive",
        "evidence": json.dumps({"session_id": session_id, "event_id": event_id}, ensure_ascii=False),
        "confidence": 0.75,
        "dedupe_key": dedupe_key,
        "v1_report_record_id": v1_report_record_id,
        "capture_source_chat_session": session_id,
        "created_by_agent": ACTOR_HYPERAGENT,
    }


def filter_eligible_rows(
    sessions: list[dict[str, Any]],
    activity: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    session_by_id = {r["id"]: r for r in sessions if r.get("id")}
    eligible: list[dict[str, Any]] = []
    stats: dict[str, int] = {"scanned": len(activity), "eligible": 0}
    for act in activity:
        af = act.get("fields") or {}
        sid = activity_session_record_id(af)
        session = session_by_id.get(sid) if sid else None
        if not session:
            # Unresolved join: public sessionId only, missing link, or deleted session.
            # Skip so we never pass session=None into build_candidate_from_activity,
            # and so excluded-agent filtering still applies when a Sessions row exists.
            stats["missing_session"] = stats.get("missing_session", 0) + 1
            continue
        ok, reason = is_eligible_exchange_row(af, session.get("fields") or {})
        if not ok:
            stats[reason] = stats.get(reason, 0) + 1
            continue
        eligible.append({"activity": act, "session": session, "reason": reason})
        stats["eligible"] += 1
    return eligible, stats


def list_existing_by_dedupe(dedupe_keys: set[str], *, dry_run: bool) -> dict[str, str] | None:
    """Return existing dedupe_key → record id.

    Dry-run skips the lookup (empty map). Live runs require the checkpoint pen for
    workshop GETs; without it return None so callers refuse create rather than
    silently duplicating V1 rows.
    """
    if dry_run or not dedupe_keys:
        return {}
    # AMBIENT_V1_CREATE is POST-only; workshop GETs use the checkpoint pen when minted.
    if not os.environ.get(CHECKPOINT_APPEND_CRED_ENV, ""):
        return None
    found: dict[str, str] = {}
    offset = None
    while True:
        q = f"/{WORKSHOP_BASE_ID}/{AMENDMENT_VERSIONS_TABLE}?pageSize=100&returnFieldsByFieldId=true"
        q += f"&fields[]={AV['dedupe_key']}"
        if offset:
            q += f"&offset={offset}"
        res = airtable_request(
            "GET", q, credential_role=CRED_ROLE_CHECKPOINT_APPEND, dry_run=False
        )
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            dk = f.get(AV["dedupe_key"])
            if dk in dedupe_keys:
                found[dk] = rec.get("id", "")
        offset = res.get("offset")
        if not offset:
            break
    return found


def create_batch(records: list[dict[str, Any]], *, dry_run: bool) -> dict[str, Any]:
    if not records:
        return {"records": [], "created": 0}
    path = f"/{WORKSHOP_BASE_ID}/{AMENDMENT_VERSIONS_TABLE}"
    body = {"records": [{"fields": r} for r in records], "typecast": False}
    if dry_run:
        return {
            "records": [{"id": f"recDRY{i}", "fields": r} for i, r in enumerate(records)],
            "created": len(records),
            "dry_run": True,
        }
    return airtable_request(
        "POST", path, credential_role=CRED_ROLE_V1_CREATE, body=body, dry_run=False
    )


def process_candidates(
    candidates: list[dict[str, Any]],
    *,
    run_id: str,
    dry_run: bool = False,
    actor: str = ACTOR_HYPERAGENT,
) -> dict[str, Any]:
    cap = v1_cap_for_run()
    written: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []
    requeued: list[dict[str, Any]] = []
    failures = 0
    stop_reason: str | None = None

    dedupe_keys = {c["dedupe_key"] for c in candidates if c.get("dedupe_key")}
    existing = list_existing_by_dedupe(dedupe_keys, dry_run=dry_run)
    if existing is None:
        # Live create without dedupe would duplicate V1 rows on every re-run.
        return {
            "written": [],
            "written_count": 0,
            "skipped": [
                {"candidate": c, "reason": "dedupe_unavailable"} for c in candidates
            ],
            "skipped_count": len(candidates),
            "requeued": [],
            "requeued_count": 0,
            "cap": cap,
            "stop_reason": "dedupe_unavailable",
            "complete": False,
        }

    for item in candidates:
        if len(written) >= cap:
            stop_reason = "cap_reached"
            requeued.append({"candidate": item, "reason": stop_reason})
            continue
        if stop_reason:
            requeued.append({"candidate": item, "reason": stop_reason})
            continue

        working = dict(item)
        cand_errs = validate_candidate(working, actor=actor)
        if cand_errs:
            skipped.append({"candidate": working, "errors": cand_errs})
            continue

        rubric_ok, rubric_reason = passes_rubric(working)
        if not rubric_ok:
            skipped.append({"candidate": working, "reason": rubric_reason})
            continue

        dk = working["dedupe_key"]
        if dk in existing:
            skipped.append({"candidate": working, "reason": "dedupe_existing"})
            continue

        manifest = {
            "stage": V1_STAGE,
            "action_class": ACTION_CLASS,
            "created_by_agent": actor,
            "adapter_version": EXECUTOR_ADAPTER_VERSION,
            "table_id": AMENDMENT_VERSIONS_TABLE,
            "dedupe_key": dk,
            "after_payload": build_after_payload(working),
        }
        manifest_errs = validate_manifest(manifest, actor=actor)
        if manifest_errs:
            skipped.append({"candidate": working, "errors": manifest_errs})
            continue

        fields = build_v1_fields(working, run_id, actor=actor)
        try:
            res = create_batch([fields], dry_run=dry_run)
            recs = res.get("records") or []
            if len(recs) < 1:
                failures += 1
                requeued.append({"candidate": working, "reason": "short_post"})
                if failures >= CAP_FAIL:
                    stop_reason = "failure_cap"
                continue
            written.append({"dedupe_key": dk, "record_id": recs[0].get("id"), "fields": fields})
            existing[dk] = recs[0].get("id", "")
        except IntakeError as exc:
            failures += 1
            requeued.append({"candidate": working, "reason": str(exc)})
            if failures >= CAP_FAIL:
                stop_reason = "failure_cap"

    return {
        "written": written,
        "written_count": len(written),
        "skipped": skipped,
        "skipped_count": len(skipped),
        "requeued": requeued,
        "requeued_count": len(requeued),
        "cap": cap,
        "stop_reason": stop_reason,
        "complete": stop_reason is None and not requeued,
    }


def _field_text(fields: dict[str, Any], key: str) -> str:
    return str(fields.get(CP[key]) or "")


def _semantic_from_checkpoint_fields(fields: dict[str, Any]) -> dict[str, Any]:
    event_type_id = str(fields.get(CP["event_type"]) or "")
    if isinstance(fields.get(CP["event_type"]), dict):
        event_type_id = str(fields[CP["event_type"]].get("id") or "")
    stream_state_id = str(fields.get(CP["stream_state"]) or "")
    if isinstance(fields.get(CP["stream_state"]), dict):
        stream_state_id = str(fields[CP["stream_state"]].get("id") or "")
    backlog_id = str(fields.get(CP["backlog_measurement"]) or "")
    if isinstance(fields.get(CP["backlog_measurement"]), dict):
        backlog_id = str(fields[CP["backlog_measurement"]].get("id") or "")
    return {
        "checkpoint_event_id": _field_text(fields, "checkpoint_event_id"),
        "stream_key": _field_text(fields, "stream_key"),
        "revision": fields.get(CP["revision"]),
        "event_type": CP_EVENT_TYPE_NAME.get(event_type_id, event_type_id),
        "stream_state": CP_STREAM_STATE_NAME.get(stream_state_id, stream_state_id),
        "previous_event_id": _field_text(fields, "previous_event_id"),
        "cursor_utc": _field_text(fields, "cursor_utc"),
        "cursor_token_json": _field_text(fields, "cursor_token_json"),
        "observed_through_utc": _field_text(fields, "observed_through_utc"),
        "backlog_measurement": CP_BACKLOG_NAME.get(backlog_id, backlog_id),
        "run_id": _field_text(fields, "run_id"),
    }


def read_stream_tip(
    stream_key: str = STREAM_KEY,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    if stream_key == LEGACY_THREAD_STREAM_KEY:
        raise IntakeError("legacy thread stream is out of bounds for Activity Intake")
    # Checkpoint pen is optional for this build (first-live = read + V1 create only).
    # Without it, proceed with an empty tip so lease check allows the run.
    if dry_run or not os.environ.get(CHECKPOINT_APPEND_CRED_ENV, ""):
        return {
            "stream_key": stream_key,
            "tip_revision": -1,
            "tip_semantic": {},
            "cursor_token": {},
        }
    rows: list[dict[str, Any]] = []
    offset = None
    while True:
        q = f"/{WORKSHOP_BASE_ID}/{CHECKPOINT_TABLE}?pageSize=100&returnFieldsByFieldId=true"
        for fid in CP.values():
            q += f"&fields[]={fid}"
        if offset:
            q += f"&offset={offset}"
        res = airtable_request(
            "GET", q, credential_role=CRED_ROLE_CHECKPOINT_APPEND, dry_run=dry_run
        )
        for rec in res.get("records") or []:
            f = rec.get("fields") or {}
            if _field_text(f, "stream_key") == stream_key:
                rows.append(rec)
        offset = res.get("offset")
        if not offset:
            break
    if not rows:
        return {
            "stream_key": stream_key,
            "tip_revision": -1,
            "tip_semantic": {},
            "cursor_token": {},
        }
    tip = max(rows, key=lambda r: int((r.get("fields") or {}).get(CP["revision"]) or 0))
    sem = _semantic_from_checkpoint_fields(tip.get("fields") or {})
    cursor = parse_cursor_token_json(sem.get("cursor_token_json") or "")
    return {
        "stream_key": stream_key,
        "tip_revision": sem.get("revision"),
        "tip_event_id": sem.get("checkpoint_event_id"),
        "tip_semantic": sem,
        "tip_record_id": tip.get("id"),
        "cursor_token": cursor,
    }


def assert_legacy_stream_untouched() -> None:
    """Guardrail: Activity Intake must never target the legacy thread stream key."""
    if STREAM_KEY == LEGACY_THREAD_STREAM_KEY:
        raise IntakeError("stream key collision with legacy thread intake")


def run_intake(
    *,
    run_id: str,
    v1_report_record_id: str,
    dry_run: bool = False,
    runtime_owner: str = DEFAULT_RUNTIME_OWNER,
) -> dict[str, Any]:
    assert_legacy_stream_untouched()
    tip = read_stream_tip(dry_run=dry_run)
    cursor = tip.get("cursor_token") or {}
    may_proceed, lease_reason = check_runtime_lease(cursor, runtime_owner=runtime_owner)
    if not may_proceed:
        raise LeaseHeld(lease_reason)

    sessions = list_sessions(dry_run=dry_run)
    activity = list_activity(dry_run=dry_run)
    pairs, stats = filter_eligible_rows(sessions, activity)

    candidates: list[dict[str, Any]] = []
    for pair in pairs:
        cand = build_candidate_from_activity(
            pair["activity"],
            pair["session"],
            v1_report_record_id=v1_report_record_id,
        )
        candidates.append(cand)

    result = process_candidates(candidates, run_id=run_id, dry_run=dry_run)
    return {
        "run_id": run_id,
        "actor": ACTOR_HYPERAGENT,
        "stream_key": STREAM_KEY,
        "lease": {"proceed": may_proceed, "reason": lease_reason},
        "stats": stats,
        "intake": result,
        "legacy_stream": LEGACY_THREAD_STREAM_KEY,
        "legacy_stream_touched": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Clive's Man Activity Intake v0.1")
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--v1-report-record-id", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json-only", action="store_true")
    args = parser.parse_args()

    try:
        out = run_intake(
            run_id=args.run_id,
            v1_report_record_id=args.v1_report_record_id,
            dry_run=args.dry_run,
        )
    except (IntakeError, LeaseHeld, CheckpointBlocked) as exc:
        err = {"error": type(exc).__name__, "message": str(exc), "actor": ACTOR_HYPERAGENT}
        print(json.dumps(err, ensure_ascii=False, indent=2))
        return 1

    if args.json_only:
        print(json.dumps(out, ensure_ascii=False, indent=2))
    else:
        print(
            json.dumps(
                {
                    "written": out["intake"]["written_count"],
                    "skipped": out["intake"]["skipped_count"],
                    "cap": out["intake"]["cap"],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
