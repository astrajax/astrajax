#!/usr/bin/env python3
"""
Offline tests for the Challenger role package. No network, no live credential.
Covers: V1 row load (stage check), empty-Trusted kill, the V2 pen
(stage/verdict/actor/supersedes enforcement), Amber→Green promotion (Pam R5),
Held forces Amber, Supersedes V1 link.
Run: python3 test_challenger.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ["CONTEXT_CHALLENGE_READ"] = "t"
os.environ["CONTEXT_V2_CONTROL_WRITE"] = "t"

import context_config as cfg
import context_estate_challenge as ch

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


# --- empty Trusted discovery kill -------------------------------------------
ch.list_all = lambda b, t, tok, fids=None: []
expect("empty-trusted-discovery-kill", lambda: ch.discover_trusted_bases("t"),
       ch.KillEvent, "kill event")


# --- V1 row load stage check -------------------------------------------------
ch.get_record = lambda b, t, r, tok: {"id": r, "fields": {cfg.AV["stage"]: {"name": "V2"}}}
expect("v1-load-refuses-non-v1",
       lambda: ch.load_v1_row("recX", "t"), ch.KillEvent, "not V1")

ch.get_record = lambda b, t, r, tok: {"id": r, "fields": {cfg.AV["stage"]: {"name": "V1"}}}
try:
    ch.load_v1_row("recX", "t")
    ok("v1-load-accepts-v1")
except Exception as e:
    bad("v1-load-accepts-v1", str(e))


# --- V2 pen enforcement ------------------------------------------------------
def v2_fields(**over):
    f = {cfg.AV["stage"]: "V2", cfg.AV["challenger_verdict"]: "Cleared",
         cfg.AV["created_by_agent"]: cfg.ROLE, cfg.AV["supersedes_version"]: "cav-r-1-v1"}
    f.update(over)
    return f


expect("pen-refuses-non-v2",
       lambda: ch._pen_write("t", v2_fields(**{cfg.AV["stage"]: "V1"})),
       ch.PenRefusal, "Stage=V2 only")
expect("pen-refuses-bad-verdict",
       lambda: ch._pen_write("t", v2_fields(**{cfg.AV["challenger_verdict"]: "Proposed"})),
       ch.PenRefusal, "Cleared/Held/Rejected")
expect("pen-refuses-wrong-actor",
       lambda: ch._pen_write("t", v2_fields(**{cfg.AV["created_by_agent"]: "x"})),
       ch.PenRefusal, "Created By Agent")
expect("pen-refuses-no-supersedes",
       lambda: ch._pen_write("t", v2_fields(**{cfg.AV["supersedes_version"]: None,
                                               cfg.AV["supersedes_version_link"]: None})),
       ch.PenRefusal, "Supersedes V1")


def pen_accepts_v2():
    calls = {}
    ch._req = lambda m, p, tok, body=None, retries=1: calls.setdefault("body", body) or {}
    ch._pen_write("t", v2_fields())
    return "body" in calls


truthy("pen-accepts-valid-v2", pen_accepts_v2())


# --- Amber→Green promotion (Pam R5) ------------------------------------------
def applied_events(for_class):
    ch.list_all = lambda b, t, tok, fids=None: [
        {"id": "recE", "fields": {cfg.EE["event_type"]: {"name": "Applied"},
                                  cfg.EE["applied_payload"]: json.dumps(
                                      {"action_class": "QUARANTINE_DRAFT" if for_class else "OTHER",
                                       "adapter_version": cfg.ADAPTER_VERSION})}}]


applied_events(True)
truthy("green-with-prior-applied", ch.prior_applied_for_class("QUARANTINE_DRAFT", "t") is True)
applied_events(False)
truthy("amber-without-prior-applied", ch.prior_applied_for_class("QUARANTINE_DRAFT", "t") is False)


# --- build_v2_row: supersedes link + Held forces HDN ------------------------
def build_check():
    v1f = {cfg.AV["amendment_version_id"]: "cav-r-1-v1", cfg.AV["action_class"]: "QUARANTINE_DRAFT",
           cfg.AV["target_base_id"]: cfg.BASE_WORKSHOP, cfg.AV["target_table_id"]: cfg.T_DRAFT_TRUTH,
           cfg.AV["dedupe_key"]: "d", cfg.AV["target_record_id"]: "recX"}
    row = ch.build_v2_row(v1f, "recV1", "Held", "Amber", "run-r")
    return (row[cfg.AV["supersedes_version_link"]] == ["recV1"]
            and row[cfg.AV["human_decision_needed"]] is True
            and row[cfg.AV["amendment_version_id"]] == "cav-r-1-v2")


truthy("build-v2-supersedes-held", build_check())


# === v1.1: malformed V1 -> Held/Rejected V2; report IDs; valid path preserved ===

def malformed_v1_detected():
    v1f = {cfg.AV["action_class"]: {"name": "QUARANTINE_DRAFT"},
           # missing before_snapshot, before_hash, after_payload, evidence, confidence, v1_report_record_id, target_record_id
           }
    defects = ch.v1_defects(v1f)
    return len(defects) >= 5 and "missing before_snapshot" in defects and "missing target_record_id" in defects


truthy("malformed-v1-defects-detected", malformed_v1_detected())


def valid_v1_no_defects():
    v1f = {cfg.AV["action_class"]: {"name": "QUARANTINE_DRAFT"},
           cfg.AV["before_snapshot"]: "{}", cfg.AV["before_hash"]: "h",
           cfg.AV["after_payload"]: "{}", cfg.AV["evidence"]: "recA",
           cfg.AV["confidence"]: 0.9, cfg.AV["v1_report_record_id"]: "recRep",
           cfg.AV["target_record_id"]: "recA",
           cfg.AV["adapter_version"]: cfg.EXECUTOR_ADAPTER_VERSION}
    return ch.v1_defects(v1f) == []


truthy("valid-v1-no-defects", valid_v1_no_defects())


def create_action_no_before_ok():
    # CREATE actions legitimately have no before snapshot/hash -> not a defect
    v1f = {cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
           cfg.AV["after_payload"]: "{}", cfg.AV["evidence"]: "recA",
           cfg.AV["confidence"]: 0.9, cfg.AV["v1_report_record_id"]: "recRep"}
    defects = ch.v1_defects(v1f)
    return "missing before_snapshot" not in defects and "missing before_hash" not in defects


truthy("create-action-no-before-ok", create_action_no_before_ok())


def field_action_requires_field_id():
    v1f = {cfg.AV["action_class"]: {"name": "FILL_BLANK_DRAFT_METADATA"},
           cfg.AV["before_snapshot"]: "{}", cfg.AV["before_hash"]: "h",
           cfg.AV["after_payload"]: "{}", cfg.AV["evidence"]: "recA",
           cfg.AV["confidence"]: 0.9, cfg.AV["v1_report_record_id"]: "recRep",
           cfg.AV["target_record_id"]: "recA"}  # target_field_id missing
    return "missing target_field_id" in ch.v1_defects(v1f)


truthy("field-action-requires-field-id", field_action_requires_field_id())


def v2_carries_report_ids():
    v1f = {cfg.AV["amendment_version_id"]: "cav-r-1-v1", cfg.AV["action_class"]: "QUARANTINE_DRAFT",
           cfg.AV["target_base_id"]: cfg.BASE_WORKSHOP, cfg.AV["target_table_id"]: cfg.T_DRAFT_TRUTH,
           cfg.AV["dedupe_key"]: "d", cfg.AV["target_record_id"]: "recX",
           cfg.AV["v1_report_record_id"]: "recRepV1"}
    row = ch.build_v2_row(v1f, "recV1", "Held", "Amber", "run-r")
    row[cfg.AV["v2_report_record_id"]] = "recRepV2"
    return (row[cfg.AV["v1_report_record_id"]] == "recRepV1"
            and row[cfg.AV["v2_report_record_id"]] == "recRepV2")


truthy("v2-carries-report-record-ids", v2_carries_report_ids())


# === v1.2: Adapter Version field = EXECUTOR contract only ======================
def unsupported_executor_version_is_defect():
    v1f = {cfg.AV["action_class"]: {"name": "QUARANTINE_DRAFT"},
           cfg.AV["before_snapshot"]: "{}", cfg.AV["before_hash"]: "h",
           cfg.AV["after_payload"]: "{}", cfg.AV["evidence"]: "recA",
           cfg.AV["confidence"]: 0.9, cfg.AV["v1_report_record_id"]: "recRep",
           cfg.AV["target_record_id"]: "recA",
           cfg.AV["adapter_version"]: "context-estate-challenge-v1.1"}  # WRONG: skill version
    defects = ch.v1_defects(v1f)
    return any("unsupported executor adapter_version" in d for d in defects)


truthy("unsupported-executor-version-is-defect", unsupported_executor_version_is_defect())


def supported_executor_version_clean():
    v1f = {cfg.AV["action_class"]: {"name": "QUARANTINE_DRAFT"},
           cfg.AV["before_snapshot"]: "{}", cfg.AV["before_hash"]: "h",
           cfg.AV["after_payload"]: "{}", cfg.AV["evidence"]: "recA",
           cfg.AV["confidence"]: 0.9, cfg.AV["v1_report_record_id"]: "recRep",
           cfg.AV["target_record_id"]: "recA",
           cfg.AV["adapter_version"]: cfg.EXECUTOR_ADAPTER_VERSION}
    return not any("unsupported executor" in d for d in ch.v1_defects(v1f))


truthy("supported-executor-version-clean", supported_executor_version_clean())


def v2_preserves_executor_version():
    v1f = {cfg.AV["amendment_version_id"]: "cav-r-1-v1", cfg.AV["action_class"]: "QUARANTINE_DRAFT",
           cfg.AV["target_base_id"]: cfg.BASE_WORKSHOP, cfg.AV["target_table_id"]: cfg.T_DRAFT_TRUTH,
           cfg.AV["dedupe_key"]: "d", cfg.AV["target_record_id"]: "recX",
           cfg.AV["adapter_version"]: cfg.EXECUTOR_ADAPTER_VERSION}
    row = ch.build_v2_row(v1f, "recV1", "Cleared", "Amber", "run-r")
    return (row[cfg.AV["adapter_version"]] == cfg.EXECUTOR_ADAPTER_VERSION
            and row[cfg.AV["adapter_version"]] != cfg.CHALLENGE_IMPLEMENTATION_VERSION)


truthy("v2-preserves-executor-version", v2_preserves_executor_version())


# === v1.3: Capture Source verification ========================================
import json as _json


def ambient_chat_session_may_clear():
    v1f = {cfg.AV["after_payload"]: _json.dumps({"capture_source": "Chat Session"}),
           cfg.AV["evidence"]: "recDb",
           cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
           cfg.AV["created_by_agent"]: "clive-man-ambient-capture"}
    return ch.verify_capture_source(v1f, None) is None


truthy("ambient-chat-session-may-clear", ambient_chat_session_may_clear())


def ambient_create_no_draft_required():
    v1f = {cfg.AV["after_payload"]: _json.dumps({"capture_source": "Chat Session"}),
           cfg.AV["evidence"]: "quoted chat",
           cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
           cfg.AV["created_by_agent"]: "clive-man-ambient-capture"}
    return ch.verify_capture_source(v1f, None) is None


truthy("ambient-create-no-draft-required", ambient_create_no_draft_required())


def invalid_select_held():
    v1f = {cfg.AV["after_payload"]: _json.dumps({"fields": {"capture_source": "Bogus"}}),
           cfg.AV["evidence"]: "recX"}
    return ch.verify_capture_source(v1f, {}) is not None


truthy("invalid-select-held", invalid_select_held())


def ambiguous_chat_session_held():
    # Chat Session payload but proposed_by not an ambient actor -> not supported
    v1f = {cfg.AV["after_payload"]: _json.dumps({"fields": {"capture_source": "Chat Session"}}),
           cfg.AV["evidence"]: "recX"}
    draft = {"proposed_by_agent": "someone-else", cfg.CAPTURE_SOURCE_FIELD: None}
    return ch.verify_capture_source(v1f, draft) is not None


truthy("ambiguous-chat-session-held", ambiguous_chat_session_held())


def non_capture_action_unaffected():
    v1f = {cfg.AV["after_payload"]: _json.dumps({"fields": {"brain_theme": "x"}}),
           cfg.AV["evidence"]: "recX"}
    return ch.verify_capture_source(v1f, {}) is None


truthy("non-capture-action-unaffected", non_capture_action_unaffected())


def list_unchallenged_actor_agnostic():
    rows = [
        {"id": "recV1a", "fields": {cfg.AV["amendment_version_id"]: "cav-a-v1", cfg.AV["stage"]: "V1", cfg.AV["created_by_agent"]: "clive-man-ambient-capture"}},
        {"id": "recV1b", "fields": {cfg.AV["amendment_version_id"]: "cav-b-v1", cfg.AV["stage"]: "V1", cfg.AV["created_by_agent"]: "clive-man-context-auditor"}},
        {"id": "recV2", "fields": {cfg.AV["stage"]: "V2", cfg.AV["supersedes_version"]: "cav-a-v1"}},
    ]
    v1_by_id = {}
    superseded = set()
    for r in rows:
        f = r.get("fields", {})
        stage = f.get(cfg.AV["stage"])
        if isinstance(stage, dict):
            stage = stage.get("name")
        avid = f.get(cfg.AV["amendment_version_id"])
        if stage == "V1" and avid:
            v1_by_id[avid] = r
        elif stage == "V2":
            sup = f.get(cfg.AV["supersedes_version"])
            if sup:
                superseded.add(sup)
    unchallenged = [v1_by_id[k] for k in v1_by_id if k not in superseded]
    return len(unchallenged) == 1 and unchallenged[0]["id"] == "recV1b"


truthy("list-unchallenged-actor-agnostic", list_unchallenged_actor_agnostic())


print(json.dumps({"passed": len(PASS), "failed": len(FAIL), "pass": PASS, "fail": FAIL}, indent=2))
sys.exit(1 if FAIL else 0)
