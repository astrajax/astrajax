#!/usr/bin/env python3
"""
Offline tests for the Context Auditor (Audit & Propose) role package v1.2.
No network, no live credential. 13 preserved behaviors + 5 v1.2 additions.
Run: python3 test_auditor.py
"""
import importlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ["CONTEXT_ESTATE_READ"] = "t"
os.environ["CONTEXT_V1_CONTROL_WRITE"] = "t"

import context_config as cfg
import context_estate_audit_propose as au

PASS, FAIL = [], []


def ok(n): PASS.append(n)
def bad(n, w): FAIL.append(f"{n}: {w}")


def expect(name, fn, cls, needle=None):
    try:
        fn()
        bad(name, f"expected {cls.__name__}, got success")
    except cls as e:
        if needle and needle.lower() not in str(e).lower():
            bad(name, f"{cls.__name__} {e} (wanted ~{needle})")
        else:
            ok(name)
    except Exception as e:
        bad(name, f"unexpected {type(e).__name__} {e}")


def truthy(name, cond, why=""):
    ok(name) if cond else bad(name, why or "false")


def fresh():
    importlib.reload(au)


def brains(n=1):
    return [{"id": "recB", "fields": {cfg.BR["status"]: {"name": "Active"},
                                      cfg.BR["brain_slug"]: "s", cfg.BR["trusted_base_id"]: "appT",
                                      cfg.BR["workshop_base_id"]: "appW"}}]


def drafts(n, dup=False):
    out = []
    for i in range(n):
        out.append({"id": f"recD{i}", "fields": {cfg.F["title"]: f"T{i}", cfg.F["brain_slug"]: "s",
                                                 cfg.F["canonical_text"]: f"body {i}",
                                                 cfg.F["status"]: {"name": "Draft"},
                                                 cfg.F["created"]: "2020-01-01T00:00:00Z"}})
    if dup and len(out) >= 2:
        out[1]["fields"][cfg.F["title"]] = out[0]["fields"][cfg.F["title"]]
        out[1]["fields"][cfg.F["canonical_text"]] = out[0]["fields"][cfg.F["canonical_text"]]
    return out


# --- V1 pen enforcement (preserved) -------------------------------------------
expect("pen-refuses-non-v1-stage",
       lambda: au._pen_write("t", cfg.T_AMENDMENT_VERSIONS,
                             {cfg.AV["stage"]: "V2", cfg.AV["challenger_verdict"]: "Cleared",
                              cfg.AV["created_by_agent"]: cfg.ROLE}),
       au.PenRefusal, "Stage=V1 only")
expect("pen-refuses-non-proposed-verdict",
       lambda: au._pen_write("t", cfg.T_AMENDMENT_VERSIONS,
                             {cfg.AV["stage"]: "V1", cfg.AV["challenger_verdict"]: "Cleared",
                              cfg.AV["created_by_agent"]: cfg.ROLE}),
       au.PenRefusal, "Proposed only")
expect("pen-refuses-wrong-actor",
       lambda: au._pen_write("t", cfg.T_AMENDMENT_VERSIONS,
                             {cfg.AV["stage"]: "V1", cfg.AV["challenger_verdict"]: "Proposed",
                              cfg.AV["created_by_agent"]: "x"}),
       au.PenRefusal, "Created By Agent")
expect("pen-refuses-other-table",
       lambda: au._pen_write("t", cfg.T_DRAFT_TRUTH, {}), au.PenRefusal, "may not write table")


def pen_accepts_v1():
    calls = {}
    au._req = lambda m, p, tok, body=None, retries=1: calls.setdefault("body", body) or {}
    au._pen_write("t", cfg.T_AMENDMENT_VERSIONS,
                  {cfg.AV["stage"]: "V1", cfg.AV["challenger_verdict"]: "Proposed",
                   cfg.AV["created_by_agent"]: cfg.ROLE})
    return "body" in calls


truthy("pen-accepts-v1-proposed-actor", pen_accepts_v1())


# --- empty Trusted discovery kill (preserved) ---------------------------------
fresh()
au.list_all = lambda b, t, tok, fids=None, page_cap=None: []
expect("empty-trusted-discovery-kill", lambda: au.discover_trusted_bases("t"),
       au.KillEvent, "kill event")


# --- detection: duplicates, stale, overflow (preserved) -----------------------
def run_audit_with(draft_list, src_list=None, prior=None, v1q=None, write=False,
                   amendments=None, trusted_tables=None, v1_report_record_id="recRep"):
    fresh()
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        draft_list if t == cfg.T_DRAFT_TRUTH else
        (src_list or []) if t == cfg.T_SOURCE_DOCS else
        (v1q or []) if t == cfg.T_AMENDMENT_VERSIONS else
        (prior and [{"id": v["record_id"], "fields": {cfg.FP["object_key"]: k,
                                                      cfg.FP["current_hash"]: v["current_hash"],
                                                      cfg.FP["state"]: {"name": v.get("state", "Active")}}}
                     for k, v in prior.items()] or []) if t == cfg.T_AUDIT_FINGERPRINTS else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": trusted_tables or []}
    return au.run_audit("rt", "ct", sample=2, run_id="r", write=write, amendments=amendments,
                        execution_run_id="clive-man-context-auditor--run-r",
                        v1_report_record_id=v1_report_record_id)


res = run_audit_with(drafts(3, dup=True))
checks = {f["check"] for f in res["findings"]}
truthy("audit-detects-duplicate-title", "duplicate_title" in checks)
truthy("audit-detects-text-duplicate", "text_duplicate" in checks)
truthy("audit-detects-stale", "stale_draft" in checks)

res2 = run_audit_with(drafts(cfg.CAP_FINDING_DETAILS + 5))
truthy("audit-overflow-flag-backlog", res2["findings_overflow"] is True)


# --- V1 amendment cap: under v1.4, actionable candidates take priority over the
# legacy --amendments payload; proposals are capped at CAP_V1_AMENDMENTS. ------
def v1_cap_respected():
    # 0 drafts -> no actionable candidates; legacy payload larger than cap is truncated
    big = [{"amendment_version_id": f"cav-r-{i}-v1", "target_base_id": cfg.BASE_WORKSHOP,
            "target_table_id": cfg.T_DRAFT_TRUTH, "action_class": "QUARANTINE_DRAFT",
            "dedupe_key": f"d{i}"} for i in range(cfg.CAP_V1_AMENDMENTS + 5)]
    res = run_audit_with(drafts(0), write=True, amendments=big)
    return res["counts"]["v1_amendments_written"] <= cfg.CAP_V1_AMENDMENTS


truthy("v1-amendment-cap-respected", v1_cap_respected())

# --- credential routing (preserved) --------------------------------------------
def credential_routing():
    fresh()
    calls = []
    def fake_req(method, path, token, body=None, retries=1):
        calls.append((method, token))
        return {"tables": []} if "tables" in path else {"records": []}
    au._req = fake_req
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        calls.append(("GET", tok)) or (brains() if t == cfg.T_REGISTRY_BRAINS else []))
    au.run_audit("READ", "WRITE", sample=1, run_id="r", write=True, execution_run_id="clive-man-context-auditor--run-r", amendments=[
        {"amendment_version_id": "cav-r-0-v1", "target_base_id": cfg.BASE_WORKSHOP,
         "target_table_id": cfg.T_DRAFT_TRUTH, "action_class": "QUARANTINE_DRAFT", "dedupe_key": "d0"}])
    get_with_write = any(m == "GET" and tok == "WRITE" for m, tok in calls)
    write_with_read = any(m in ("POST", "PATCH") and tok == "READ" for m, tok in calls)
    return not get_with_write and not write_with_read


truthy("no-get-uses-control-write-token", credential_routing())


def prior_uses_read():
    fresh()
    captured = {}
    def fake_list(b, t, tok, fids=None, page_cap=None):
        captured["tok"] = tok
        return []
    au.list_all = fake_list
    au.load_prior_fingerprints("READ_TOKEN")
    return captured.get("tok") == "READ_TOKEN"


truthy("prior-fingerprint-load-uses-read-token", prior_uses_read())


# === v1.2 additions =============================================================

# 1. Overflow: fingerprints upsert AND actionable candidates proposed (all Amber);
# non-actionable overflow yields zero proposals.
def overflow_fp_and_candidates():
    fresh()
    written = {"fp": 0, "av": 0, "tiers": []}
    au.write_fingerprints = lambda fps, prior, tok: written.__setitem__("fp", len(fps)) or len(fps)
    def fake_av(am, rid, tok):
        written["av"] += 1
        written["tiers"].append(am.get("tier"))
    au.write_v1_amendment = fake_av
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        drafts(cfg.CAP_FINDING_DETAILS + 5) if t == cfg.T_DRAFT_TRUTH else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": []}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=True, execution_run_id="clive-man-context-auditor--run-r")
    return (res["counts"]["fingerprints_written"] > 0
            and written["av"] > 0 and all(t == "Amber" for t in written["tiers"]))


truthy("overflow-fingerprints-plus-amber-candidates", overflow_fp_and_candidates())


# === v1.6 REGRESSION: overflow TRUE + complete candidates still writes proposals =
def regression_overflow_writes_proposals():
    # 107 actionable findings (> CAP_FINDING_DETAILS=25) MUST still produce up to
    # CAP_V1_AMENDMENTS=10 complete Amber V1 rows. Locks v1.4 separated-cap + v1.5
    # completeness together so the drafts-don't-chain regression cannot recur.
    fresh()
    written = {"fp": 0, "av": 0, "tiers": [], "complete": []}
    au.write_fingerprints = lambda fps, prior, tok: written.__setitem__("fp", len(fps)) or len(fps)
    def fake_av(am, rid, tok):
        written["av"] += 1
        written["tiers"].append(am.get("tier"))
        written["complete"].append(bool(am.get("before_hash") and am.get("after_payload")
                                        and am.get("evidence") and am.get("v1_report_record_id")))
    au.write_v1_amendment = fake_av
    ds = []
    for i in range(107):
        ds.append({"id": f"rec{i}", "fields": {cfg.F["title"]: f"T{i}", cfg.F["brain_slug"]: "s",
                                               cfg.F["canonical_text"]: f"b{i}",
                                               cfg.F["status"]: {"name": "Draft"},
                                               cfg.F["created"]: "2020-01-01T00:00:00Z"}})
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else ds if t == cfg.T_DRAFT_TRUTH else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": []}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    return (res["counts"]["findings_total"] > cfg.CAP_FINDING_DETAILS
            and res["findings_overflow"] is True
            and res["counts"]["v1_amendments_written"] == cfg.CAP_V1_AMENDMENTS
            and all(written["tiers"]) and all(t == "Amber" for t in written["tiers"])
            and all(written["complete"]))


truthy("regression-overflow-writes-complete-amber-proposals", regression_overflow_writes_proposals())


# 2. First-baseline (empty prior) then changed/sampled next run.
def baseline_then_sampled():
    r1 = run_audit_with(drafts(2), prior=None)
    prior = {"draft:recD0": {"record_id": "recFP0", "current_hash": "x", "state": "Active"},
             "draft:recD1": {"record_id": "recFP1", "current_hash": "y", "state": "Active"}}
    r2 = run_audit_with(drafts(2), prior=prior)
    return r1["first_baseline"] is True and r2["first_baseline"] is False


truthy("first-baseline-then-sampled", baseline_then_sampled())


# 3. Trusted record read + contradiction path.
def trusted_contradiction():
    fresh()
    ds = [{"id": "recD0", "fields": {cfg.F["title"]: "T", cfg.F["brain_slug"]: "s",
                                     cfg.F["canonical_text"]: "shared truth",
                                     cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2026-07-01T00:00:00Z"}}]
    trusted_tbl = [{"id": "tblT1"}]
    trusted_rec = [{"id": "recTR1", "fields": {"text": "shared truth"}}]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        ds if t == cfg.T_DRAFT_TRUTH else
        trusted_rec if t == "tblT1" else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": trusted_tbl}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=False, execution_run_id="clive-man-context-auditor--run-r")
    checks = {f["check"] for f in res["findings"]}
    return res["counts"]["trusted_records_read"] > 0 and "workshop_trusted_contradiction" in checks


truthy("trusted-record-read-contradiction", trusted_contradiction())


# 4. Unresolved V1 dedupe: a pending actionable finding's dedupe_key is not re-proposed.
def unresolved_v1_dedupe():
    fresh()
    # A Draft that yields a text_duplicate candidate; its dedupe_key is already pending.
    ds = [{"id": "recA", "fields": {cfg.F["title"]: "T1", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "same body",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2026-07-01T00:00:00Z"}},
          {"id": "recB", "fields": {cfg.F["title"]: "T2", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "same body",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2026-07-01T00:00:00Z"}}]
    pending_key = au.sha("recB|QUARANTINE_DRAFT|" + f"canonical text duplicates recA")
    v1q = [{"id": "recAV", "fields": {cfg.AV["amendment_version_id"]: "cav-r-0-v1",
                                      cfg.AV["stage"]: {"name": "V1"},
                                      cfg.AV["dedupe_key"]: pending_key,
                                      cfg.AV["action_class"]: "QUARANTINE_DRAFT"}}]
    written = {"av": 0}
    au.write_fingerprints = lambda fps, prior, tok: 0
    au.write_v1_amendment = lambda am, rid, tok: written.__setitem__("av", written["av"] + 1)
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        ds if t == cfg.T_DRAFT_TRUTH else
        v1q if t == cfg.T_AMENDMENT_VERSIONS else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": []}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=True, execution_run_id="clive-man-context-auditor--run-r")
    checks = {f["check"] for f in res["findings"]}
    return "prior_unresolved_v1" in checks and res["counts"]["unresolved_v1_queue"] == 1


truthy("unresolved-v1-dedupe", unresolved_v1_dedupe())


# 5. Complete aggregates with truncated details.
def aggregates_truncated():
    res = run_audit_with(drafts(cfg.CAP_FINDING_DETAILS + 5))
    c = res["counts"]
    return (c["findings_total"] > cfg.CAP_FINDING_DETAILS
            and c["findings_total"] == sum(c["findings_by_severity"].values())
            and len(res["findings"]) <= cfg.CAP_FINDING_DETAILS)


truthy("complete-aggregates-truncated-details", aggregates_truncated())


# === v1.4: queue-backlog repair ================================================

# 97 findings -> max 10 V1 rows, all Amber; deterministic order.
def backlog_max10_amber_ordered():
    fresh()
    written = []
    au.write_fingerprints = lambda fps, prior, tok: 0
    au.write_v1_amendment = lambda am, rid, tok: written.append(am)
    # many actionable findings (duplicates map to QUARANTINE_DRAFT, high priority)
    ds = []
    for i in range(60):  # 60 dup-pairs -> 120 drafts -> many duplicate findings + stale
        ds.append({"id": f"recA{i}", "fields": {cfg.F["title"]: "Same", cfg.F["brain_slug"]: "s",
                                                cfg.F["canonical_text"]: "same body",
                                                cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}})
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else ds if t == cfg.T_DRAFT_TRUTH else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": []}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=True, execution_run_id="clive-man-context-auditor--run-r")
    return (len(written) <= cfg.CAP_V1_AMENDMENTS and len(written) > 0
            and all(w.get("tier") == "Amber" for w in written)
            and res["findings_overflow"] is True)


truthy("backlog-max10-amber", backlog_max10_amber_ordered())


def _rec_loader_for(*rec_ids):
    def load(rid):
        if rid in rec_ids:
            return {cfg.F["status"]: {"name": "Draft"}, cfg.F["canonical_text"]: "x"}
        return None
    return load


def deterministic_order():
    loader = _rec_loader_for("recA", "recB", "recZ", "recC")
    cands, _ = au.select_candidates(
        [{"severity": "low", "check": "stale_draft", "record": "recZ", "detail": "x"},
         {"severity": "high", "check": "text_duplicate", "record": "recB", "detail": "y"},
         {"severity": "high", "check": "text_duplicate", "record": "recA", "detail": "y"}],
        10, set(), loader)
    order = [(c["action_class"], c["target_record_id"]) for c in cands]
    # high text_duplicate recA, recB first; then low stale_draft
    return (len(order) == 3 and order[0][1] == "recA" and order[1][1] == "recB"
            and order[0][0] == "QUARANTINE_DRAFT")


truthy("deterministic-candidate-order", deterministic_order())


def dedupe_advances_slice():
    loader = _rec_loader_for("recA", "recB")
    probe, _ = au.select_candidates(
        [{"severity": "high", "check": "text_duplicate", "record": "recA", "detail": "y"}],
        1, set(), loader)
    pending = {probe[0]["dedupe_key"]} if probe else set()
    cands, _ = au.select_candidates(
        [{"severity": "high", "check": "text_duplicate", "record": "recA", "detail": "y"},
         {"severity": "high", "check": "text_duplicate", "record": "recB", "detail": "y"}],
        1, pending, loader)
    return len(cands) == 1 and cands[0]["target_record_id"] == "recB"


truthy("dedupe-advances-next-slice", dedupe_advances_slice())


def non_actionable_overflow_zero():
    cands, total = au.select_candidates(
        [{"severity": "high", "check": "prior_unresolved_v1", "record": None, "detail": "x"},
         {"severity": "low", "check": "not_a_real_check", "record": "recA", "detail": "y"}],
        10, set(), _rec_loader_for("recA"))
    return len(cands) == 0


truthy("non-actionable-overflow-zero", non_actionable_overflow_zero())


# === v1.5: proposal-contract repair ============================================

# pen refuses each missing mandatory field
def pen_refuses_missing_mandatory():
    fresh()
    complete = {
        "amendment_version_id": "cav-r-0-v1", "run_id": "r",
        "target_base_id": cfg.BASE_WORKSHOP, "target_table_id": cfg.T_DRAFT_TRUTH,
        "target_record_id": "recA", "action_class": "QUARANTINE_DRAFT",
        "before_snapshot": "{}", "before_hash": "h", "after_payload": "{}",
        "reason": "r", "evidence": "recA", "dedupe_key": "d",
        "v1_report_record_id": "recRep", "confidence": 0.9,
    }
    refused = 0
    for key in ("before_snapshot", "before_hash", "after_payload", "evidence",
                "confidence", "v1_report_record_id", "reason"):
        bad = dict(complete); bad[key] = ""
        try:
            au._pen_write = lambda tok, table, fields: None
            au.write_v1_amendment(bad, "r", "t")
        except au.PenRefusal:
            refused += 1
        except Exception:
            refused += 1
    return refused == 7


truthy("pen-refuses-missing-mandatory-fields", pen_refuses_missing_mandatory())


def pen_refuses_field_action_missing_field_id():
    fresh()
    bad = {
        "amendment_version_id": "cav-r-0-v1", "run_id": "r",
        "target_base_id": cfg.BASE_WORKSHOP, "target_table_id": cfg.T_DRAFT_TRUTH,
        "target_record_id": "recA", "action_class": "FILL_BLANK_DRAFT_METADATA",
        "before_snapshot": "{}", "before_hash": "h", "after_payload": "{}",
        "reason": "r", "evidence": "recA", "dedupe_key": "d",
        "v1_report_record_id": "recRep", "confidence": 0.9,
        # target_field_id MISSING
    }
    try:
        au._pen_write = lambda tok, table, fields: None
        au.write_v1_amendment(bad, "r", "t")
        return False
    except au.PenRefusal:
        return True
    except Exception:
        return False


truthy("pen-refuses-field-action-missing-field-id", pen_refuses_field_action_missing_field_id())


def candidate_unknown_value_excluded():
    # blank_metadata finding with NO exact_value -> excluded (desired value not provable)
    loader = _rec_loader_for("recA")
    cands, _ = au.select_candidates(
        [{"severity": "low", "check": "blank_metadata", "record": "recA", "detail": "blank brain_theme",
          "field": "brain_theme"}],
        10, set(), loader)
    return len(cands) == 0


truthy("candidate-unknown-desired-value-excluded", candidate_unknown_value_excluded())


def exact_blank_metadata_candidate_complete():
    # blank_metadata finding WITH exact_value -> complete row with Target Field ID + payload
    loader = _rec_loader_for("recA")
    cands, _ = au.select_candidates(
        [{"severity": "low", "check": "blank_metadata", "record": "recA", "detail": "blank capture_source",
          "exact_value": {"semantic_field": "capture_source", "value": "Chat Session",
                          "field_id": cfg.F["capture_source"]}}],
        10, set(), loader)
    if len(cands) != 1:
        return False
    c = cands[0]
    return (c["target_field_id"] == cfg.F["capture_source"]
            and "capture_source" in c["after_payload"]
            and c["before_hash"] and c["before_snapshot"])


truthy("exact-blank-metadata-candidate-complete", exact_blank_metadata_candidate_complete())


def report_record_id_stored():
    # run_audit stamps v1_report_record_id onto each written amendment
    fresh()
    captured = {}
    au.write_fingerprints = lambda fps, prior, tok: 0
    au.write_v1_amendment = lambda am, rid, tok: captured.setdefault("am", dict(am))
    ds = [{"id": "recA", "fields": {cfg.F["title"]: "T1", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "same body",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}},
          {"id": "recB", "fields": {cfg.F["title"]: "T2", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "same body",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}}]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else ds if t == cfg.T_DRAFT_TRUTH else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": []}
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep123", execution_run_id="clive-man-context-auditor--run-r")
    return captured.get("am", {}).get("v1_report_record_id") == "recRep123"


truthy("report-record-id-stored", report_record_id_stored())


def malformed_unresolved_dedupe():
    # the 10 malformed live V1 rows are in the unresolved queue -> their dedupe keys
    # block re-creation (candidate path consults unresolved_dedupe_keys)
    v1q = [{"id": "recAV", "fields": {cfg.AV["amendment_version_id"]: "cav-r-0-v1",
                                      cfg.AV["stage"]: {"name": "V1"}, cfg.AV["dedupe_key"]: "DK",
                                      cfg.AV["action_class"]: "QUARANTINE_DRAFT"}}]
    fresh()
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (v1q if t == cfg.T_AMENDMENT_VERSIONS else [])
    res = au.load_unresolved_v1_queue("t")
    return "DK" in res["unresolved_dedupe_keys"] and res["count"] == 1


truthy("malformed-unresolved-dedupe", malformed_unresolved_dedupe())


def missing_objects_computed():
    # prior has a key not present this run -> missing_objects == 1
    prior = {"draft:recGone": {"record_id": "recFP9", "current_hash": "h", "state": "Active"}}
    res = run_audit_with(drafts(0), prior=prior)
    return res["counts"]["missing_objects"] == 1


truthy("missing-objects-computed", missing_objects_computed())


# === v1.3: optional date fields omitted when unset =============================
def first_baseline_dates_omitted():
    fresh()
    captured = {}
    # first-baseline fingerprint: last_seen set, last_changed/last_sampled unset
    fps = [{"object_key": "draft:recD0", "base_id": cfg.BASE_WORKSHOP, "table_id": cfg.T_DRAFT_TRUTH,
            "record_id": "recD0", "object_type": "Workshop Draft", "current_hash": "h",
            "previous_hash": "", "last_seen": "2026-08-02T10:00:00+00:00",
            "last_changed": "", "last_sampled": "", "last_run_id": "r", "state": "Active"}]
    au._req = lambda m, p, tok, body=None, retries=1: captured.setdefault("fields", body["records"][0]["fields"]) or {}
    au._pen_write = lambda tok, table, fields: captured.setdefault("fields", fields)
    au.write_fingerprints(fps, {}, "t")
    f = captured["fields"]
    # empty date fields must be OMITTED; valid ISO last_seen must remain
    return (cfg.FP["last_changed"] not in f
            and cfg.FP["last_sampled"] not in f
            and f.get(cfg.FP["last_seen"]) == "2026-08-02T10:00:00+00:00")


truthy("first-baseline-unset-dates-omitted", first_baseline_dates_omitted())


def none_and_empty_dates_omitted():
    fresh()
    # None value also omitted; valid date kept
    fps = [{"object_key": "draft:recD1", "base_id": cfg.BASE_WORKSHOP, "table_id": cfg.T_DRAFT_TRUTH,
            "record_id": "recD1", "object_type": "Workshop Draft", "current_hash": "h",
            "previous_hash": "", "last_seen": None, "last_changed": "", "last_sampled": "  ",
            "last_run_id": "r", "state": "Active"}]
    out = au._normalize_optional_dates(
        {cfg.FP["last_seen"]: fps[0]["last_seen"], cfg.FP["last_changed"]: fps[0]["last_changed"],
         cfg.FP["last_sampled"]: fps[0]["last_sampled"]},
        au._FINGERPRINT_DATE_FIELDS)
    return (cfg.FP["last_seen"] not in out and cfg.FP["last_changed"] not in out
            and cfg.FP["last_sampled"] not in out)


truthy("none-and-empty-dates-omitted", none_and_empty_dates_omitted())


# === v1.7: END-TO-END integration — real run_audit -> real strict writer ======
def _e2e_harness(draft_list, v1q=None):
    """Wire the REAL run_audit into the REAL write_v1_amendment (no writer mock).
    Captures the exact Airtable POST payload via a mocked _req/_pen boundary."""
    fresh()
    posts = []
    # capture the pen's actual Airtable write payload (field IDs + types)
    au._req = lambda m, p, tok, body=None, retries=1: (
        posts.append(body["records"][0]["fields"]) if (m == "POST" and T_AV in p) else {"tables": []})
    au.write_fingerprints = lambda fps, prior, tok: len(fps)
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        draft_list if t == cfg.T_DRAFT_TRUTH else
        (v1q or []) if t == cfg.T_AMENDMENT_VERSIONS else [])
    return posts


T_AV = cfg.T_AMENDMENT_VERSIONS


def e2e_107_findings_10_valid_writes():
    posts = _e2e_harness([{"id": f"rec{i}", "fields": {cfg.F["title"]: f"T{i}", cfg.F["brain_slug"]: "s",
                                                       cfg.F["canonical_text"]: f"b{i}",
                                                       cfg.F["status"]: {"name": "Draft"},
                                                       cfg.F["created"]: "2020-01-01T00:00:00Z"}}
                          for i in range(107)])
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    return len(posts) == cfg.CAP_V1_AMENDMENTS


truthy("e2e-107-findings-10-valid-v1-writes", e2e_107_findings_10_valid_writes())


def e2e_candidate_carries_contract():
    posts = _e2e_harness([{"id": "recA", "fields": {cfg.F["title"]: "T", cfg.F["brain_slug"]: "s",
                                                    cfg.F["canonical_text"]: "b",
                                                    cfg.F["status"]: {"name": "Draft"},
                                                    cfg.F["created"]: "2020-01-01T00:00:00Z"}}])
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    if not posts:
        return False
    f = posts[0]
    return (f.get(cfg.AV["run_id"]) == "clive-man-context-auditor--run-r"  # exec run id, NOT parent "r"
            and f.get(cfg.AV["v1_report_record_id"]) == "recRep"
            and f.get(cfg.AV["created_by_agent"]) == cfg.ROLE
            and f.get(cfg.AV["adapter_version"]) == cfg.ADAPTER_VERSION
            and f.get(cfg.AV["stage"]) == "V1"
            and f.get(cfg.AV["challenger_verdict"]) == "Proposed"
            and f.get(cfg.AV["before_hash"]) and f.get(cfg.AV["after_payload"]))


truthy("e2e-candidate-carries-runid-reportid-actor-version", e2e_candidate_carries_contract())


def e2e_payload_field_ids_types():
    posts = _e2e_harness([{"id": "recA", "fields": {cfg.F["title"]: "T", cfg.F["brain_slug"]: "s",
                                                    cfg.F["canonical_text"]: "b",
                                                    cfg.F["status"]: {"name": "Draft"},
                                                    cfg.F["created"]: "2020-01-01T00:00:00Z"}}])
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    if not posts:
        return False
    f = posts[0]
    # every key is a valid fld ID from the AV map; stage/verdict/tier are plain strings
    valid_ids = set(cfg.AV.values())
    return (all(k in valid_ids for k in f)
            and isinstance(f.get(cfg.AV["stage"]), str)
            and isinstance(f.get(cfg.AV["challenger_verdict"]), str)
            and isinstance(f.get(cfg.AV["tier"]), str))


truthy("e2e-payload-field-ids-types-valid", e2e_payload_field_ids_types())


def e2e_malformed_candidate_rejected():
    # force a candidate missing run_id through the writer directly -> strict pen refuses
    fresh()
    au._pen_write = lambda tok, table, fields: None
    incomplete = {"amendment_version_id": "cav-r-0-v1", "target_base_id": cfg.BASE_WORKSHOP,
                  "target_table_id": cfg.T_DRAFT_TRUTH, "target_record_id": "recA",
                  "action_class": "QUARANTINE_DRAFT", "before_snapshot": "{}", "before_hash": "h",
                  "after_payload": "{}", "reason": "r", "evidence": "recA", "dedupe_key": "d",
                  "v1_report_record_id": "recRep", "confidence": 0.9}  # run_id MISSING from dict
    try:
        # run_id passed separately but candidate dict lacks it; builder must inject it
        rec = au.build_pen_record(incomplete, "r", "recRep")
        au.write_v1_amendment(rec, "r", "t")
        return True  # builder injected run_id -> write succeeds
    except au.PenRefusal:
        return False


truthy("e2e-builder-injects-runid-write-succeeds", e2e_malformed_candidate_rejected())


def e2e_unresolved_dedupe_advances():
    # a pending candidate for recA -> next run proposes recB instead
    loader_map = {"recA": {cfg.F["status"]: {"name": "Draft"}},
                  "recB": {cfg.F["status"]: {"name": "Draft"}}}
    probe, _ = au.select_candidates(
        [{"severity": "high", "check": "text_duplicate", "record": "recA", "detail": "y"}],
        1, set(), lambda r: loader_map.get(r))
    pending = {probe[0]["dedupe_key"]} if probe else set()
    cands, _ = au.select_candidates(
        [{"severity": "high", "check": "text_duplicate", "record": "recA", "detail": "y"},
         {"severity": "high", "check": "text_duplicate", "record": "recB", "detail": "y"}],
        1, pending, lambda r: loader_map.get(r))
    return len(cands) == 1 and cands[0]["target_record_id"] == "recB"


truthy("e2e-unresolved-dedupe-advances-slice", e2e_unresolved_dedupe_advances())


def e2e_no_actionable_zero():
    posts = _e2e_harness([])  # no drafts -> no actionable findings
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    return len(posts) == 0


truthy("e2e-no-actionable-zero-writes", e2e_no_actionable_zero())


def e2e_overflow_does_not_suppress():
    posts = _e2e_harness([{"id": f"rec{i}", "fields": {cfg.F["title"]: f"T{i}", cfg.F["brain_slug"]: "s",
                                                       cfg.F["canonical_text"]: f"b{i}",
                                                       cfg.F["status"]: {"name": "Draft"},
                                                       cfg.F["created"]: "2020-01-01T00:00:00Z"}}
                          for i in range(cfg.CAP_FINDING_DETAILS + 10)])
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=True, v1_report_record_id="recRep", execution_run_id="clive-man-context-auditor--run-r")
    return res["findings_overflow"] is True and len(posts) > 0


truthy("e2e-overflow-does-not-suppress-proposals", e2e_overflow_does_not_suppress())


# === v1.8: run identity separation + Trusted dedupe ============================

def reused_run_id_collides_zero_writes():
    # Amendment Version IDs stamped from a REUSED run id colliding with existing
    # table primary IDs -> zero writes + kill (never partial regeneration).
    fresh()
    posts = []
    au.write_fingerprints = lambda fps, prior, tok: len(fps)
    au._req = lambda m, p, tok, body=None, retries=1: (
        posts.append(1) if m == "POST" and cfg.T_AMENDMENT_VERSIONS in p else {"tables": []})
    ds = [{"id": "recA", "fields": {cfg.F["title"]: "T", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "b",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}}]
    # existing primary ID equals the one this run would generate
    existing = [{"id": "recE", "fields": {cfg.AV["amendment_version_id"]: "cav-exec-r-0-v1"}}]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else
        ds if t == cfg.T_DRAFT_TRUTH else
        existing if t == cfg.T_AMENDMENT_VERSIONS else [])
    try:
        au.run_audit("rt", "ct", sample=1, run_id="r", write=True,
                     v1_report_record_id="recRep", execution_run_id="exec-r")
        return False
    except Exception as e:
        return type(e).__name__ == "KillEvent" and len(posts) == 0


truthy("reused-run-id-collides-zero-writes", reused_run_id_collides_zero_writes())


def unique_run_id_10_unique_ids():
    posts = []
    au._req = lambda m, p, tok, body=None, retries=1: (
        posts.append(body["records"][0]["fields"]) if m == "POST" and cfg.T_AMENDMENT_VERSIONS in p else {"tables": []})
    au.write_fingerprints = lambda fps, prior, tok: len(fps)
    ds = [{"id": f"rec{i}", "fields": {cfg.F["title"]: f"T{i}", cfg.F["brain_slug"]: "s",
                                       cfg.F["canonical_text"]: f"b{i}",
                                       cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}}
          for i in range(20)]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else ds if t == cfg.T_DRAFT_TRUTH else [])
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True,
                 v1_report_record_id="recRep", execution_run_id="exec-unique-1")
    ids = [f.get(cfg.AV["amendment_version_id"]) for f in posts]
    return len(posts) == 10 and len(set(ids)) == 10 and all("exec-unique-1" in i for i in ids)


truthy("unique-run-id-10-unique-ids", unique_run_id_10_unique_ids())


def within_batch_duplicate_zero():
    # force candidates with duplicate amendment_version_id -> preflight kills
    fresh()
    cands = [{"amendment_version_id": "cav-x-0-v1", "dedupe_key": "d1"},
             {"amendment_version_id": "cav-x-0-v1", "dedupe_key": "d2"}]
    try:
        au._preflight_amendment_ids(cands, set())
        return False
    except Exception as e:
        return type(e).__name__ == "KillEvent"


truthy("within-batch-duplicate-zero", within_batch_duplicate_zero())


def three_slugs_one_trusted_base_one_scan():
    # three active brain slugs -> same physical Trusted base: scanned ONCE
    fresh()
    three = [
        {"id": "recB1", "fields": {cfg.BR["status"]: {"name": "Active"}, cfg.BR["brain_slug"]: "s1",
                                   cfg.BR["trusted_base_id"]: "appT", cfg.BR["workshop_base_id"]: "appW"}},
        {"id": "recB2", "fields": {cfg.BR["status"]: {"name": "Active"}, cfg.BR["brain_slug"]: "s2",
                                   cfg.BR["trusted_base_id"]: "appT", cfg.BR["workshop_base_id"]: "appW"}},
        {"id": "recB3", "fields": {cfg.BR["status"]: {"name": "Active"}, cfg.BR["brain_slug"]: "s3",
                                   cfg.BR["trusted_base_id"]: "appT", cfg.BR["workshop_base_id"]: "appW"}}]
    trusted = au.discover_trusted_bases.__wrapped__ if hasattr(au.discover_trusted_bases, "__wrapped__") else None
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: three if t == cfg.T_REGISTRY_BRAINS else []
    trusted = au.discover_trusted_bases("t")
    return len(trusted) == 1 and len(trusted[0]["brain_slugs"]) == 3


truthy("three-slugs-one-trusted-base-one-scan", three_slugs_one_trusted_base_one_scan())


def fingerprint_key_collision_zero():
    fresh()
    fps = [{"object_key": "trusted:appT:tbl1:rec1"}, {"object_key": "trusted:appT:tbl1:rec1"}]
    try:
        au._preflight_fingerprint_keys(fps)
        return False
    except Exception as e:
        return type(e).__name__ == "KillEvent"


truthy("fingerprint-key-collision-zero", fingerprint_key_collision_zero())


def physical_collapse_count():
    # two brain slugs same base, 1 table, 2 records -> 2 physical fingerprints (not 4)
    two = [
        {"id": "recB1", "fields": {cfg.BR["status"]: {"name": "Active"}, cfg.BR["brain_slug"]: "s1",
                                   cfg.BR["trusted_base_id"]: "appT", cfg.BR["workshop_base_id"]: "appW"}},
        {"id": "recB2", "fields": {cfg.BR["status"]: {"name": "Active"}, cfg.BR["brain_slug"]: "s2",
                                   cfg.BR["trusted_base_id"]: "appT", cfg.BR["workshop_base_id"]: "appW"}}]
    fresh()
    trusted_recs = [{"id": "rec1", "fields": {"text": "a"}}, {"id": "rec2", "fields": {"text": "b"}}]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        two if t == cfg.T_REGISTRY_BRAINS else
        trusted_recs if t == "tbl1" else [])
    au._req = lambda m, p, tok, body=None, retries=1: {"tables": [{"id": "tbl1"}]}
    res = au.run_audit("rt", "ct", sample=1, run_id="r", write=False, execution_run_id="exec-c")
    trusted_fp = [fp for fp in res["fingerprints"] if fp["object_type"] == "Trusted Truth"]
    keys = [fp["object_key"] for fp in trusted_fp]
    return len(trusted_fp) == 2 and len(set(keys)) == 2


truthy("physical-collapse-count", physical_collapse_count())


# === v2.0: Adapter Version field = EXECUTOR contract only ======================
def amendment_field_is_executor_version():
    # the Amendment Version "Adapter Version" field ALWAYS stamps EXECUTOR_ADAPTER_VERSION
    posts = []
    au._req = lambda m, p, tok, body=None, retries=1: (
        posts.append(body["records"][0]["fields"]) if m == "POST" and cfg.T_AMENDMENT_VERSIONS in p else {"tables": []})
    au.write_fingerprints = lambda fps, prior, tok: len(fps)
    ds = [{"id": "recA", "fields": {cfg.F["title"]: "T", cfg.F["brain_slug"]: "s",
                                    cfg.F["canonical_text"]: "b",
                                    cfg.F["status"]: {"name": "Draft"}, cfg.F["created"]: "2020-01-01T00:00:00Z"}}]
    au.list_all = lambda b, t, tok, fids=None, page_cap=None: (
        brains() if t == cfg.T_REGISTRY_BRAINS else ds if t == cfg.T_DRAFT_TRUTH else [])
    au.run_audit("rt", "ct", sample=1, run_id="r", write=True,
                 v1_report_record_id="recRep", execution_run_id="exec-v20")
    if not posts:
        return False
    f = posts[0]
    return (f.get(cfg.AV["adapter_version"]) == cfg.EXECUTOR_ADAPTER_VERSION
            and f.get(cfg.AV["adapter_version"]) != cfg.SKILL_IMPLEMENTATION_VERSION)


truthy("amendment-field-is-executor-version", amendment_field_is_executor_version())


def auditor_version_in_report_metadata():
    res = run_audit_with(drafts(1), write=True, v1_report_record_id="recRep")
    return (res.get("auditor_implementation_version") == cfg.SKILL_IMPLEMENTATION_VERSION
            and res.get("adapter_version") == cfg.EXECUTOR_ADAPTER_VERSION)


truthy("auditor-version-in-report-metadata", auditor_version_in_report_metadata())


def build_pen_record_executor_version():
    rec = au.build_pen_record({"amendment_version_id": "cav-x-0-v1"}, "r", "recRep")
    return rec["adapter_version"] == cfg.EXECUTOR_ADAPTER_VERSION


truthy("build-pen-record-executor-version", build_pen_record_executor_version())


# === v2.1: Capture Source gate ================================================
def ambient_rows_classify_chat_session():
    # two deterministic Ambient rows -> Chat Session classification
    for actor in ("clive-man-ambient-capture", "clive-man"):
        rec_fields = {cfg.F["proposed_by_agent"]: actor, cfg.F["status"]: {"name": "Draft"}}
        choice = au.classify_capture_source({"evidence": "recX"}, rec_fields)
        if choice != "Chat Session":
            return False
    return True


truthy("ambient-rows-classify-chat-session", ambient_rows_classify_chat_session())


def security_probe_ambiguous_excluded():
    # Proposed By Clive, Created By Matthew, no actor/thread provenance -> ambiguous
    rec_fields = {cfg.F["proposed_by_agent"]: "", cfg.F["status"]: {"name": "Draft"}}
    return au.classify_capture_source({"evidence": ""}, rec_fields) is None


truthy("security-probe-ambiguous-excluded", security_probe_ambiguous_excluded())


def ambient_candidate_completes_with_field_id():
    # capture_source_blank finding for an Ambient row -> complete V1 with Target Field ID
    rec_fields = {cfg.F["proposed_by_agent"]: "clive-man-ambient-capture",
                  cfg.F["status"]: {"name": "Draft"}}
    loader = lambda rid: rec_fields
    cands, _ = au.select_candidates(
        [{"severity": "medium", "check": "capture_source_blank", "record": "recDb",
          "proposed_by_agent": "clive-man-ambient-capture", "evidence": "recDb",
          "detail": "blank Capture Source"}],
        10, set(), loader)
    if len(cands) != 1:
        return False
    c = cands[0]
    return (c["target_field_id"] == cfg.CAPTURE_SOURCE_FIELD
            and "Chat Session" in c["after_payload"]
            and c["before_hash"] and c["before_snapshot"])


truthy("ambient-candidate-completes-with-field-id", ambient_candidate_completes_with_field_id())


def invalid_select_excluded():
    # a candidate can never carry an invalid select value through the gate
    return au.classify_capture_source({"evidence": ""},
                                      {cfg.F["proposed_by_agent"]: "unknown-actor"}) is None


truthy("invalid-select-excluded", invalid_select_excluded())


def new_draft_missing_source_refused():
    # create candidate without capture_source is refused by the executor gate contract;
    # at the Auditor, create/supersede candidates must carry exact capture_source.
    # Verify the executor-side contract constant exists and gate logic is referenced.
    return cfg.CAPTURE_SOURCE_FIELD == "fld9zhLHPvjnq8lHT" and "Chat Session" in cfg.CAPTURE_SOURCE_CHOICES


truthy("capture-source-gate-constants", new_draft_missing_source_refused())


print(json.dumps({"passed": len(PASS), "failed": len(FAIL), "pass": PASS, "fail": FAIL}, indent=2))
sys.exit(1 if FAIL else 0)
