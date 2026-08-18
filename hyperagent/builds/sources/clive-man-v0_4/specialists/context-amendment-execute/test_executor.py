#!/usr/bin/env python3
"""
Offline tests for the Executor role package. No network, no live credential.
Covers the executor slice of the Pam contract: allowlists, shape validation
(version pin, before-hash, dedupe), authoritative V2 loading, replay/dedupe,
monotonic attempts, Amber→Green gate, rollback classification, readback,
hash-chain, whole-batch preflight zero.
Run: python3 test_executor.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
os.environ["CONTEXT_AMENDMENT_EXECUTE"] = "t"

import context_config as cfg
import context_amendment_execute as ex

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


BASE = {"run_id": "run-test", "executing_agent": "clive-man-executor",
        "tier": "Green", "amendment_version_id": "cav-run-test-1-v2",
        "amendment_version_record_id": "recAV1", "adapter_version": cfg.ADAPTER_VERSION,
        "target_base_id": cfg.BASE_WORKSHOP, "target_table_id": cfg.T_DRAFT_TRUTH,
        "payload": {}}


def am(**kw):
    a = dict(BASE); a.update(kw); return a


# --- allowlists / shape -------------------------------------------------------
expect("trusted-base-write-refused",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH",
                                     target_base_id="app6tjzzG0L0lOeVb", dedupe_key="d")),
       ex.Refusal, "not allowlisted")
expect("unknown-action-refused",
       lambda: ex._validate_shape(am(action_class="DELETE_ALL")), ex.Refusal, "not in allowlist")
expect("red-tier-refused",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH", tier="Red", dedupe_key="d")),
       ex.Refusal, "tier not Green/Amber")
expect("missing-adapter-version",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH", adapter_version=None, dedupe_key="d")),
       ex.Refusal, "adapter_version missing")
expect("stale-adapter-version",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH", adapter_version="v9999", dedupe_key="d")),
       ex.Refusal, "!=")
expect("existing-record-missing-before-hash",
       lambda: ex._validate_shape(am(action_class="QUARANTINE_DRAFT", target_record_id="r")),
       ex.Refusal, "requires before_hash")
expect("create-with-target-record",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH", target_record_id="r", dedupe_key="d")),
       ex.Refusal, "must not carry target_record_id")
expect("create-missing-dedupe",
       lambda: ex._validate_shape(am(action_class="CREATE_DRAFT_TRUTH")),
       ex.Refusal, "dedupe_key")


# --- authoritative V2 loading --------------------------------------------------
def fake_av_row(**over):
    f = {cfg.AV["stage"]: {"name": "V2"}, cfg.AV["challenger_verdict"]: {"name": "Cleared"},
         cfg.AV["supersedes_version"]: "cav-run-test-1-v1", cfg.AV["adapter_version"]: cfg.ADAPTER_VERSION,
         cfg.AV["target_base_id"]: cfg.BASE_WORKSHOP, cfg.AV["target_table_id"]: cfg.T_DRAFT_TRUTH,
         cfg.AV["action_class"]: "QUARANTINE_DRAFT", cfg.AV["tier"]: "Green",
         cfg.AV["target_record_id"]: "recX", cfg.AV["before_hash"]: "abc", cfg.AV["dedupe_key"]: "dd"}
    f.update(over)
    return {"id": "recAV1", "fields": f}


good = am(action_class="QUARANTINE_DRAFT", target_record_id="recX", before_hash="abc", dedupe_key="dd")

ex._get_record = lambda b, t, r, tok: fake_av_row()
try:
    ex.load_authoritative_v2(good, "t")
    ok("authoritative-v2-loads")
except Exception as e:
    bad("authoritative-v2-loads", str(e))

ex._get_record = lambda b, t, r, tok: fake_av_row(**{cfg.AV["stage"]: {"name": "V1"}})
expect("v2-stage-not-v2", lambda: ex.load_authoritative_v2(good, "t"), ex.Blocked, "not V2")

ex._get_record = lambda b, t, r, tok: fake_av_row(**{cfg.AV["challenger_verdict"]: {"name": "Held"}})
expect("v2-not-cleared", lambda: ex.load_authoritative_v2(good, "t"), ex.Blocked, "not Cleared")

ex._get_record = lambda b, t, r, tok: fake_av_row(**{cfg.AV["supersedes_version"]: None, cfg.AV["supersedes_version_link"]: None})
expect("v2-no-v1-ancestor", lambda: ex.load_authoritative_v2(good, "t"), ex.Blocked, "no V1 ancestor")

ex._get_record = lambda b, t, r, tok: fake_av_row(**{cfg.AV["adapter_version"]: "v9999"})
expect("v2-version-mismatch", lambda: ex.load_authoritative_v2(good, "t"), ex.Refusal, "adapter_version")

ex._get_record = lambda b, t, r, tok: fake_av_row(**{cfg.AV["action_class"]: "LINK_SOURCE_DOCUMENT"})
expect("v2-field-mismatch", lambda: ex.load_authoritative_v2(good, "t"), ex.Blocked, "action_class")


# --- replay / attempts ---------------------------------------------------------
def fake_events(events):
    ex._list_records = lambda b, t, tok, fids=None: [{"id": f"r{i}", "fields": e} for i, e in enumerate(events)]


fake_events([{cfg.EE["amendment_version"]: ["recAV1"], cfg.EE["attempt"]: 2,
              cfg.EE["event_type"]: {"name": "Attempt"}}])
try:
    attempt, _ = ex.check_replay_and_attempt(good, "t")
    truthy("attempt-monotonic", attempt == 3, f"attempt={attempt}")
except Exception as e:
    bad("attempt-monotonic", str(e))

fake_events([{cfg.EE["amendment_version"]: ["recAV1"], cfg.EE["attempt"]: 1,
              cfg.EE["event_type"]: {"name": "Applied"}}])
expect("replay-applied-refused", lambda: ex.check_replay_and_attempt(good, "t"), ex.Refusal, "already Applied")


# --- Amber→Green gate ----------------------------------------------------------
def amber_setup(for_class):
    fake_events([{cfg.EE["event_type"]: {"name": "Applied"},
                  cfg.EE["applied_payload"]: json.dumps(
                      {"action_class": "QUARANTINE_DRAFT" if for_class else "OTHER",
                       "adapter_version": cfg.ADAPTER_VERSION})}])


amber_setup(True)
try:
    ex.check_amber_green(good, "t")
    ok("green-accepted-with-prior-applied")
except Exception as e:
    bad("green-accepted-with-prior-applied", str(e))

amber_setup(False)
expect("false-green-blocked", lambda: ex.check_amber_green(good, "t"), ex.Blocked, "false-Green")


# --- rollback / readback / hash chain ------------------------------------------
truthy("rollback-update-compensating",
       ex.classify_rollback(am(action_class="QUARANTINE_DRAFT")) == "Compensating Mutation")
truthy("rollback-create-compensating",
       ex.classify_rollback(am(action_class="CREATE_DRAFT_TRUTH")) == "Compensating Mutation")

try:
    ex._verify_readback("QUARANTINE_DRAFT", {"updated": "r", "fields": {cfg.F["status"]: "Quarantined"}},
                        {cfg.F["status"]: {"name": "Quarantined"}})
    ok("readback-quarantine-match")
except Exception as e:
    bad("readback-quarantine-match", str(e))

expect("readback-mismatch",
       lambda: ex._verify_readback("QUARANTINE_DRAFT", {"updated": "r", "fields": {cfg.F["status"]: "Quarantined"}},
                                   {cfg.F["status"]: {"name": "Draft"}}),
       ex.Blocked, "readback mismatch")

try:
    ex._verify_readback("LINK_SOURCE_DOCUMENT", {"linked": ["a", "b"]},
                        {cfg.F["source_documents"]: [{"id": "a"}, {"id": "b"}, {"id": "c"}]})
    ok("readback-union-add")
except Exception as e:
    bad("readback-union-add", str(e))


def hash_chain():
    calls = {}
    ex._list_records = lambda b, t, tok, fids=None: [{"id": "recCL", "fields": {cfg.CL["entry_hash"]: "prevhash123"}}]
    ex._create = lambda b, t, fields, tok: calls.setdefault("f", fields) or {"records": [{"id": "r"}]}
    ex.append_change_log(good, "t", "summary", "http://x")
    f = calls["f"]
    return f[cfg.CL["previous_hash"]] == "prevhash123" and len(f[cfg.CL["entry_hash"]]) == 64


truthy("change-log-hash-chain", hash_chain())


# --- per-lane preflight: one bad amendment does not zero the other lane --------
def per_lane_partial_ok():
    good = am(amendment_version_id="cav-1", action_class="QUARANTINE_DRAFT",
              target_record_id="r", before_hash="abc", dedupe_key="d", _lane="maintenance")
    bad = am(amendment_version_id="cav-2", action_class="QUARANTINE_DRAFT",
             target_record_id="r", dedupe_key="d", _lane="maintenance")
    manifest = {"lane": "maintenance", "run_id": "r", "executing_agent": cfg.ACTOR_SCHEDULED,
                "amendments": [good, bad]}
    ex._get_record = lambda b, t, r, tok: fake_av_row()
    ex.check_amber_green = lambda am, tok: None
    ex.check_replay_and_attempt = lambda am, tok: (1, [])
    quarantined = {"v": False}

    def _get(base, table, rid, tok):
        status = "Quarantined" if quarantined["v"] else "Draft"
        fields = {cfg.F["status"]: {"name": status}}
        return {"id": rid, "fields": fields}

    def _upd(*a, **k):
        quarantined["v"] = True

    live_hash = ex.sha(ex.canonical(_get("", "", "r", "")["fields"]))
    good["before_hash"] = live_hash
    ex._get_record = _get
    ex._update = _upd
    ex.load_authoritative_v2 = lambda am, tok: fake_av_row(**{cfg.AV["before_hash"]: live_hash})
    ex.append_execution_event = lambda *a, **k: None
    ex.append_change_log = lambda *a, **k: None
    out = ex.execute_lane(manifest, "t", dry_run=False)
    return out["mutations"] == 1 and out["failures"] >= 1


truthy("per-lane-partial-not-zero-batch", per_lane_partial_ok())


# === v2.1: Capture Source gate ================================================
def _create_am(payload):
    return am(action_class="CREATE_DRAFT_TRUTH", payload=payload, dedupe_key="d")


expect("create-missing-capture-source-refused",
       lambda: ex.act_create_draft_truth(
           _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s"}), "t", True),
       ex.Refusal, "requires capture_source")

expect("create-invalid-capture-source-refused",
       lambda: ex.act_create_draft_truth(
           _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                       "capture_source": "Made Up Source"}), "t", True),
       ex.Refusal, "not an allowed choice")


def create_exact_source_writes():
    out, _ = ex.act_create_draft_truth(
        _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                    "capture_source": "Chat Session"}), "t", True)
    return out["would_create"].get(cfg.CAPTURE_SOURCE_FIELD) == "Chat Session"


truthy("create-exact-source-writes", create_exact_source_writes())


def create_derives_human_text():
    out, _ = ex.act_create_draft_truth(
        _create_am({"title": "x", "canonical_text": "Claim (recABCDEFGHIJKLMN).",
                    "brain_slug": "clive", "capture_source": "Chat Session"}), "t", True)
    created = out["would_create"]
    return (
        created.get(cfg.F["canonical_text"]) == "Claim (recABCDEFGHIJKLMN)."
        and created.get(cfg.F["canonical_text_for_humans"]) == "Claim."
    )


truthy("create-derives-human-text", create_derives_human_text())


def create_accepts_registry_and_projects():
    out, _ = ex.act_create_draft_truth(
        _create_am({
            "title": "x",
            "canonical_text": "y",
            "canonical_text_for_humans": "plain y",
            "brain_slug": "clive",
            "brain_registry": ["recBrainCliveXXXX"],
            "related_projects": ["rec9deYmfHS8s39za"],
            "capture_source": "Chat Session",
        }), "t", True)
    created = out["would_create"]
    return (
        created.get(cfg.F["brain_registry"]) == ["recBrainCliveXXXX"]
        and created.get(cfg.F["related_projects"]) == ["rec9deYmfHS8s39za"]
        and created.get(cfg.F["canonical_text_for_humans"]) == "plain y"
    )


truthy("create-accepts-registry-and-projects", create_accepts_registry_and_projects())


expect("create-refuses-human-reviewed",
       lambda: ex.act_create_draft_truth(
           _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                       "capture_source": "Chat Session",
                       "human_reviewed": True}), "t", True),
       ex.Refusal, "human-only")

expect("create-refuses-related-projects-guess",
       lambda: ex.act_create_draft_truth(
           _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                       "capture_source": "Chat Session",
                       "related_projects": ["Manage AstraJax Context On-Platform"]}),
           "t", True),
       ex.Refusal, "live record IDs")

expect("create-refuses-related-project-name",
       lambda: ex.act_create_draft_truth(
           _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                       "capture_source": "Chat Session",
                       "related_project_name": "Manage AstraJax Context On-Platform"}),
           "t", True),
       ex.Refusal, "forbidden/unknown")


def create_blank_related_projects_ok():
    out, _ = ex.act_create_draft_truth(
        _create_am({"title": "x", "canonical_text": "y", "brain_slug": "s",
                    "capture_source": "Chat Session"}), "t", True)
    return cfg.F["related_projects"] not in out["would_create"]


truthy("create-blank-related-projects-ok", create_blank_related_projects_ok())


def fill_blank_capture_source():
    am2 = am(action_class="FILL_BLANK_DRAFT_METADATA", target_record_id="r", before_hash="h",
             payload={"fields": {"capture_source": "Chat Session"}})
    out, _ = ex.act_fill_blank_draft_metadata(am2, "t", True, {})
    return out["would_update"].get(cfg.CAPTURE_SOURCE_FIELD) == "Chat Session"


truthy("fill-blank-capture-source", fill_blank_capture_source())

expect("fill-blank-capture-source-invalid-refused",
       lambda: ex.act_fill_blank_draft_metadata(
           am(action_class="FILL_BLANK_DRAFT_METADATA", target_record_id="r", before_hash="h",
              payload={"fields": {"capture_source": "Bogus"}}), "t", True, {}),
       ex.Refusal, "not an allowed choice")

expect("fill-blank-nonblank-capture-source-refused",
       lambda: ex.act_fill_blank_draft_metadata(
           am(action_class="FILL_BLANK_DRAFT_METADATA", target_record_id="r", before_hash="h",
              payload={"fields": {"capture_source": "Chat Session"}}), "t", True,
           {cfg.CAPTURE_SOURCE_FIELD: {"name": "User Guided Capture"}}),
       ex.Refusal, "not blank")


def existing_source_preserved_on_link():
    am2 = am(action_class="LINK_SOURCE_DOCUMENT", target_record_id="r", before_hash="h",
             payload={"source_document_record_ids": ["recS1"]})
    out, _ = ex.act_link_source_document(
        am2, "t", True, {cfg.CAPTURE_SOURCE_FIELD: {"name": "Chat Session"},
                         cfg.F["source_documents"]: []})
    return out["would_update"] == {cfg.F["source_documents"]: ["recS1"]}


truthy("existing-source-preserved-on-link", existing_source_preserved_on_link())

expect("link-blank-source-blocks",
       lambda: ex.act_link_source_document(
           am(action_class="LINK_SOURCE_DOCUMENT", target_record_id="r", before_hash="h",
              payload={"source_document_record_ids": ["recS1"]}), "t", True,
           {cfg.F["source_documents"]: []}),
       ex.Refusal, "blank Capture Source")

expect("fill-blank-other-field-blank-source-blocks",
       lambda: ex.act_fill_blank_draft_metadata(
           am(action_class="FILL_BLANK_DRAFT_METADATA", target_record_id="r", before_hash="h",
              payload={"fields": {"brain_theme": "x"}}), "t", True, {}),
       ex.Refusal, "blank Capture Source")


print(json.dumps({"passed": len(PASS), "failed": len(FAIL), "pass": PASS, "fail": FAIL}, indent=2))
sys.exit(1 if FAIL else 0)
