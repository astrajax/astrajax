#!/usr/bin/env python3
"""
context_estate_audit_propose.py — Context Auditor (Audit & Propose) for
Clive's Man Daily Context Review. v3 runtime fallback — role-scoped.
Implementation v1.2.

Deterministic scan + fingerprint engine + V1 Amendment Version writer.
Read-only over context surfaces; writes ONLY Context Audit Fingerprints and
V1 Amendment Versions (Stage=V1, Verdict=Proposed) through the V1 control
credential. The pen enforces stage + actor + target table. NO V2 writer, NO
executor, NO context mutation, NO Trusted write.

v1.2 (Green repair after live acceptance PARTIAL, thread cmsbjew5a0yy707ad00glhga5):
  * Overflow blocks Amendment Version creation/execution ONLY — never
    fingerprint writes. Fingerprints are ALWAYS upserted after successful
    schema/Trusted reads, including first-baseline and overflow runs.
  * First-baseline mode: when prior fingerprints are empty, fingerprint the
    FULL estate and aggregate all findings; subsequent runs use
    changed/missing + a rotating sample of unchanged.
  * Reads Trusted RECORDS (bounded by active Registry bases/tables + caps),
    fingerprints them, and runs the approved Workshop<->Trusted
    contradiction/supersedes candidates (read-only). Empty/missing = kill.
  * Loads the unresolved V1 queue (Stage=V1 rows with no V2 descendant) into
    dedupe/prior-unresolved logic so the Auditor never proposes duplicates.
  * Computes COMPLETE severity/check aggregates before truncating detail;
    reports full counts, then includes the top CAP_FINDINGS details.

Credentials:
  CONTEXT_ESTATE_READ        (read+schema: Workshop, Registry, Trusted ro)
  CONTEXT_V1_CONTROL_WRITE   (write: Workshop — Fingerprints + V1 Amendments only)

Usage:
  python3 context_estate_audit_propose.py --out /tmp/findings.json \
      --run-id <root> [--write] [--amendments /tmp/v1_amendments.json]
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

from context_config import (
    ADAPTER_VERSION, EXECUTOR_ADAPTER_VERSION, SKILL_IMPLEMENTATION_VERSION,
    ROLE, BASE_WORKSHOP, BASE_REGISTRY,
    T_DRAFT_TRUTH, T_SOURCE_DOCS, T_AMENDMENT_VERSIONS, T_AUDIT_FINGERPRINTS,
    T_REGISTRY_BRAINS, F, AV, FP, BR, SD, REQUIRED_SCHEMA,
    V1_STAGE, V1_VERDICT, AUDITOR_WRITE_TABLES,
    ACTION_CLASSES, CAP_FINDING_DETAILS, CAP_V1_AMENDMENTS, CHECK_ACTION_PRIORITY,
    STALE_DAYS_DEFAULT,
    ENV_READ, ENV_V1_CONTROL_WRITE,
)

API = "https://api.airtable.com/v0"

# Bound Trusted-record reads (defect 3): never read more than this many
# tables per Trusted base or records per table in one run.
TRUSTED_TABLE_READ_CAP = 20
TRUSTED_RECORD_READ_CAP = 200


class ReadError(Exception):
    pass


class KillEvent(Exception):
    pass


class PenRefusal(Exception):
    """The V1 control pen refused a write (stage/actor/table enforced)."""


def _tok(name):
    t = os.environ.get(name, "")
    if not t:
        raise ReadError(f"credential {name} not present")
    return t


def _req(method, path, token, body=None, retries=1):
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    attempt = 0
    while True:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8") or "{}")
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries:
                time.sleep(30)
                attempt += 1
                continue
            raise ReadError(f"airtable HTTP {e.code} on {method} {path}: {e.read().decode('utf-8','replace')[:300]}")


def list_all(base, table, token, field_ids=None, page_cap=None):
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
        if not offset or (page_cap and len(out) >= page_cap):
            return out[:page_cap] if page_cap else out


def get_table_fields(base, table, token):
    res = _req("GET", f"/meta/bases/{base}/tables", token)
    for t in res.get("tables", []):
        if t.get("id") == table:
            return {f.get("id") for f in t.get("fields", [])}
    raise ReadError(f"schema: table {table} not in base {base}")


def validate_schema(token):
    problems = []
    for base, table, field_ids in REQUIRED_SCHEMA:
        try:
            present = get_table_fields(base, table, token)
        except ReadError as r:
            problems.append(f"{base}/{table}: {r}")
            continue
        missing = [fid for fid in field_ids if fid not in present]
        if missing:
            problems.append(f"{base}/{table}: missing fields {missing}")
    return problems


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def rec_hash(record):
    return sha(json.dumps(record.get("fields", {}), sort_keys=True, separators=(",", ":"), ensure_ascii=False))


def canonical(fields):
    return json.dumps(fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sel(v):
    return v.get("name") if isinstance(v, dict) else v


def _norm(s):
    return " ".join((s or "").lower().split())


def discover_trusted_bases(token):
    brains = list_all(BASE_REGISTRY, T_REGISTRY_BRAINS, token)
    # v1.8: group by UNIQUE Trusted Base ID. Several active brain slugs may point at
    # the same physical Trusted base — scan it ONCE, keep slugs as metadata.
    by_base = {}
    for b in brains:
        f = b.get("fields", {})
        if _sel(f.get(BR["status"])) == "Active" and f.get(BR["trusted_base_id"]):
            tb = f[BR["trusted_base_id"]]
            slug = f.get(BR["brain_slug"])
            if tb not in by_base:
                by_base[tb] = {"trusted_base": tb, "workshop_base": f.get(BR["workshop_base_id"]),
                               "brain_slugs": []}
            by_base[tb]["brain_slugs"].append(slug)
    trusted = list(by_base.values())
    if not trusted:
        raise KillEvent("Trusted-base discovery returned zero active brains — kill event")
    return trusted


def load_prior_fingerprints(read_token):
    # READ path: prior fingerprints are a read, so they MUST use CONTEXT_ESTATE_READ,
    # never the write-only CONTEXT_V1_CONTROL_WRITE (which would 403 on GET).
    rows = list_all(BASE_WORKSHOP, T_AUDIT_FINGERPRINTS, read_token,
                    [FP["object_key"], FP["current_hash"], FP["state"]])
    out = {}
    for r in rows:
        f = r.get("fields", {})
        if f.get(FP["object_key"]):
            out[f[FP["object_key"]]] = {"record_id": r["id"],
                                        "current_hash": f.get(FP["current_hash"]),
                                        "state": _sel(f.get(FP["state"]))}
    return out


def load_unresolved_v1_queue(read_token):
    """Stage=V1 Amendment Version rows with NO V2 descendant — the unresolved
    queue. Used for dedupe so the Auditor never re-proposes a pending action,
    and surfaced as prior-unresolved findings."""
    rows = list_all(BASE_WORKSHOP, T_AMENDMENT_VERSIONS, read_token,
                    [AV["amendment_version_id"], AV["stage"], AV["supersedes_version"],
                     AV["dedupe_key"], AV["action_class"], AV["target_record_id"]])
    v1_ids = set()
    superseded = set()
    dedupe_keys = set()
    v1_rows = []
    for r in rows:
        f = r.get("fields", {})
        stage = _sel(f.get(AV["stage"]))
        avid = f.get(AV["amendment_version_id"])
        if stage == "V1":
            v1_ids.add(avid)
            v1_rows.append(f)
            if f.get(AV["dedupe_key"]):
                dedupe_keys.add(f[AV["dedupe_key"]])
        elif stage == "V2":
            sup = f.get(AV["supersedes_version"])
            if sup:
                superseded.add(sup)
    unresolved = [f for f in v1_rows if f.get(AV["amendment_version_id"]) not in superseded]
    unresolved_dedupe = {f.get(AV["dedupe_key"]) for f in unresolved if f.get(AV["dedupe_key"])}
    return {"unresolved": unresolved, "unresolved_dedupe_keys": unresolved_dedupe,
            "count": len(unresolved)}


# --- V1 control pen (enforces stage + actor + target table) -------------------

def _pen_write(control_token, table, fields):
    if table not in AUDITOR_WRITE_TABLES:
        raise PenRefusal(f"Auditor pen may not write table {table}")
    if table == T_AMENDMENT_VERSIONS:
        if fields.get(AV["stage"]) != V1_STAGE:
            raise PenRefusal("Auditor pen writes Stage=V1 only")
        if fields.get(AV["challenger_verdict"]) != V1_VERDICT:
            raise PenRefusal("Auditor pen writes Challenger Verdict=Proposed only")
        if fields.get(AV["created_by_agent"]) != ROLE:
            raise PenRefusal(f"Auditor pen writes Created By Agent={ROLE} only")
    _req("POST", f"/{BASE_WORKSHOP}/{table}?returnFieldsByFieldId=true",
         control_token, {"records": [{"fields": fields}]})


# Optional Airtable date/dateTime fields on a fingerprint. Airtable rejects an
# empty string for a date column (HTTP 422 INVALID_VALUE_FOR_COLUMN), so an
# unset/None/"" value must be OMITTED entirely — never sent. Valid ISO values
# are kept. `Created`/createdTime is Airtable-owned and never written.
_FINGERPRINT_DATE_FIELDS = ("last_seen", "last_changed", "last_sampled")


def _normalize_optional_dates(fp_fields, date_field_keys):
    """Return a copy of fp_fields with empty/None date values REMOVED (key
    omitted). Valid non-empty date values are preserved unchanged."""
    out = dict(fp_fields)
    for sem in date_field_keys:
        fid = FP[sem]
        v = out.get(fid)
        if v is None or (isinstance(v, str) and v.strip() == ""):
            out.pop(fid, None)
    return out


def write_fingerprints(fingerprints, prior, control_token):
    written = 0
    for fp in fingerprints:
        fields = {FP["object_key"]: fp["object_key"], FP["base_id"]: fp.get("base_id", ""),
                  FP["table_id"]: fp.get("table_id", ""), FP["record_id"]: fp.get("record_id") or "",
                  FP["object_type"]: fp.get("object_type", ""), FP["current_hash"]: fp.get("current_hash", ""),
                  FP["previous_hash"]: fp.get("previous_hash", ""), FP["last_seen"]: fp.get("last_seen", ""),
                  FP["last_changed"]: fp.get("last_changed", ""), FP["last_sampled"]: fp.get("last_sampled", ""),
                  FP["last_run_id"]: fp.get("last_run_id", ""), FP["state"]: fp.get("state", "Active")}
        fields = _normalize_optional_dates(fields, _FINGERPRINT_DATE_FIELDS)
        existing = prior.get(fp["object_key"])
        if existing:
            _req("PATCH", f"/{BASE_WORKSHOP}/{T_AUDIT_FINGERPRINTS}?returnFieldsByFieldId=true",
                 control_token, {"records": [{"id": existing["record_id"], "fields": fields}]})
        else:
            _pen_write(control_token, T_AUDIT_FINGERPRINTS, fields)
        written += 1
    return written


_V1_REQUIRED_ALWAYS = (
    "amendment_version_id", "run_id", "target_base_id", "target_table_id",
    "action_class", "after_payload", "reason", "evidence", "dedupe_key",
    "v1_report_record_id", "confidence",
)
_V1_REQUIRED_FOR_EXISTING = ("target_record_id", "before_snapshot", "before_hash")
_V1_REQUIRED_FOR_FIELD_ACTION = ("target_field_id",)
_CREATE_ACTIONS = {"CREATE_DRAFT_TRUTH", "CREATE_AMENDMENT_DRAFT", "CREATE_SUPERSEDING_DRAFT"}
_FIELD_ACTIONS = {"FILL_BLANK_DRAFT_METADATA"}


def _validate_v1_complete(fields_by_key):
    """Refuse a V1 Amendment that is missing any mandatory field (v1.5). A row
    that would fail Executor readback must never be created — Challenger will
    later attach a Held/Rejected V2 descendant instead. Returns a list of missing
    keys (empty = complete)."""
    missing = [k for k in _V1_REQUIRED_ALWAYS
               if fields_by_key.get(k) in (None, "", [], {})]
    action = fields_by_key.get("action_class")
    if action in _CREATE_ACTIONS:
        # creates: null target record allowed, but payload + dedupe still required
        pass
    else:
        for k in _V1_REQUIRED_FOR_EXISTING:
            if fields_by_key.get(k) in (None, "", [], {}):
                missing.append(k)
    if action in _FIELD_ACTIONS:
        for k in _V1_REQUIRED_FOR_FIELD_ACTION:
            if fields_by_key.get(k) in (None, "", [], {}):
                missing.append(k)
    return missing


def build_pen_record(am, run_id, v1_report_record_id):
    """Canonical pen-record builder (v1.7). Construct the COMPLETE pen record —
    every mandatory contract field — from the candidate + run context, BEFORE
    strict validation/writer. This is the single structural fix for the
    candidate→writer interface: no field is special-cased downstream.

    Mandatory contract (per the Airtable field map + action class):
      amendment_version_id, run_id, Stage V1, V1 Report Record ID,
      target base/table/record/field (as action requires), action class,
      adapter version, before snapshot/hash (existing-record), exact after payload,
      reason, evidence, Tier Amber, Verdict Proposed, confidence, dedupe key,
      created_by_agent.
    """
    rec = dict(am)
    rec["amendment_version_id"] = rec.get("amendment_version_id") or None  # stamped by caller
    rec["run_id"] = run_id
    rec["stage"] = V1_STAGE
    rec["challenger_verdict"] = V1_VERDICT
    rec["adapter_version"] = EXECUTOR_ADAPTER_VERSION  # Amendment field = executor contract only
    rec["created_by_agent"] = ROLE
    rec["tier"] = rec.get("tier") or "Amber"
    rec["v1_report_record_id"] = rec.get("v1_report_record_id") or v1_report_record_id
    return rec


def write_v1_amendment(am, run_id, control_token):
    fields = {
        AV["amendment_version_id"]: am["amendment_version_id"],
        AV["run_id"]: run_id,
        AV["stage"]: V1_STAGE,
        AV["challenger_verdict"]: V1_VERDICT,
        AV["target_base_id"]: am["target_base_id"],
        AV["target_table_id"]: am["target_table_id"],
        AV["action_class"]: am["action_class"],
        AV["adapter_version"]: EXECUTOR_ADAPTER_VERSION,  # Amendment field = executor contract only
        AV["reason"]: am.get("reason", ""),
        AV["evidence"]: am.get("evidence", ""),
        AV["tier"]: am.get("tier", "Amber"),
        AV["dedupe_key"]: am["dedupe_key"],
        AV["created_by_agent"]: ROLE,
    }
    for opt, fid in (("target_record_id", AV["target_record_id"]),
                     ("target_field_id", AV["target_field_id"]),
                     ("v1_report_url", AV["v1_report_url"]),
                     ("v1_report_record_id", AV["v1_report_record_id"]),
                     ("before_snapshot", AV["before_snapshot"]),
                     ("before_hash", AV["before_hash"]),
                     ("after_payload", AV["after_payload"])):
        if am.get(opt):
            fields[fid] = am[opt]
    if am.get("confidence") is not None:
        fields[AV["confidence"]] = am["confidence"]
    if am.get("human_decision_needed"):
        fields[AV["human_decision_needed"]] = True
    if am.get("target_draft"):
        fields[AV["target_draft"]] = am["target_draft"]
    # v1.5: refuse incomplete rows BEFORE writing. Never create a placeholder.
    missing = _validate_v1_complete(am)
    if missing:
        raise PenRefusal(f"V1 amendment incomplete; missing mandatory fields: {missing}")
    _pen_write(control_token, T_AMENDMENT_VERSIONS, fields)


def _aggregate(findings):
    by_sev = {}
    by_check = {}
    for f in findings:
        by_sev[f["severity"]] = by_sev.get(f["severity"], 0) + 1
        by_check[f["check"]] = by_check.get(f["check"], 0) + 1
    return {"by_severity": by_sev, "by_check": by_check, "total": len(findings)}


_SEV_ORDER = {"high": 0, "medium": 1, "low": 2}

# Per-action candidate completers. Each returns a fully-populated amendment dict
# (exact desired value + complete evidence) or None when the desired value is not
# provable from a single authoritative source. "Actionable" is not a finding
# category — it requires an exact deterministic desired value.


def _complete_quarantine(f, rec_fields):
    # QUARANTINE_DRAFT: exact desired value = status Quarantined; before snapshot/hash
    # from the live record. Evidence = the record ID + detail.
    before = canonical(rec_fields)
    return {
        "target_field_id": None,
        "before_snapshot": before,
        "before_hash": sha(before),
        "after_payload": json.dumps({F["status"]: "Quarantined"}),
        "confidence": 0.9,
        "evidence": f.get("evidence") or f.get("record", ""),
    }


def _complete_fill_blank(f, rec_fields):
    # FILL_BLANK_DRAFT_METADATA: needs an EXACT semantic field + allowed value proven
    # from a single authoritative source, plus Target Field ID. Without an exact value
    # we cannot propose (blank brain slug/theme/supersedes etc. are EXCLUDED — their
    # correct value is not deterministically provable).
    exact = f.get("exact_value")  # {semantic_field, value, field_id}
    if not exact or exact.get("value") in (None, ""):
        return None
    sem = exact.get("semantic_field")
    fid = exact.get("field_id")
    if not sem or not fid:
        return None
    before = canonical(rec_fields)
    return {
        "target_field_id": fid,
        "before_snapshot": before,
        "before_hash": sha(before),
        "after_payload": json.dumps({"fields": {sem: exact["value"]}}),
        "confidence": 0.95,
        "evidence": f.get("evidence") or f.get("record", ""),
    }


def _complete_link_source(f, rec_fields):
    # LINK_SOURCE_DOCUMENT: union-add proven source doc IDs. Needs proven IDs.
    ids = f.get("source_document_record_ids")
    if not ids:
        return None
    before = canonical(rec_fields)
    existing = [l["id"] if isinstance(l, dict) else l for l in (rec_fields.get(F["source_documents"], []) or [])]
    union = list(dict.fromkeys(existing + ids))
    return {
        "target_field_id": None,
        "before_snapshot": before,
        "before_hash": sha(before),
        "after_payload": json.dumps({"source_document_record_ids": union}),
        "confidence": 0.9,
        "evidence": f.get("evidence") or f.get("record", ""),
    }


_COMPLETERS = {
    "QUARANTINE_DRAFT": _complete_quarantine,
    "FILL_BLANK_DRAFT_METADATA": _complete_fill_blank,
    "LINK_SOURCE_DOCUMENT": _complete_link_source,
}


# --- Capture Source gate (v2.1) -------------------------------------------------
from context_config import (CAPTURE_SOURCE_FIELD, CAPTURE_SOURCE_CHOICES,
                            CHAT_CAPTURE_ACTORS)


def classify_capture_source(f, rec_fields):
    """Return the exact allowed choice name for a blank Capture Source, or None when
    ambiguous. Provenance is REQUIRED — never infer merely from Created By.
      Chat Session: proven chat/thread source OR proposed_by_agent in CHAT_CAPTURE_ACTORS.
      External: proven external Source Document/URL/sentinel evidence.
      User Guided: direct human request evidence only.
    """
    proposed_by = _sel(rec_fields.get(F["proposed_by_agent"]))
    evidence = f.get("evidence", "")
    # proven external
    if f.get("external_evidence"):
        return "External Context Capture"
    # user guided: explicit human request evidence (never from Created By)
    if f.get("human_request_evidence"):
        return "User Guided Capture"
    # chat session: proven chat/thread OR allowed chat-capture actor
    if f.get("chat_thread_evidence") or proposed_by in CHAT_CAPTURE_ACTORS:
        return "Chat Session"
    return None  # ambiguous


def _complete_capture_source_blank(f, rec_fields):
    # capture_source_blank finding: fill Capture Source with the exact classified choice.
    choice = classify_capture_source(f, rec_fields)
    if choice is None:
        return None  # ambiguous -> no executable V1
    before = canonical(rec_fields)
    return {
        "target_field_id": CAPTURE_SOURCE_FIELD,
        "before_snapshot": before,
        "before_hash": sha(before),
        "after_payload": json.dumps({"fields": {"capture_source": choice}}),
        "confidence": 0.95,
        "evidence": f.get("evidence") or f.get("record", ""),
    }


_COMPLETERS = {
    "QUARANTINE_DRAFT": _complete_quarantine,
    "FILL_BLANK_DRAFT_METADATA": _complete_fill_blank,
    "LINK_SOURCE_DOCUMENT": _complete_link_source,
    "capture_source_blank": _complete_capture_source_blank,  # keyed by check
}


def select_candidates(findings, cap, pending_dedupe_keys, record_loader=None):
    """v1.5: choose only findings that yield an EXACT deterministic desired value
    with complete evidence. Deterministic order: severity high->medium->low, then
    check/action priority, then stable record ID. Skip pending dedupe keys (next run
    advances the slice). Never propose destructive/canonical-text or placeholder rows.
    record_loader(rec_id) -> live record fields (required for before snapshot/hash)."""
    actionable = []
    batch_dedupe_keys = set()
    for f in findings:
        check = f.get("check")
        rec = f.get("record")
        if check not in CHECK_ACTION_PRIORITY or not rec:
            continue  # non-actionable category
        prio, action_class = CHECK_ACTION_PRIORITY[check]
        # completer is keyed by CHECK for capture_source_blank (special gate);
        # all other checks key by action_class
        completer = _COMPLETERS.get(check) if check == "capture_source_blank" else _COMPLETERS.get(action_class)
        if completer is None:
            continue  # no exact-value completer for this action -> not actionable
        rec_fields = record_loader(rec) if record_loader else None
        if rec_fields is None:
            continue  # cannot build before snapshot/hash without the live record
        completed = completer(f, rec_fields)
        if completed is None:
            continue  # desired value not provable -> exclude
        dedupe_key = sha(f"{rec}|{action_class}|{completed['after_payload']}")
        if dedupe_key in pending_dedupe_keys:
            continue  # advance the slice
        if dedupe_key in batch_dedupe_keys:
            continue  # v1.8: same target+action+payload already chosen this run — skip duplicate
        batch_dedupe_keys.add(dedupe_key)
        actionable.append({
            "amendment_version_id": None,
            "target_base_id": BASE_WORKSHOP,
            "target_table_id": T_DRAFT_TRUTH,
            "target_record_id": rec,
            "action_class": action_class,
            "reason": f"[{f['severity']}] {check}: {f.get('detail','')}",
            "confidence": completed["confidence"],
            "dedupe_key": dedupe_key,
            **{k: v for k, v in completed.items() if k != "confidence"},
            "_sort": (_SEV_ORDER.get(f["severity"], 3), prio, rec),
        })
    actionable.sort(key=lambda a: a["_sort"])
    chosen = actionable[:cap]
    for a in chosen:
        a.pop("_sort", None)
    return chosen, len(actionable)


def _validate_execution_run_id(execution_run_id):
    """v1.8: the Auditor's OWN run identity. Must be a nonempty unique id, ideally
    shaped clive-man-context-auditor--... . Never silently substitute a parent/root
    id. Raises KillEvent on empty/missing."""
    if not execution_run_id or not isinstance(execution_run_id, str) or not execution_run_id.strip():
        raise KillEvent("execution_run_id missing/empty — the Auditor's own Session ID is required "
                        "(never a supplied parent/root id)")
    return execution_run_id.strip()


def _preflight_amendment_ids(candidates, existing_primary_ids):
    """v1.8 identity guard 1: every proposed Amendment Version ID must be unique —
    against existing table primary IDs AND within the batch. Any collision = kill
    (zero writes), never regenerate after a partial write."""
    ids = [c.get("amendment_version_id") for c in candidates if c.get("amendment_version_id")]
    seen = set()
    for i in ids:
        if i in seen:
            raise KillEvent(f"within-batch duplicate Amendment Version ID {i!r}")
        seen.add(i)
        if i in existing_primary_ids:
            raise KillEvent(f"Amendment Version ID {i!r} collides with existing table primary ID")
    return True


def _preflight_dedupe_keys(candidates):
    """v1.8 identity guard 2: dedupe keys must be unique within the batch."""
    keys = [c.get("dedupe_key") for c in candidates if c.get("dedupe_key")]
    if len(keys) != len(set(keys)):
        raise KillEvent("within-batch duplicate Dedupe Key")
    return True


def _preflight_fingerprint_keys(fingerprints):
    """v1.8: every fingerprint object_key must be unique within the run. A duplicate
    object key = kill before any fingerprint write."""
    keys = [fp["object_key"] for fp in fingerprints]
    if len(keys) != len(set(keys)):
        dupes = {k for k in keys if keys.count(k) > 1}
        raise KillEvent(f"duplicate fingerprint object_key(s): {sorted(dupes)[:5]}")
    return True


def load_existing_amendment_primary_ids(read_token):
    rows = list_all(BASE_WORKSHOP, T_AMENDMENT_VERSIONS, read_token,
                    [AV["amendment_version_id"]])
    return {r.get("fields", {}).get(AV["amendment_version_id"]) for r in rows
            if r.get("fields", {}).get(AV["amendment_version_id"])}


def run_audit(read_token, control_token, sample, run_id, write=False, amendments=None,
              v1_report_record_id="", execution_run_id=""):
    findings = []
    fingerprints = []
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    stale_cutoff = now - timedelta(days=STALE_DAYS_DEFAULT)

    # v1.8: run identity is the Auditor's OWN execution run, never parent/root.
    exec_run_id = _validate_execution_run_id(execution_run_id)

    trusted = discover_trusted_bases(read_token)  # kill if empty
    # active brain slugs across all grouped Trusted bases (for slug-validity checks)
    active_slugs = {s for t in trusted for s in t.get("brain_slugs", []) if s}
    active_lower = {s.lower() for s in active_slugs}
    prior = load_prior_fingerprints(read_token)
    first_baseline = len(prior) == 0
    v1_queue = load_unresolved_v1_queue(read_token)

    drafts = list_all(BASE_WORKSHOP, T_DRAFT_TRUTH, read_token)
    sources = list_all(BASE_WORKSHOP, T_SOURCE_DOCS, read_token)
    source_ids = {s["id"] for s in sources}
    linked_refs = set()
    seen_titles, seen_texts = {}, {}

    for d in drafts:
        f = d.get("fields", {})
        rid = d["id"]
        cur = rec_hash(d)
        key = f"draft:{rid}"
        p = prior.get(key, {})
        changed = p.get("current_hash") != cur
        fingerprints.append({"object_key": key, "base_id": BASE_WORKSHOP, "table_id": T_DRAFT_TRUTH,
                             "record_id": rid, "object_type": "Workshop Draft", "current_hash": cur,
                             "previous_hash": p.get("current_hash", ""), "last_seen": now_iso,
                             "last_changed": now_iso if changed else "", "last_run_id": run_id,
                             "state": "Active" if changed or not p else "Unchanged"})
        title = (f.get(F["title"]) or "").strip()
        slug = f.get(F["brain_slug"])
        status = _sel(f.get(F["status"]))
        created = f.get(F["created"])
        if title:
            tk = _norm(title)
            if tk in seen_titles:
                findings.append({"severity": "medium", "check": "duplicate_title", "record": rid,
                                 "detail": f"duplicate title with {seen_titles[tk]}: {title[:80]}"})
            else:
                seen_titles[tk] = rid
        ct = _norm(f.get(F["canonical_text"]))
        if ct:
            th = sha(ct)
            if th in seen_texts:
                findings.append({"severity": "medium", "check": "text_duplicate", "record": rid,
                                 "detail": f"canonical text duplicates {seen_texts[th]}"})
            else:
                seen_texts[th] = rid
        if not slug:
            findings.append({"severity": "medium", "check": "blank_brain_slug", "record": rid,
                             "detail": "no Brain Slug"})
        elif slug not in active_slugs and slug.lower() not in active_lower:
            findings.append({"severity": "low", "check": "unknown_brain_slug", "record": rid,
                             "detail": f"slug {slug!r} not active"})
        for sem, fid in (("proposed_category", F["proposed_category"]), ("brain_theme", F["brain_theme"]),
                         ("record_type", F["record_type"]), ("capture_source", F["capture_source"])):
            if f.get(fid) in (None, "", [], {}):
                findings.append({"severity": "low", "check": "blank_metadata", "record": rid,
                                 "field": sem, "detail": f"blank {sem}"})
        # v2.1: dedicated Capture Source gate finding — the first gate for human review.
        # Carries actor provenance so the classifier can deterministically route it.
        if f.get(F["capture_source"]) in (None, "", [], {}):
            findings.append({"severity": "medium", "check": "capture_source_blank", "record": rid,
                             "proposed_by_agent": _sel(f.get(F["proposed_by_agent"])),
                             "evidence": rid,
                             "detail": f"blank Capture Source (proposed_by {_sel(f.get(F['proposed_by_agent']))!r})"})
        sd = f.get(F["source_documents"]) or []
        for l in sd:
            lid = l["id"] if isinstance(l, dict) else l
            linked_refs.add(lid)
            if lid not in source_ids:
                findings.append({"severity": "medium", "check": "orphaned_source_link", "record": rid,
                                 "detail": f"linked Source Document {lid} missing"})
        if not sd and not f.get(F["capture_source"]):
            findings.append({"severity": "low", "check": "no_provenance", "record": rid,
                             "detail": "no Source Documents and no Capture Source"})
        if _sel(f.get(F["record_type"])) == "Amendment" and not f.get(F["supersedes_trusted_truth_id"]):
            findings.append({"severity": "low", "check": "amendment_missing_supersedes", "record": rid,
                             "detail": "Amendment without Supersedes Trusted Truth ID"})
        if status == "Draft" and created:
            try:
                if datetime.fromisoformat(created.replace("Z", "+00:00")) < stale_cutoff:
                    findings.append({"severity": "low", "check": "stale_draft", "record": rid,
                                     "detail": f"Draft since {created[:10]} (> {STALE_DAYS_DEFAULT}d)"})
            except Exception:
                pass

    for s in sources:
        f = s.get("fields", {})
        rid = s["id"]
        cur = rec_hash(s)
        key = f"source:{rid}"
        p = prior.get(key, {})
        changed = p.get("current_hash") != cur
        fingerprints.append({"object_key": key, "base_id": BASE_WORKSHOP, "table_id": T_SOURCE_DOCS,
                             "record_id": rid, "object_type": "Source", "current_hash": cur,
                             "previous_hash": p.get("current_hash", ""), "last_seen": now_iso,
                             "last_changed": now_iso if changed else "", "last_run_id": run_id,
                             "state": "Active" if changed or not p else "Unchanged"})
        ld = f.get(SD["linked_drafts"]) or []
        if not ld and rid not in linked_refs:
            findings.append({"severity": "low", "check": "orphaned_source", "record": rid,
                             "detail": "Source with no Linked Drafts and not referenced"})

    brains = list_all(BASE_REGISTRY, T_REGISTRY_BRAINS, read_token)
    for b in brains:
        f = b.get("fields", {})
        if _sel(f.get(BR["status"])) == "Active":
            if not f.get(BR["trusted_base_id"]):
                findings.append({"severity": "high", "check": "registry_missing_trusted_base",
                                 "record": b["id"], "detail": f"active brain {f.get(BR['brain_slug'])!r} no Trusted Base"})
            if not f.get(BR["workshop_base_id"]):
                findings.append({"severity": "medium", "check": "registry_missing_workshop_base",
                                 "record": b["id"], "detail": f"active brain {f.get(BR['brain_slug'])!r} no Workshop Base"})
        fingerprints.append({"object_key": f"registry:{f.get(BR['brain_slug'])}", "base_id": BASE_REGISTRY,
                             "table_id": T_REGISTRY_BRAINS, "record_id": b["id"], "object_type": "Registry",
                             "current_hash": rec_hash(b), "last_seen": now_iso, "last_run_id": run_id, "state": "Active"})

    # --- Trusted RECORD reads (defect 3): bounded, fingerprinted, contradiction
    trusted_records_read = 0
    trusted_text_seen = {}
    for t in trusted:
        tb = t.get("trusted_base")
        if not tb:
            continue
        try:
            tables = _req("GET", f"/meta/bases/{tb}/tables", read_token).get("tables", [])
        except ReadError:
            findings.append({"severity": "medium", "check": "trusted_unreadable", "record": None,
                             "detail": f"Trusted base {tb} not readable"})
            continue
        for tbl in tables[:TRUSTED_TABLE_READ_CAP]:
            tid = tbl.get("id")
            try:
                recs = list_all(tb, tid, read_token, page_cap=TRUSTED_RECORD_READ_CAP)
            except ReadError:
                findings.append({"severity": "medium", "check": "trusted_table_unreadable", "record": None,
                                 "detail": f"Trusted table {tb}/{tid} not readable"})
                continue
            for rec in recs:
                trusted_records_read += 1
                rf = rec.get("fields", {})
                cur = rec_hash(rec)
                # v1.8: physical identity key — base + table + record, unique within run
                key = f"trusted:{tb}:{tid}:{rec['id']}"
                p = prior.get(key, {})
                changed = p.get("current_hash") != cur
                fingerprints.append({"object_key": key, "base_id": tb, "table_id": tid,
                                     "record_id": rec["id"], "object_type": "Trusted Truth",
                                     "current_hash": cur, "previous_hash": p.get("current_hash", ""),
                                     "last_seen": now_iso, "last_changed": now_iso if changed else "",
                                     "last_run_id": run_id, "state": "Active" if changed or not p else "Unchanged"})
                # contradiction candidate: Trusted text that also appears in a Workshop Draft
                ttext = _norm(" ".join(str(v) for v in rf.values() if isinstance(v, str)))
                if ttext:
                    th = sha(ttext)
                    trusted_text_seen[th] = rec["id"]
                    if th in seen_texts:
                        findings.append({"severity": "high", "check": "workshop_trusted_contradiction",
                                         "record": seen_texts[th],
                                         "detail": f"Workshop Draft text matches Trusted record {rec['id']}"})

    unchanged = [fp for fp in fingerprints if fp["state"] == "Unchanged"]
    for fp in unchanged[:max(1, sample)]:
        fp["last_sampled"] = now_iso

    # prior-unresolved findings from the V1 queue (defect 4)
    for u in v1_queue["unresolved"]:
        findings.append({"severity": "low", "check": "prior_unresolved_v1", "record": None,
                         "detail": f"V1 {u.get(AV['amendment_version_id'])} ({u.get(AV['action_class'])}) awaiting V2"})

    aggregates = _aggregate(findings)
    overflow = aggregates["total"] > CAP_FINDING_DETAILS  # backlog present (flag, not a stop)

    # missing objects = prior fingerprint keys no longer present this run (reported even when 0)
    current_keys = {fp["object_key"] for fp in fingerprints}
    missing_objects = len([k for k in prior if k not in current_keys])

    # record loader for candidate before-snapshot/hash: serve live Draft fields from memory
    draft_fields_by_id = {d["id"]: d.get("fields", {}) for d in drafts}
    def record_loader(rec_id):
        return draft_fields_by_id.get(rec_id)

    # v1.5: build EXACT-VALUE candidates (complete evidence + before snapshot/hash +
    # after payload + report record ID). Never a placeholder. Under overflow all Amber.
    pending = v1_queue["unresolved_dedupe_keys"]
    candidates, actionable_total = select_candidates(findings, CAP_V1_AMENDMENTS, pending, record_loader)

    # v1.8: stamp Amendment Version IDs from the Auditor's OWN execution run, then
    # preflight identity guards BEFORE any write (zero writes + kill on any collision).
    for i, am in enumerate(candidates):
        am["amendment_version_id"] = am.get("amendment_version_id") or f"cav-{exec_run_id}-{i}-v1"
    existing_primary_ids = load_existing_amendment_primary_ids(read_token) if write else set()
    if write and candidates:
        _preflight_amendment_ids(candidates, existing_primary_ids)
        _preflight_dedupe_keys(candidates)

    written_fp = 0
    written_av = 0
    if write:
        # Fingerprint key uniqueness preflight BEFORE any fingerprint write.
        _preflight_fingerprint_keys(fingerprints)
        # Fingerprints ALWAYS upsert after successful schema/Trusted reads — including
        # first-baseline and overflow runs. Never blocked by backlog size.
        written_fp = write_fingerprints(fingerprints, prior, control_token)
        for i, am in enumerate(candidates):
            # v1.7/1.8: construct the COMPLETE pen record via the canonical builder —
            # exec run identity, Stage, Verdict, adapter version, actor, report record ID,
            # amendment_version_id, tier — all injected here, before the strict writer.
            am = dict(am)
            if overflow:
                am["tier"] = "Amber"  # backlog present: every proposal is Amber
            pen_record = build_pen_record(am, exec_run_id, v1_report_record_id)
            write_v1_amendment(pen_record, exec_run_id, control_token)  # pen refuses incomplete rows
            written_av += 1

    return {"adapter_version": EXECUTOR_ADAPTER_VERSION,
            "auditor_implementation_version": SKILL_IMPLEMENTATION_VERSION,  # report metadata
            "role": ROLE, "generated_at": now_iso,
            "run_id": run_id, "execution_run_id": exec_run_id,
            "first_baseline": first_baseline,
            "trusted_bases": trusted,
            "counts": {"drafts": len(drafts), "sources": len(sources),
                       "trusted_records_read": trusted_records_read,
                       "findings_total": aggregates["total"],
                       "findings_by_severity": aggregates["by_severity"],
                       "findings_by_check": aggregates["by_check"],
                       "actionable_findings": actionable_total,
                       "fingerprints_written": written_fp, "v1_amendments_written": written_av,
                       "unresolved_v1_queue": v1_queue["count"],
                       "missing_objects": missing_objects,
                       "unchanged_sampled": len(unchanged[:max(1, sample)])},
            "findings_detail_cap": CAP_FINDING_DETAILS,
            "findings_overflow": overflow,  # backlog present; proposals all Amber, NOT suppressed
            "proposals_all_amber": overflow and written_av > 0,
            # complete aggregates first; detail truncated to the report cap AFTER aggregation
            "findings": findings[:CAP_FINDING_DETAILS],
            "fingerprints": fingerprints}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--sample", type=int, default=20)
    ap.add_argument("--run-id", default="")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--amendments", default=None)
    ap.add_argument("--v1-report-record-id", default="")
    ap.add_argument("--execution-run-id", default="")
    args = ap.parse_args()

    read_token = _tok(ENV_READ)
    control_token = _tok(ENV_V1_CONTROL_WRITE)

    problems = validate_schema(read_token)
    if problems:
        print(json.dumps({"kill": "schema validation failed", "problems": problems}, indent=2))
        sys.exit(2)

    amendments = None
    if args.amendments:
        with open(args.amendments) as fh:
            amendments = json.load(fh)

    try:
        result = run_audit(read_token, control_token, args.sample, args.run_id, args.write,
                           amendments, args.v1_report_record_id, args.execution_run_id)
    except (KillEvent, PenRefusal) as k:
        print(json.dumps({"kill": str(k), "execute_none": True}, indent=2))
        sys.exit(3)

    with open(args.out, "w") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
    print(json.dumps({"wrote": args.out, "first_baseline": result["first_baseline"],
                      "counts": result["counts"],
                      "findings_overflow": result["findings_overflow"],
                      "proposals_all_amber": result["proposals_all_amber"]}))


if __name__ == "__main__":
    main()
