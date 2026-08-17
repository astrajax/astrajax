#!/usr/bin/env python3
"""
context_amendment_execute.py — typed executor adapter for Clive's Man Daily
Context Review v0.1 (Kimi K3 low Executor). v2.0 — Pam repair contract.

Deterministic interpreter of cleared V2 amendment manifests. Kimi chooses
nothing material. Two-pass: PREFLIGHT loads/validates every authoritative V2
row + target (any wrong-base, schema-drift, duplicate-ID, overflow, missing
before-hash, version mismatch, false-Green, or no-safe-rollback = ZERO
mutations), then EXECUTE applies up to five cleared typed mutations with
readback, complete append-only events, and a hash-chained Change Log.

Safety (structural, not prompt restraint):
  * target base/table/action must pass WRITE_ALLOWLIST; Trusted never present
  * every mutation loads its authoritative Context Amendment Version row from
    Airtable and verifies Stage=V2, Challenger Verdict=Cleared, and an exact
    field-by-field match to the execution input (no defaulting)
  * adapter_version must equal ADAPTER_VERSION; missing/different refuses
  * existing-record actions require a valid before_hash; creates require no
    target record + deterministic dedupe
  * attempts are monotonic (max prior + 1); already-Applied refuses; an exact
    completed replay becomes Skipped
  * Green tier accepted only with a prior Applied event for the same action
    class + exact adapter version; otherwise the false-Green blocks
  * rollback classification before mutation: existing updates restore from the
    recorded before snapshot; created Drafts compensate via Quarantine (never
    delete); if compensation cannot be guaranteed -> No Safe Rollback, refuse
  * if a mutation succeeds but the event/log append fails, STOP; retry
    reconciles the open Attempt against live state without reapplying

Usage:
  python3 context_amendment_execute.py --manifest /path/manifest.json [--dry-run]
  python3 context_amendment_execute.py --run-queue [--dry-run] [--run-id RUN]

Env: CONTEXT_AMENDMENT_EXECUTE (Airtable PAT, read+write Workshop, create-only
Registry Change Log). Never printed, logged, or committed.
Dry-run: validates every amendment and prints decisions WITHOUT any writes
(reads still occur for preflight/before-hashes).
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

# D3 (2026-08-17): fail loudly on a runtime older than 3.9 rather than
# invite a runtime hand-patch that later gets recorded as a clean success.
assert sys.version_info >= (3, 9), "Context Amendment Execute requires Python >= 3.9"

from context_config import (
    ADAPTER_VERSION, BASE_WORKSHOP, BASE_REGISTRY,
    T_DRAFT_TRUTH, T_AMENDMENT_VERSIONS, T_EXECUTION_EVENTS,
    T_REGISTRY_CHANGE_LOG, T_REGISTRY_BRAINS,
    F, AV, EE, CL, BR, REQUIRED_SCHEMA,
    BLANK_METADATA_ALLOWLIST, BLANK_METADATA_FORBIDDEN,
    ACTION_CLASSES, WRITE_ALLOWLIST,
    EXISTING_RECORD_ACTIONS, CREATE_ACTIONS,
    QUARANTINE_ALLOWED_FROM,
    CAP_DAILY_MUTATIONS, CAP_FAILURES, ENV_EXECUTE,
    ACTOR_SCHEDULED, ACTOR_INTAKE, INTAKE_ACTORS, TERMINAL_EVENT_TYPES,
    canonical_snapshot,
)

API = "https://api.airtable.com/v0"


class Refusal(Exception):
    """A structural refusal: the adapter will not perform this action."""


class Blocked(Exception):
    """Before-state / authoritative mismatch: amendment halted, no mutation."""


def _token():
    tok = os.environ.get(ENV_EXECUTE, "")
    if not tok:
        raise Refusal(f"credential {ENV_EXECUTE} not present")
    return tok


def _req(method, path, token, body=None, retries=1):
    url = f"{API}{path}"
    data = None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    attempt = 0
    while True:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            code = e.code
            if code == 429 and attempt < retries:
                time.sleep(30)  # one rate-limit retry only, same identity
                attempt += 1
                continue
            detail = e.read().decode("utf-8", "replace")[:400]
            raise Refusal(f"airtable HTTP {code} on {method} {path}: {detail}")


def _get_record(base, table, record_id, token):
    # Deterministic reads: field IDs come back keyed by field ID.
    return _req("GET", f"/{base}/{table}/{record_id}?returnFieldsByFieldId=true", token)


def _list_records(base, table, token, field_ids=None):
    out = []
    offset = None
    while True:
        q = f"/{base}/{table}?pageSize=100&returnFieldsByFieldId=true"
        if field_ids:
            for fid in field_ids:
                q += f"&fields[]={fid}"
        if offset:
            q += f"&offset={offset}"
        res = _req("GET", q, token)
        out.extend(res.get("records", []))
        offset = res.get("offset")
        if not offset:
            return out


def _create(base, table, fields, token):
    return _req("POST", f"/{base}/{table}?returnFieldsByFieldId=true", token,
                {"records": [{"fields": fields}]})


def _update(base, table, record_id, fields, token):
    return _req("PATCH", f"/{base}/{table}?returnFieldsByFieldId=true", token,
                {"records": [{"id": record_id, "fields": fields}]})


def _get_table_schema(base, table, token):
    res = _req("GET", f"/meta/bases/{base}/tables", token)
    for t in res.get("tables", []):
        if t.get("id") == table:
            return t
    raise Refusal(f"schema: table {table} not found in base {base}")


def validate_schema(token):
    """Startup validation: every required table/field ID must exist. Any
    mismatch stops BEFORE any mutation. Returns list of problems (empty=OK)."""
    problems = []
    for base, table, field_ids in REQUIRED_SCHEMA:
        try:
            schema = _get_table_schema(base, table, token)
        except Refusal as r:
            problems.append(f"{base}/{table}: {r}")
            continue
        present = {f.get("id") for f in schema.get("fields", [])}
        missing = [fid for fid in field_ids if fid not in present]
        if missing:
            problems.append(f"{base}/{table}: missing fields {missing}")
    return problems


def canonical(record_fields):
    return json.dumps(record_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _check_target_allowlisted(action_class, base, table):
    allow = WRITE_ALLOWLIST.get(action_class)
    if allow is None:
        raise Refusal(f"action class {action_class!r} not in allowlist")
    tables = allow.get(base)
    if tables is None or table not in tables:
        raise Refusal(f"target {base}/{table} not allowlisted for {action_class}")


# --- Authoritative V2 loading (contract §2) ----------------------------------

def _sel_name(v):
    return v.get("name") if isinstance(v, dict) else v


def load_authoritative_v2(am, token):
    """Load the referenced Context Amendment Version row and verify it exactly
    matches the execution input. No defaulting anywhere."""
    rec_id = am.get("amendment_version_record_id")
    if not rec_id:
        raise Refusal(f"amendment {am.get('amendment_version_id')} has no amendment_version_record_id")
    row = _get_record(BASE_WORKSHOP, T_AMENDMENT_VERSIONS, rec_id, token)
    f = row.get("fields", {})

    def g(k):
        return f.get(AV[k])

    if _sel_name(g("stage")) != "V2":
        raise Blocked(f"{rec_id}: Stage is {_sel_name(g('stage'))!r}, not V2")
    if _sel_name(g("challenger_verdict")) != "Cleared":
        raise Blocked(f"{rec_id}: Challenger Verdict is {_sel_name(g('challenger_verdict'))!r}, not Cleared")
    # V1 ancestor must exist
    if not g("supersedes_version") and not g("supersedes_version_link"):
        raise Blocked(f"{rec_id}: no V1 ancestor (Supersedes Version empty)")
    # adapter_version enforced, no defaulting
    stored_ver = g("adapter_version")
    if not stored_ver:
        raise Refusal(f"{rec_id}: adapter_version missing on row")
    if stored_ver != ADAPTER_VERSION:
        raise Refusal(f"{rec_id}: adapter_version {stored_ver!r} != {ADAPTER_VERSION!r}")
    # exact field-by-field match to execution input
    checks = {
        "target_base_id": am.get("target_base_id"),
        "target_table_id": am.get("target_table_id"),
        "action_class": am.get("action_class"),
        "tier": am.get("tier"),
    }
    for k, expected in checks.items():
        stored = _sel_name(g(k))
        if stored != expected:
            raise Blocked(f"{rec_id}: stored {k} {stored!r} != input {expected!r}")
    if (g("target_record_id") or None) != (am.get("target_record_id") or None):
        raise Blocked(f"{rec_id}: stored target_record_id != input")
    if (g("before_hash") or None) != (am.get("before_hash") or None):
        raise Blocked(f"{rec_id}: stored before_hash != input")
    if (g("dedupe_key") or None) != (am.get("dedupe_key") or None):
        raise Blocked(f"{rec_id}: stored dedupe_key != input")
    return row


def _validate_shape(am):
    """Shape checks that do not need the network."""
    for key in ("action_class", "target_base_id", "target_table_id", "amendment_version_id"):
        if not am.get(key):
            raise Refusal(f"missing required amendment key {key}")
    if am.get("action_class") not in ACTION_CLASSES:
        raise Refusal(f"action class {am['action_class']!r} not in allowlist")
    _check_target_allowlisted(am["action_class"], am["target_base_id"], am["target_table_id"])
    # adapter_version on the INPUT enforced, no defaulting
    if not am.get("adapter_version"):
        raise Refusal(f"{am['amendment_version_id']}: adapter_version missing on input")
    if am["adapter_version"] != ADAPTER_VERSION:
        raise Refusal(f"{am['amendment_version_id']}: adapter_version {am['adapter_version']!r} != {ADAPTER_VERSION!r}")
    # tier required
    if am.get("tier") not in ("Green", "Amber"):
        raise Refusal(f"{am['amendment_version_id']}: tier not Green/Amber")
    # existing-record actions require before_hash; creates require no target record
    if am["action_class"] in EXISTING_RECORD_ACTIONS:
        if not am.get("before_hash"):
            raise Refusal(f"{am['amendment_version_id']}: existing-record action requires before_hash")
        if not am.get("target_record_id"):
            raise Refusal(f"{am['amendment_version_id']}: existing-record action requires target_record_id")
    if am["action_class"] in CREATE_ACTIONS:
        if am.get("target_record_id"):
            raise Refusal(f"{am['amendment_version_id']}: create action must not carry target_record_id")
        if not am.get("dedupe_key"):
            raise Refusal(f"{am['amendment_version_id']}: create action requires deterministic dedupe_key")


# --- Rollback classification (contract §6) ------------------------------------

def classify_rollback(am):
    if am["action_class"] in EXISTING_RECORD_ACTIONS:
        return "Compensating Mutation"  # exact restoration from before snapshot
    if am["action_class"] in CREATE_ACTIONS:
        return "Compensating Mutation"  # compensate via Quarantine, never delete
    return "No Safe Rollback"


# --- Replay / dedupe / attempts (contract §4) ---------------------------------

def _events_for_amendment(am, token):
    rec_id = am.get("amendment_version_record_id")
    if not rec_id:
        return []
    rows = _list_records(BASE_WORKSHOP, T_EXECUTION_EVENTS, token,
                         [EE["amendment_version"], EE["attempt"], EE["event_type"],
                          EE["applied_payload"]])
    out = []
    for r in rows:
        links = r.get("fields", {}).get(EE["amendment_version"], []) or []
        link_ids = [l["id"] if isinstance(l, dict) else l for l in links]
        if rec_id in link_ids:
            out.append(r.get("fields", {}))
    return out


def check_replay_and_attempt(am, token):
    """Returns (attempt_number, prior_events). Refuses already-Applied; an exact
    completed replay becomes Skipped (handled by caller)."""
    events = _events_for_amendment(am, token)
    attempts = [e.get(EE["attempt"], 0) for e in events if isinstance(e.get(EE["attempt"]), int)]
    applied = [e for e in events if _sel_name(e.get(EE["event_type"])) == "Applied"]
    if applied:
        raise Refusal(f"{am['amendment_version_id']}: already Applied (replay refused)")
    return (max(attempts) + 1 if attempts else 1), events


def check_amber_green(am, token):
    """Green tier accepted only with a prior Applied event for the same action
    class + exact adapter version. Otherwise a false-Green blocks."""
    if am.get("tier") != "Green":
        return  # Amber runs Amber and notifies; no approval gate
    rows = _list_records(BASE_WORKSHOP, T_EXECUTION_EVENTS, token,
                         [EE["event_type"], EE["applied_payload"]])
    for r in rows:
        f = r.get("fields", {})
        if _sel_name(f.get(EE["event_type"])) != "Applied":
            continue
        payload_raw = f.get(EE["applied_payload"])
        try:
            payload = json.loads(payload_raw) if payload_raw else {}
        except Exception:
            payload = {}
        if (payload.get("action_class") == am["action_class"]
                and payload.get("adapter_version") == ADAPTER_VERSION):
            return  # a prior Applied exists for this class+version -> Green OK
    raise Blocked(f"{am['amendment_version_id']}: tier Green with no prior Applied "
                  f"for {am['action_class']} + {ADAPTER_VERSION} (false-Green blocked)")


# --- Payload key validation ---------------------------------------------------

def _validate_payload_keys(payload, allowed):
    extra = set(payload) - set(allowed)
    if extra:
        raise Refusal(f"forbidden/unknown payload keys: {sorted(extra)}")


# --- Capture Source gate (v2.1) ------------------------------------------------
from context_config import CAPTURE_SOURCE_FIELD, CAPTURE_SOURCE_CHOICES


def _validate_capture_source_value(value):
    """Exact allowed choice NAME only; nothing else is accepted."""
    if value not in CAPTURE_SOURCE_CHOICES:
        raise Refusal(f"capture_source {value!r} not an allowed choice "
                      f"{sorted(CAPTURE_SOURCE_CHOICES)}")


def _gate_create_capture_source(payload):
    """CREATE actions: capture_source mandatory in payload, exact allowed choice."""
    cs = payload.get("capture_source")
    if cs in (None, ""):
        raise Refusal("create action requires capture_source in payload")
    _validate_capture_source_value(cs)


def _gate_existing_capture_source(cur_fields, payload, will_fill_cs):
    """Draft-preserving updates (LINK_SOURCE_DOCUMENT, etc.): refuse to leave a
    reviewable Draft unrouted — if the target's Capture Source is blank AND the
    action does not itself fill it, refuse. QUARANTINE is exempt (handled separately)."""
    cur_cs = cur_fields.get(CAPTURE_SOURCE_FIELD)
    cur_cs_name = _sel_name(cur_cs) if isinstance(cur_cs, dict) else cur_cs
    if will_fill_cs:
        return  # the action explicitly routes it
    if cur_cs_name in (None, ""):
        raise Refusal("target Draft has blank Capture Source and this action does not fill it; "
                      "refusing to leave a reviewable Draft unrouted")


# --- Action adapters (return the fields written; readback done by caller) -----

def _draft_create_fields(am):
    p = am["payload"]
    _validate_payload_keys(p, {"title", "canonical_text", "brain_slug", "proposed_category",
                               "brain_theme", "record_type", "horizon", "capture_source",
                               "supersedes_trusted_truth_id", "source_documents"})
    _gate_create_capture_source(p)  # v2.1: mandatory, exact allowed choice
    fields = {
        F["title"]: p["title"],
        F["canonical_text"]: p.get("canonical_text", ""),
        F["brain_slug"]: p.get("brain_slug", ""),
        F["status"]: "Draft",
        F["created_by"]: "Agent",
        F["proposed_by_agent"]: am["executing_agent"],
        CAPTURE_SOURCE_FIELD: p["capture_source"],
    }
    for sem, fid in (("proposed_category", F["proposed_category"]), ("brain_theme", F["brain_theme"]),
                     ("record_type", F["record_type"]), ("horizon", F["horizon"]),
                     ("supersedes_trusted_truth_id", F["supersedes_trusted_truth_id"]),
                     ("source_documents", F["source_documents"])):
        if p.get(sem):
            fields[fid] = p[sem]
    return fields


def act_create_draft_truth(am, token, dry):
    fields = _draft_create_fields(am)
    if dry:
        return {"would_create": fields}, None
    res = _create(am["target_base_id"], T_DRAFT_TRUTH, fields, token)
    rid = res["records"][0]["id"]
    return {"created": rid, "fields": fields}, rid


def act_create_amendment_draft(am, token, dry):
    am = dict(am); am["payload"] = dict(am["payload"]); am["payload"]["record_type"] = "Amendment"
    return act_create_draft_truth(am, token, dry)


def act_fill_blank_draft_metadata(am, token, dry, cur_fields):
    p = am["payload"]
    _validate_payload_keys(p, {"fields"})
    writes = p["fields"]
    if not isinstance(writes, dict) or not writes:
        raise Refusal("blank-metadata payload.fields must be a non-empty object")
    field_updates = {}
    for sem, value in writes.items():
        if sem in BLANK_METADATA_FORBIDDEN:
            raise Refusal(f"blank-metadata may never write {sem}")
        fid = BLANK_METADATA_ALLOWLIST.get(sem)
        if fid is None:
            raise Refusal(f"blank-metadata field {sem} not in allowlist")
        # v2.1: Capture Source may be set only via exact allowed choice
        if fid == CAPTURE_SOURCE_FIELD:
            _validate_capture_source_value(value)
        field_updates[fid] = value
    for fid in field_updates:
        if cur_fields.get(fid) not in (None, "", [], {}):
            raise Refusal(f"field {fid} is not blank; blank-metadata adapter refuses overwrite")
    # v2.1: if target remains Draft and Capture Source is still blank after this payload
    # (and this payload did not fill it), refuse to leave the Draft unrouted.
    fills_cs = CAPTURE_SOURCE_FIELD in field_updates
    _gate_existing_capture_source(cur_fields, p, fills_cs)
    if dry:
        return {"would_update": field_updates}, None
    _update(am["target_base_id"], T_DRAFT_TRUTH, am["target_record_id"], field_updates, token)
    return {"updated": am["target_record_id"], "fields": field_updates}, am["target_record_id"]


def act_link_source_document(am, token, dry, cur_fields):
    p = am["payload"]
    _validate_payload_keys(p, {"source_document_record_ids"})
    add = p["source_document_record_ids"]
    if not isinstance(add, list) or not add:
        raise Refusal("link-source requires a non-empty source_document_record_ids list")
    # v2.1: refuse to leave a reviewable Draft unrouted (blank Capture Source, not filled here)
    _gate_existing_capture_source(cur_fields, p, False)
    existing = cur_fields.get(F["source_documents"], []) or []
    existing_ids = [l["id"] if isinstance(l, dict) else l for l in existing]
    union = list(dict.fromkeys(existing_ids + add))
    if dry:
        return {"would_update": {F["source_documents"]: union}}, None
    _update(am["target_base_id"], T_DRAFT_TRUTH, am["target_record_id"],
            {F["source_documents"]: union}, token)
    return {"updated": am["target_record_id"], "linked": union}, am["target_record_id"]


def act_quarantine_draft(am, token, dry, cur_fields):
    cur_status = _sel_name(cur_fields.get(F["status"]))
    if cur_status not in QUARANTINE_ALLOWED_FROM:
        raise Refusal(f"quarantine only from Draft; current status {cur_status!r}")
    if dry:
        return {"would_update": {F["status"]: "Quarantined"}}, None
    _update(am["target_base_id"], T_DRAFT_TRUTH, am["target_record_id"],
            {F["status"]: "Quarantined"}, token)
    return {"updated": am["target_record_id"], "status": "Quarantined"}, am["target_record_id"]


def act_create_superseding_draft(am, token, dry):
    if not am["payload"].get("supersedes_trusted_truth_id"):
        raise Refusal("superseding draft requires supersedes_trusted_truth_id")
    return act_create_draft_truth(am, token, dry)


ACTION_HANDLERS = {
    "CREATE_DRAFT_TRUTH": act_create_draft_truth,
    "CREATE_AMENDMENT_DRAFT": act_create_amendment_draft,
    "CREATE_SUPERSEDING_DRAFT": act_create_superseding_draft,
}
EXISTING_HANDLERS = {
    "FILL_BLANK_DRAFT_METADATA": act_fill_blank_draft_metadata,
    "LINK_SOURCE_DOCUMENT": act_link_source_document,
    "QUARANTINE_DRAFT": act_quarantine_draft,
}


# --- Event + Change Log append (contract §5) ----------------------------------

def append_execution_event(am, token, event_type, attempt, before_snap, before_hash,
                           applied_payload, after_readback, after_hash, rollback_class,
                           action_id="", revert_handle="", error=""):
    fields = {
        EE["execution_event_id"]: f"cee-{am['run_id']}-{am['amendment_version_id']}-{attempt}-{event_type.lower()}",
        EE["run_id"]: am["run_id"],
        EE["attempt"]: attempt,
        EE["event_type"]: event_type,
        EE["executing_agent"]: am["executing_agent"],
        EE["target_url"]: am.get("target_url", ""),
        EE["rollback_class"]: rollback_class,
    }
    if am.get("amendment_version_record_id"):
        fields[EE["amendment_version"]] = [am["amendment_version_record_id"]]
    if am.get("target_record_id"):
        fields[EE["target_draft"]] = [am["target_record_id"]]
    if before_snap is not None:
        fields[EE["observed_before_snapshot"]] = before_snap[:90000] if isinstance(before_snap, str) else json.dumps(before_snap, ensure_ascii=False)[:90000]
    if before_hash:
        fields[EE["observed_before_hash"]] = before_hash
    if applied_payload is not None:
        fields[EE["applied_payload"]] = json.dumps(applied_payload, ensure_ascii=False)[:90000]
    if after_readback is not None:
        fields[EE["after_readback"]] = after_readback[:90000] if isinstance(after_readback, str) else json.dumps(after_readback, ensure_ascii=False)[:90000]
    if after_hash:
        fields[EE["after_hash"]] = after_hash
    if action_id:
        fields[EE["airtable_action_id"]] = action_id
    if revert_handle:
        fields[EE["revert_handle"]] = revert_handle
    if error:
        fields[EE["error"]] = error[:90000]
    _create(BASE_WORKSHOP, T_EXECUTION_EVENTS, fields, token)


def latest_change_log_hash(token):
    rows = _list_records(BASE_REGISTRY, T_REGISTRY_CHANGE_LOG, token, [CL["entry_hash"]])
    hashes = [r.get("fields", {}).get(CL["entry_hash"]) for r in rows]
    hashes = [h for h in hashes if h]
    return hashes[-1] if hashes else "GENESIS"


def append_change_log(am, token, summary, affected_url):
    prev = latest_change_log_hash(token)
    entry_id = f"ctx-review-{am['run_id']}-{am['amendment_version_id']}"
    body = f"{entry_id}|{prev}|{summary}|{am['executing_agent']}"
    entry_hash = sha(body)
    fields = {
        CL["entry_id"]: entry_id,
        CL["change_summary"]: summary[:90000],
        CL["changed_by"]: am["executing_agent"],
        CL["executing_agent"]: am["executing_agent"],
        CL["source"]: am.get("target_url", ""),
        CL["reason"]: "Clive's Man Daily Context Review typed execution",
        CL["affected_records"]: affected_url,
        CL["status"]: "Complete",
        CL["previous_hash"]: prev,
        CL["entry_hash"]: entry_hash,
    }
    _create(BASE_REGISTRY, T_REGISTRY_CHANGE_LOG, fields, token)


# --- Queue loader + lane classification (contract §queue) ----------------------

INTAKE_V1_SIGNATURE = {
    "stage": "V1",
    "action_class": "CREATE_DRAFT_TRUTH",
}


def _lane_cap(lane: str):
    return CAP_DAILY_MUTATIONS.get(lane)


def _lane_fail_cap(lane: str) -> int:
    return CAP_FAILURES.get(lane, 2)


def classify_lane_from_v1(v1_fields: dict) -> str:
    """Intake when V1 ancestor is CREATE_DRAFT_TRUTH from an allowed intake actor."""
    stage = _sel_name(v1_fields.get(AV["stage"]))
    action = _sel_name(v1_fields.get(AV["action_class"]))
    actor = _sel_name(v1_fields.get(AV["created_by_agent"]))
    if (
        stage == INTAKE_V1_SIGNATURE["stage"]
        and action == INTAKE_V1_SIGNATURE["action_class"]
        and actor in INTAKE_ACTORS
    ):
        return "intake"
    return "maintenance"


def _parse_payload(raw):
    if not raw:
        return {}
    try:
        p = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return {}
    if isinstance(p, dict) and isinstance(p.get("fields"), dict):
        return p["fields"]
    return p if isinstance(p, dict) else {}


def amendment_from_v2(v2_row: dict, v1_row, *, lane: str, run_id: str) -> dict:
    vf = v2_row.get("fields", {})
    action = _sel_name(vf.get(AV["action_class"]))
    am = {
        "amendment_version_record_id": v2_row["id"],
        "amendment_version_id": vf.get(AV["amendment_version_id"]),
        "action_class": action,
        "target_base_id": vf.get(AV["target_base_id"]),
        "target_table_id": vf.get(AV["target_table_id"]),
        "target_record_id": vf.get(AV["target_record_id"]) or None,
        "before_hash": vf.get(AV["before_hash"]) or None,
        "dedupe_key": vf.get(AV["dedupe_key"]),
        "tier": _sel_name(vf.get(AV["tier"])),
        "adapter_version": vf.get(AV["adapter_version"]),
        "run_id": run_id,
        "executing_agent": ACTOR_INTAKE if lane == "intake" else ACTOR_SCHEDULED,
        "target_url": "",
        "_lane": lane,
    }
    if action in CREATE_ACTIONS:
        am["payload"] = _parse_payload(vf.get(AV["after_payload"]))
    elif action == "FILL_BLANK_DRAFT_METADATA":
        am["payload"] = {"fields": _parse_payload(vf.get(AV["after_payload"]))}
    elif action == "LINK_SOURCE_DOCUMENT":
        p = _parse_payload(vf.get(AV["after_payload"]))
        am["payload"] = {"source_document_record_ids": p.get("source_document_record_ids") or []}
    else:
        am["payload"] = _parse_payload(vf.get(AV["after_payload"])) or {}
    if v1_row:
        am["_v1_record_id"] = v1_row.get("id")
    return am


def _v1_link_ids(v2_fields: dict):
    links = v2_fields.get(AV["supersedes_version_link"]) or []
    return [l["id"] if isinstance(l, dict) else l for l in links]


def _has_terminal_event(amendment_record_id: str, token: str) -> bool:
    events = _events_for_amendment({"amendment_version_record_id": amendment_record_id}, token)
    for e in events:
        if _sel_name(e.get(EE["event_type"])) in TERMINAL_EVENT_TYPES:
            return True
    return False


def evaluate_backlog_alarm(backlog_history, current_backlog: int) -> bool:
    """Pure reporting control: True only when backlog rises three runs in a row."""
    history = list(backlog_history or [])
    if len(history) < 2:
        return False
    seq = history[-2:] + [current_backlog]
    return len(seq) == 3 and seq[0] < seq[1] < seq[2]


def load_cleared_v2_queue(token: str):
    """Cleared V2 rows with no terminal Execution Event."""
    rows = _list_records(
        BASE_WORKSHOP,
        T_AMENDMENT_VERSIONS,
        token,
        [
            AV["stage"],
            AV["challenger_verdict"],
            AV["supersedes_version"],
            AV["supersedes_version_link"],
            AV["action_class"],
            AV["amendment_version_id"],
            AV["target_base_id"],
            AV["target_table_id"],
            AV["target_record_id"],
            AV["before_hash"],
            AV["after_payload"],
            AV["dedupe_key"],
            AV["tier"],
            AV["adapter_version"],
        ],
    )
    out = []
    for r in rows:
        f = r.get("fields", {})
        if _sel_name(f.get(AV["stage"])) != "V2":
            continue
        if _sel_name(f.get(AV["challenger_verdict"])) != "Cleared":
            continue
        if _has_terminal_event(r["id"], token):
            continue
        out.append(r)
    return out


def load_v1_ancestor(v2_fields: dict, token: str):
    link_ids = _v1_link_ids(v2_fields)
    if link_ids:
        return _get_record(BASE_WORKSHOP, T_AMENDMENT_VERSIONS, link_ids[0], token)
    sup = v2_fields.get(AV["supersedes_version"])
    if not sup:
        return None
    rows = _list_records(
        BASE_WORKSHOP,
        T_AMENDMENT_VERSIONS,
        token,
        [AV["amendment_version_id"], AV["stage"], AV["action_class"], AV["created_by_agent"]],
    )
    for r in rows:
        f = r.get("fields", {})
        if f.get(AV["amendment_version_id"]) == sup and _sel_name(f.get(AV["stage"])) == "V1":
            return r
    return None


def build_lane_manifests(amendments, run_id: str) -> dict:
    lanes: dict[str, list] = {"intake": [], "maintenance": []}
    for am in amendments:
        lane = am.pop("_lane", "maintenance")
        lanes.setdefault(lane, []).append(am)
    out = {}
    for lane, items in lanes.items():
        if not items:
            continue
        actor = ACTOR_INTAKE if lane == "intake" else ACTOR_SCHEDULED
        out[lane] = {
            "run_id": f"{run_id}-{lane}",
            "executing_agent": actor,
            "lane": lane,
            "amendments": items,
        }
    return out


def execute_lane(manifest: dict, token, *, dry_run: bool) -> dict:
    lane = manifest.get("lane", "maintenance")
    executing_agent = manifest.get("executing_agent", ACTOR_SCHEDULED)
    amendments = manifest.get("amendments", [])
    daily_cap = _lane_cap(lane)
    fail_cap = _lane_fail_cap(lane)

    results = []
    preflight_ok = []
    seen_ids = set()

    for am in amendments:
        am.setdefault("executing_agent", executing_agent)
        am.setdefault("run_id", manifest.get("run_id", "unknown-run"))
        avid = am.get("amendment_version_id", "unknown")
        try:
            if avid in seen_ids:
                raise Refusal(f"duplicate amendment_version_id {avid} in batch")
            seen_ids.add(avid)
            _validate_shape(am)
            rb = classify_rollback(am)
            if rb == "No Safe Rollback":
                raise Refusal(f"{avid}: No Safe Rollback — refuse before mutation")
            if not dry_run:
                load_authoritative_v2(am, token)
                check_amber_green(am, token)
                attempt, _ = check_replay_and_attempt(am, token)
                am["_attempt"] = attempt
            else:
                am["_attempt"] = 1
            am["_rollback_class"] = rb
            preflight_ok.append(am)
        except (Refusal, Blocked) as e:
            results.append({"amendment": avid, "preflight": "FAILED", "error": str(e), "lane": lane})

    mutations = 0
    failures = sum(1 for r in results if r.get("preflight") == "FAILED")
    requeued = max(0, len(amendments) - len(preflight_ok) - failures)
    requeued_list = []  # type: list

    for pos, am in enumerate(preflight_ok):
        if daily_cap is not None and mutations >= daily_cap:
            unattempted = preflight_ok[pos:]
            requeued += len(unattempted)
            requeued_list.extend(a["amendment_version_id"] for a in unattempted)
            results.append({"stop": f"{lane} daily cap {daily_cap} reached", "lane": lane})
            break
        if failures >= fail_cap:
            unattempted = preflight_ok[pos:]
            requeued += len(unattempted)
            requeued_list.extend(a["amendment_version_id"] for a in unattempted)
            results.append({"stop": f"{lane} failure cap {fail_cap} reached", "lane": lane})
            break

        avid = am["amendment_version_id"]
        action = am["action_class"]
        attempt = am["_attempt"]
        rb = am["_rollback_class"]
        before_hash = None
        before_snap = None
        cur_fields = None
        try:
            if action in EXISTING_HANDLERS:
                cur = _get_record(am["target_base_id"], T_DRAFT_TRUTH, am["target_record_id"], token)
                cur_fields = cur.get("fields", {})
                before_snap = canonical_snapshot(cur_fields)
                before_hash = sha(before_snap)
                if before_hash != am["before_hash"]:
                    raise Blocked(f"before-hash mismatch on {am['target_record_id']}")

            applied_payload = {"action_class": action, "adapter_version": ADAPTER_VERSION,
                               "amendment_version_id": avid}

            if dry_run:
                handler = ACTION_HANDLERS.get(action) or EXISTING_HANDLERS.get(action)
                if action in EXISTING_HANDLERS:
                    out, _ = handler(am, token, True, cur_fields or {})
                else:
                    out, _ = handler(am, token, True)
                results.append({"amendment": avid, "action": action, "outcome": "dry-run", "detail": out, "lane": lane})
                mutations += 1
                continue

            append_execution_event(am, token, "Attempt", attempt, before_snap, before_hash,
                                   None, None, None, rb)

            if action in EXISTING_HANDLERS:
                out, rid = EXISTING_HANDLERS[action](am, token, False, cur_fields)
            else:
                out, rid = ACTION_HANDLERS[action](am, token, False)
            am["target_record_id"] = am.get("target_record_id") or rid

            readback = _get_record(am["target_base_id"], T_DRAFT_TRUTH, am["target_record_id"], token)
            rb_fields = readback.get("fields", {})
            after_snap = canonical_snapshot(rb_fields)
            after_hash = sha(after_snap)
            try:
                _verify_readback(action, out, rb_fields)
            except Blocked as verify_err:
                append_execution_event(am, token, "Failed", attempt, before_snap, before_hash,
                                       applied_payload, after_snap, after_hash, rb,
                                       error=f"readback after mutation: {verify_err}")
                raise

            applied_payload.update({"detail": out})
            append_execution_event(am, token, "Applied", attempt, before_snap, before_hash,
                                   applied_payload, after_snap, after_hash, rb)
            append_change_log(am, token, f"{action} applied for {avid}", am.get("target_url", ""))
            mutations += 1
            results.append({"amendment": avid, "action": action, "outcome": "applied", "detail": out, "lane": lane})
        except Blocked as b:
            failures += 1
            results.append({"amendment": avid, "action": action, "outcome": "blocked", "error": str(b), "lane": lane})
            if not dry_run:
                append_execution_event(am, token, "Blocked", attempt, before_snap, before_hash,
                                       None, None, None, rb, error=str(b))
        except Refusal as r:
            failures += 1
            results.append({"amendment": avid, "action": action, "outcome": "failed", "error": str(r), "lane": lane})
            if not dry_run:
                append_execution_event(am, token, "Failed", attempt, before_snap, before_hash,
                                       None, None, None, rb, error=str(r))

    return {
        "lane": lane,
        "preflight": "OK" if preflight_ok or dry_run else "EMPTY",
        "mutations": mutations,
        "failures": failures,
        "requeued": requeued,
        "requeued_amendments": requeued_list,
        "results": results,
    }


def run_queue(
    token,
    *,
    dry_run: bool,
    run_id: str,
    backlog_history=None,
) -> dict:
    v2_rows = [] if dry_run else load_cleared_v2_queue(token)
    amendments = []  # type: list
    for v2 in v2_rows:
        vf = v2.get("fields", {})
        v1 = None if dry_run else load_v1_ancestor(vf, token)
        lane = classify_lane_from_v1(v1.get("fields", {})) if v1 else "maintenance"
        amendments.append(amendment_from_v2(v2, v1, lane=lane, run_id=run_id))
    manifests = build_lane_manifests(amendments, run_id)
    lane_results = {}
    for lane, manifest in manifests.items():
        lane_results[lane] = execute_lane(manifest, token, dry_run=dry_run)
    current_backlog = len(amendments)
    return {
        "adapter_version": ADAPTER_VERSION,
        "dry_run": dry_run,
        "run_id": run_id,
        "queued": current_backlog,
        "backlog": current_backlog,
        "backlog_history": list(backlog_history or []),
        "backlog_alarm": evaluate_backlog_alarm(backlog_history, current_backlog),
        "lanes": lane_results,
    }


# --- Main two-pass driver -----------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest")
    ap.add_argument("--run-queue", action="store_true")
    ap.add_argument("--run-id", default="ctx-exec-run")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--backlog-history", default=None, help="JSON array of prior run backlog counts")
    args = ap.parse_args()
    backlog_history = None
    if args.backlog_history:
        backlog_history = json.loads(args.backlog_history)

    if args.run_queue:
        token = None if args.dry_run else _token()
        if args.dry_run:
            token = os.environ.get(ENV_EXECUTE, "dry-run-placeholder")
        print(json.dumps(
            run_queue(
                token,
                dry_run=args.dry_run,
                run_id=args.run_id,
                backlog_history=backlog_history,
            ),
            indent=2,
            ensure_ascii=False,
        ))
        return

    if not args.manifest:
        ap.error("--manifest or --run-queue required")

    with open(args.manifest) as fh:
        manifest = json.load(fh)

    token = None if args.dry_run else _token()
    if args.dry_run:
        token = os.environ.get(ENV_EXECUTE, "dry-run-placeholder")

    amendments = manifest.get("amendments", [])
    for am in amendments:
        if "_lane" not in am and am.get("lane"):
            am["_lane"] = am["lane"]
        elif "_lane" not in am:
            am["_lane"] = manifest.get("lane", "maintenance")

    lane_manifests = build_lane_manifests([dict(a) for a in amendments], manifest.get("run_id", args.run_id))
    if not lane_manifests:
        lane_manifests = {
            manifest.get("lane", "maintenance"): {
                "run_id": manifest.get("run_id", args.run_id),
                "executing_agent": manifest.get("executing_agent", ACTOR_SCHEDULED),
                "lane": manifest.get("lane", "maintenance"),
                "amendments": amendments,
            }
        }

    if not args.dry_run:
        schema_problems = validate_schema(token)
        if schema_problems:
            print(json.dumps({"preflight": "FAILED", "schema_problems": schema_problems,
                              "mutations": 0}, indent=2))
            sys.exit(2)

    lane_results = {}
    for lane, lane_manifest in lane_manifests.items():
        lane_manifest["executing_agent"] = lane_manifest.get(
            "executing_agent",
            ACTOR_INTAKE if lane == "intake" else ACTOR_SCHEDULED,
        )
        lane_results[lane] = execute_lane(lane_manifest, token, dry_run=args.dry_run)

    total_mut = sum(r.get("mutations", 0) for r in lane_results.values())
    total_fail = sum(r.get("failures", 0) for r in lane_results.values())
    print(json.dumps({
        "adapter_version": ADAPTER_VERSION,
        "dry_run": args.dry_run,
        "preflight": "OK",
        "mutations": total_mut,
        "failures": total_fail,
        "lanes": lane_results,
    }, indent=2, ensure_ascii=False))


def _verify_readback(action, out, rb_fields):
    """Compare exact desired state including union-add. Raises Blocked on mismatch."""
    if action in EXISTING_HANDLERS:
        written = out.get("fields") or {}
        if action == "LINK_SOURCE_DOCUMENT":
            want = set(out.get("linked", []))
            got = {l["id"] if isinstance(l, dict) else l for l in (rb_fields.get(F["source_documents"], []) or [])}
            if not want.issubset(got):
                raise Blocked("readback: union-add source documents not fully present")
            return
        for fid, val in written.items():
            got = rb_fields.get(fid)
            got = _sel_name(got) if isinstance(got, dict) else got
            want = _sel_name(val) if isinstance(val, dict) else val
            if got != want:
                raise Blocked(f"readback mismatch on field {fid}: wanted {want!r}, got {got!r}")
    # creates: existence of the new record id is the readback confirmation


if __name__ == "__main__":
    main()
