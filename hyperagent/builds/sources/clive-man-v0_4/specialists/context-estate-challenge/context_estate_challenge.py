#!/usr/bin/env python3
"""
context_estate_challenge.py — Challenger for Clive's Man Daily Context Review.
v3 runtime fallback — role-scoped.

Independently re-reads targeted Airtable objects/evidence (never trusts V1
prose), then writes immutable V2 Amendment Versions (Stage=V2, Supersedes V1,
Cleared/Held/Rejected) through the V2 control credential. The pen enforces
stage + actor + target table. Owns Amber→Green tier promotion (Pam R5): Green
only with a prior Applied event for that action class + exact adapter version.
NO V1 writer, NO fingerprint mutation, NO executor, NO Draft/Trusted mutation.

Credentials:
  CONTEXT_CHALLENGE_READ    (read: Workshop, Registry, Trusted ro)
  CONTEXT_V2_CONTROL_WRITE  (write: Workshop — V2 Amendment Versions only)

Usage:
  python3 context_estate_challenge.py --v1 /tmp/v1_amendments.json \
      --run-id <root> --out /tmp/v2_results.json [--write]
"""

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error

# D3 (2026-08-17): fail loudly on a runtime older than 3.9.
assert sys.version_info >= (3, 9), "Daily Context Review scripts require Python >= 3.9"

from context_config import (
    ADAPTER_VERSION, EXECUTOR_ADAPTER_VERSION, CHALLENGE_IMPLEMENTATION_VERSION,
    SUPPORTED_EXECUTOR_VERSIONS, ROLE, BASE_WORKSHOP, BASE_REGISTRY,
    T_DRAFT_TRUTH, T_AMENDMENT_VERSIONS, T_EXECUTION_EVENTS, T_REGISTRY_BRAINS,
    F, AV, EE, BR, REQUIRED_SCHEMA,
    V2_STAGE, V2_VERDICTS, CHALLENGER_WRITE_TABLES,
    ENV_CHALLENGE_READ, ENV_V2_CONTROL_WRITE,
    canonical_snapshot,
)

API = "https://api.airtable.com/v0"


class ReadError(Exception):
    pass


class KillEvent(Exception):
    pass


class PenRefusal(Exception):
    pass


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


def get_record(base, table, record_id, token):
    return _req("GET", f"/{base}/{table}/{record_id}?returnFieldsByFieldId=true", token)


def list_all(base, table, token, field_ids=None):
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


def list_unchallenged_v1_amendments(read_token):
    """Stage=V1 rows with no V2 descendant — actor-agnostic queue for Challenger."""
    rows = list_all(
        BASE_WORKSHOP,
        T_AMENDMENT_VERSIONS,
        read_token,
        [
            AV["amendment_version_id"],
            AV["stage"],
            AV["supersedes_version"],
            AV["created_by_agent"],
            AV["dedupe_key"],
        ],
    )
    v1_by_id = {}
    superseded = set()
    for r in rows:
        f = r.get("fields", {})
        stage = _sel(f.get(AV["stage"]))
        avid = f.get(AV["amendment_version_id"])
        if stage == "V1" and avid:
            v1_by_id[avid] = r
        elif stage == "V2":
            sup = f.get(AV["supersedes_version"])
            if sup:
                superseded.add(sup)
    return [
        {"amendment_version_record_id": r["id"], "amendment_version_id": r.get("fields", {}).get(AV["amendment_version_id"])}
        for avid, r in sorted(v1_by_id.items())
        if avid not in superseded
    ]


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


def _sel(v):
    return v.get("name") if isinstance(v, dict) else v


def canonical(record_fields):
    return json.dumps(record_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def discover_trusted_bases(token):
    brains = list_all(BASE_REGISTRY, T_REGISTRY_BRAINS, token)
    trusted = [b.get("fields", {}) for b in brains
               if _sel(b.get("fields", {}).get(BR["status"])) == "Active"
               and b.get("fields", {}).get(BR["trusted_base_id"])]
    if not trusted:
        raise KillEvent("Trusted-base discovery returned zero active brains — kill event")
    return trusted


def load_v1_row(amendment_version_record_id, token):
    """Independently load the V1 Amendment Version row; verify it is V1."""
    row = get_record(BASE_WORKSHOP, T_AMENDMENT_VERSIONS, amendment_version_record_id, token)
    f = row.get("fields", {})
    if _sel(f.get(AV["stage"])) != "V1":
        raise KillEvent(f"{amendment_version_record_id}: Stage is {_sel(f.get(AV['stage']))!r}, not V1")
    return row


def prior_applied_for_class(action_class, token):
    """True if any Execution Event is Applied for this action class + the exact
    current adapter version (Pam R5 — Challenger owns Amber→Green promotion)."""
    rows = list_all(BASE_WORKSHOP, T_EXECUTION_EVENTS, token,
                    [EE["event_type"], EE["applied_payload"]])
    for r in rows:
        f = r.get("fields", {})
        if _sel(f.get(EE["event_type"])) != "Applied":
            continue
        raw = f.get(EE["applied_payload"])
        try:
            payload = json.loads(raw) if raw else {}
        except Exception:
            payload = {}
        if payload.get("action_class") == action_class and payload.get("adapter_version") == ADAPTER_VERSION:
            return True
    return False


def _pen_write(control_token, fields):
    if fields.get(AV["stage"]) != V2_STAGE:
        raise PenRefusal("Challenger pen writes Stage=V2 only")
    if fields.get(AV["challenger_verdict"]) not in V2_VERDICTS:
        raise PenRefusal("Challenger pen writes Verdict Cleared/Held/Rejected only")
    if fields.get(AV["created_by_agent"]) != ROLE:
        raise PenRefusal(f"Challenger pen writes Created By Agent={ROLE} only")
    if not fields.get(AV["supersedes_version"]) and not fields.get(AV["supersedes_version_link"]):
        raise PenRefusal("Challenger pen requires Supersedes V1")
    _req("POST", f"/{BASE_WORKSHOP}/{T_AMENDMENT_VERSIONS}?returnFieldsByFieldId=true",
         control_token, {"records": [{"fields": fields}]})


# Mandatory V1 fields for an EXECUTABLE plan (v1.1). A malformed V1 missing any of
# these is NOT challenged as an executable plan — it gets a Held/Rejected V2 with
# explicit defect reasons and NO action payload for the Executor.
_V1_EXECUTABLE_REQUIRED = {
    "before_snapshot": AV["before_snapshot"],
    "before_hash": AV["before_hash"],
    "after_payload": AV["after_payload"],
    "evidence": AV["evidence"],
    "confidence": AV["confidence"],
    "v1_report_record_id": AV["v1_report_record_id"],
}
_CREATE_CLASSES = {"CREATE_DRAFT_TRUTH", "CREATE_AMENDMENT_DRAFT", "CREATE_SUPERSEDING_DRAFT"}
_FIELD_CLASSES = {"FILL_BLANK_DRAFT_METADATA"}


def v1_defects(v1_fields):
    """Return a list of defect strings for a malformed V1 (empty = valid)."""
    defects = []
    action = _sel(v1_fields.get(AV["action_class"]))
    for name, fid in _V1_EXECUTABLE_REQUIRED.items():
        if v1_fields.get(fid) in (None, "", [], {}):
            # creates legitimately have no before snapshot/hash
            if name in ("before_snapshot", "before_hash") and action in _CREATE_CLASSES:
                continue
            defects.append(f"missing {name}")
    if action in _FIELD_CLASSES and v1_fields.get(AV["target_field_id"]) in (None, "", [], {}):
        defects.append("missing target_field_id")
    if action not in _CREATE_CLASSES and v1_fields.get(AV["target_record_id"]) in (None, "", [], {}):
        defects.append("missing target_record_id")
    # v1.2: V1 "Adapter Version" must be a SUPPORTED executor contract version.
    # A wrong/unsupported executor version = non-actionable (Held/Rejected V2).
    av = v1_fields.get(AV["adapter_version"])
    if av not in SUPPORTED_EXECUTOR_VERSIONS:
        defects.append(f"unsupported executor adapter_version {av!r}")
    return defects


# --- Capture Source verification (v1.3) -----------------------------------------
from context_config import (CAPTURE_SOURCE_FIELD, CAPTURE_SOURCE_CHOICES,
                            CHAT_CAPTURE_ACTORS, CHAT_SESSION_CREATE_ACTORS,
                            CHAT_BACKFILL_CLEAR_CAP)


def _payload_value(after_payload_raw, sem_key):
    try:
        p = json.loads(after_payload_raw) if after_payload_raw else {}
    except Exception:
        return None
    if not isinstance(p, dict):
        return None
    if sem_key in p:
        return p[sem_key]
    fields = p.get("fields")
    if isinstance(fields, dict) and sem_key in fields:
        return fields[sem_key]
    return None


def verify_capture_source(v1_fields, draft_fields=None):
    """Independently verify the Capture Source classification on a V1 that fills it.
    Returns None when valid+supported, else a defect reason string.
    Rules: value must be an exact live choice AND evidence/provenance must support it.
      CREATE_DRAFT_TRUTH chat create: Created By Agent in CHAT_SESSION_CREATE_ACTORS
        (Ambient thread scan or Activity Intake twins), evidence non-empty, no target
        record — no blank-target draft requirement.
      Legacy backfill: Chat Session via allowed chat-capture actor on existing blank draft.
      External: proven external Source Document/URL/sentinel.
      User Guided: direct human request evidence (never merely Created By).
    Ambiguous/missing/invalid -> defect (Held/Rejected V2 downstream)."""
    choice = _payload_value(v1_fields.get(AV["after_payload"]), "capture_source")
    if choice is None:
        return None  # not a capture-source action -> nothing to verify
    if choice not in CAPTURE_SOURCE_CHOICES:
        return f"capture_source {choice!r} not a live choice"
    action = _sel(v1_fields.get(AV["action_class"]))
    has_target = v1_fields.get(AV["target_record_id"]) not in (None, "", [], {})
    if choice == "Chat Session":
        if action == "CREATE_DRAFT_TRUTH" and not has_target:
            created_by = _sel(v1_fields.get(AV["created_by_agent"]))
            if created_by in CHAT_SESSION_CREATE_ACTORS and v1_fields.get(AV["evidence"]):
                return None
            return "Chat Session CREATE lacks allowed intake actor, evidence, or has unexpected target"
        proposed_by = _sel((draft_fields or {}).get("proposed_by_agent")) if draft_fields else None
        cur_cs = (draft_fields or {}).get(CAPTURE_SOURCE_FIELD) if draft_fields else None
        cur_cs_name = _sel(cur_cs) if isinstance(cur_cs, dict) else cur_cs
        if proposed_by in CHAT_CAPTURE_ACTORS and cur_cs_name in (None, ""):
            return None  # legacy blank-target backfill path
        return "Chat Session classification lacks ambient-actor provenance or non-blank target"
    if choice == "External Context Capture":
        if v1_fields.get(AV["evidence"]):
            return None
        return "External classification lacks proven external evidence"
    if choice == "User Guided Capture":
        if v1_fields.get(AV["evidence"]):
            return None
        return "User Guided classification lacks direct human request evidence"
    return "unclassifiable capture_source"


def build_v2_row(v1_fields, v1_record_id, verdict, tier, run_id, repairs=None,
                 live_draft_fields=None):
    repairs = repairs or {}
    fields = {
        AV["amendment_version_id"]: v1_fields.get(AV["amendment_version_id"], "").replace("-v1", "-v2") or None,
        AV["run_id"]: run_id,
        AV["stage"]: V2_STAGE,
        AV["challenger_verdict"]: verdict,
        AV["supersedes_version"]: v1_fields.get(AV["amendment_version_id"]),
        AV["target_base_id"]: repairs.get("target_base_id", v1_fields.get(AV["target_base_id"])),
        AV["target_table_id"]: repairs.get("target_table_id", v1_fields.get(AV["target_table_id"])),
        AV["action_class"]: repairs.get("action_class", v1_fields.get(AV["action_class"])),
        AV["adapter_version"]: repairs.get("adapter_version", v1_fields.get(AV["adapter_version"])),
        AV["reason"]: repairs.get("reason", v1_fields.get(AV["reason"], "")),
        AV["evidence"]: repairs.get("evidence", v1_fields.get(AV["evidence"], "")),
        AV["tier"]: tier,
        AV["dedupe_key"]: repairs.get("dedupe_key", v1_fields.get(AV["dedupe_key"])),
        AV["created_by_agent"]: ROLE,
    }
    if v1_record_id:
        fields[AV["supersedes_version_link"]] = [v1_record_id]
    for opt in ("target_record_id", "target_field_id", "v1_report_url", "v1_report_record_id",
                "after_payload", "confidence", "target_draft"):
        if v1_fields.get(AV[opt]) is not None:
            fields[AV[opt]] = repairs.get(opt, v1_fields.get(AV[opt]))

    action_class = fields.get(AV["action_class"])
    stale_hold = None
    if action_class == "CREATE_DRAFT_TRUTH":
        pass
    elif live_draft_fields is None:
        if v1_fields.get(AV["target_record_id"]):
            stale_hold = "target gone or unreadable at V2-write"
    else:
        status = _sel(live_draft_fields.get(F["status"]))
        if action_class == "QUARANTINE_DRAFT" and status and status != "Draft":
            stale_hold = "premise broken: status no longer Draft"
        elif action_class == "FILL_BLANK_DRAFT_METADATA":
            tfid = fields.get(AV["target_field_id"]) or v1_fields.get(AV["target_field_id"])
            cur = live_draft_fields.get(tfid) if tfid else None
            if cur not in (None, ""):
                stale_hold = "premise broken: target field no longer blank"
        if stale_hold is None:
            before_snap = canonical_snapshot(live_draft_fields)
            fields[AV["before_snapshot"]] = before_snap
            fields[AV["before_hash"]] = sha(before_snap)
            old_hash = v1_fields.get(AV["before_hash"])
            if old_hash and old_hash != fields[AV["before_hash"]]:
                fields[AV["reason"]] = (fields.get(AV["reason"]) or "") + " rebuilt from live read"

    if stale_hold:
        verdict = "Held"
        fields[AV["challenger_verdict"]] = verdict
        fields[AV["tier"]] = "Amber"
        fields[AV["reason"]] = stale_hold
        for fid in (AV["before_snapshot"], AV["before_hash"], AV["after_payload"],
                    AV["target_field_id"]):
            fields.pop(fid, None)

    if verdict == "Held":
        fields[AV["human_decision_needed"]] = True
    return fields


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--v1", help="JSON list of {amendment_version_record_id, proposed_verdict, repairs?}")
    ap.add_argument("--list-unchallenged", action="store_true",
                    help="Print actor-agnostic Stage=V1 rows without V2 descendant")
    ap.add_argument("--run-id", required=False)
    ap.add_argument("--out", required=False)
    ap.add_argument("--v2-report-record-id", default="")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    read_token = _tok(ENV_CHALLENGE_READ)

    if args.list_unchallenged:
        print(json.dumps(list_unchallenged_v1_amendments(read_token), indent=2))
        return

    if not args.v1 or not args.run_id or not args.out:
        ap.error("--v1, --run-id, and --out are required unless --list-unchallenged")

    control_token = _tok(ENV_V2_CONTROL_WRITE)

    problems = validate_schema(read_token)
    if problems:
        print(json.dumps({"kill": "schema validation failed", "problems": problems}, indent=2))
        sys.exit(2)

    discover_trusted_bases(read_token)  # kill event if empty

    with open(args.v1) as fh:
        v1_list = json.load(fh)

    results = []
    written = 0
    for item in v1_list:
        rec_id = item["amendment_version_record_id"]
        try:
            v1_row = load_v1_row(rec_id, read_token)
            v1_fields = v1_row.get("fields", {})
            action_class = v1_fields.get(AV["action_class"])

            # v1.1: malformed V1 -> Held/Rejected V2 with explicit defect reasons,
            # NO action payload for the Executor (before/after/payload/field dropped).
            defects = v1_defects(v1_fields)
            draft_fields = None
            target_rid = v1_fields.get(AV["target_record_id"])
            if target_rid:
                try:
                    draft_row = get_record(BASE_WORKSHOP, T_DRAFT_TRUTH, target_rid, read_token)
                    draft_fields = draft_row.get("fields", {})
                except ReadError:
                    defects = list(defects) + ["target draft unreadable for capture-source verify"]
            cs_defect = verify_capture_source(v1_fields, draft_fields)
            if cs_defect:
                defects = list(defects) + [cs_defect]
            if defects:
                verdict = "Rejected" if item.get("proposed_verdict") == "Rejected" else "Held"
                v2_fields = build_v2_row(v1_fields, rec_id, verdict, "Amber", args.run_id,
                                         live_draft_fields=draft_fields)
                # strip any executable payload so the Executor sees nothing actionable
                for fid in (AV["before_snapshot"], AV["before_hash"], AV["after_payload"],
                            AV["target_field_id"]):
                    v2_fields.pop(fid, None)
                v2_fields[AV["reason"]] = "MALFORMED V1: " + "; ".join(defects)
                v2_fields[AV["human_decision_needed"]] = True
                if args.v2_report_record_id:
                    v2_fields[AV["v2_report_record_id"]] = args.v2_report_record_id
                if args.write:
                    _pen_write(control_token, v2_fields)
                    written += 1
                results.append({"v1": rec_id, "verdict": verdict, "tier": "Amber",
                                "malformed": True, "defects": defects, "ok": True})
                continue

            verdict = item.get("proposed_verdict", "Held")
            # Amber→Green promotion (Pam R5): Green only with a prior Applied.
            tier = "Green" if prior_applied_for_class(action_class, read_token) else "Amber"
            if verdict == "Held" or v1_fields.get(AV["human_decision_needed"]):
                tier = "Amber"
            v2_fields = build_v2_row(v1_fields, rec_id, verdict, tier, args.run_id,
                                     item.get("repairs"), live_draft_fields=draft_fields)
            if args.v2_report_record_id:
                v2_fields[AV["v2_report_record_id"]] = args.v2_report_record_id
            if args.write:
                _pen_write(control_token, v2_fields)
                written += 1
            results.append({"v1": rec_id, "verdict": verdict, "tier": tier, "ok": True})
        except (KillEvent, PenRefusal, ReadError) as e:
            results.append({"v1": rec_id, "ok": False, "error": str(e)})

    with open(args.out, "w") as fh:
        json.dump({"role": ROLE, "run_id": args.run_id, "written": written,
                   "executor_adapter_version": EXECUTOR_ADAPTER_VERSION,
                   "challenge_implementation_version": CHALLENGE_IMPLEMENTATION_VERSION,
                   "results": results}, fh, indent=2, ensure_ascii=False)
    print(json.dumps({"written": written, "processed": len(results),
                      "failures": sum(1 for r in results if not r["ok"])}))


if __name__ == "__main__":
    main()
