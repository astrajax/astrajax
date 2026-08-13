#!/usr/bin/env python3
"""Phase B seam tests — Ambient V1 → Challenger → V2 → Executor → Draft (mocked)."""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO = Path(__file__).resolve().parents[1]
AMBIENT_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "ambient"
CHALLENGE_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "specialists" / "context-estate-challenge"
EXEC_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "specialists" / "context-amendment-execute"
ON_DEMAND_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "on-demand"
BUILDS_DIR = REPO / "hyperagent" / "builds"


def _load_module(module_name: str, file_path: Path, prepend: Path):
    """Load a source module; purge sibling ``context_config`` to avoid cross-lane bleed."""
    saved_path = sys.path[:]
    saved_modules = {
        k: sys.modules.pop(k)
        for k in list(sys.modules)
        if k == "context_config" or k.endswith(".context_config")
    }
    sys.path.insert(0, str(prepend))
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        mod = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(mod)
        return mod
    finally:
        sys.path[:] = saved_path
        for k, v in saved_modules.items():
            sys.modules[k] = v


def _ambient_candidate(i: int = 0) -> dict:
    return {
        "title": f"Capture {i}",
        "canonical_text": f"Canonical body {i}",
        "brain_slug": "clive",
        "dedupe_key": f"ambient-key-{i}",
        "evidence": f"Exact quote from chat session {i}",
        "confidence": 0.82,
        "v1_report_record_id": "recV1Report",
        "proposed_category": "Operating",
    }


class AmbientChallengerExecutorChainTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        sys.path.insert(0, str(AMBIENT_DIR))
        import ambient_v1_intake as amb  # noqa: E402

        ch_cfg = _load_module("challenge_context_config", CHALLENGE_DIR / "context_config.py", CHALLENGE_DIR)
        ch = _load_module("challenge_estate", CHALLENGE_DIR / "context_estate_challenge.py", CHALLENGE_DIR)
        ex = _load_module("execute_amendment", EXEC_DIR / "context_amendment_execute.py", EXEC_DIR)
        cls.amb = amb
        cls.ch = ch
        cls.ch_cfg = ch_cfg
        cls.ex = ex

    def test_v1_fields_pass_v1_defects(self) -> None:
        cand = _ambient_candidate(0)
        fields = self.amb.build_v1_fields(cand, "run-seam")
        v1_view = {self.ch_cfg.AV[k]: v for k, v in {
            "action_class": {"name": "CREATE_DRAFT_TRUTH"},
            "after_payload": fields[self.ch_cfg.AV["after_payload"]],
            "evidence": fields[self.ch_cfg.AV["evidence"]],
            "confidence": fields[self.ch_cfg.AV["confidence"]],
            "v1_report_record_id": fields[self.ch_cfg.AV["v1_report_record_id"]],
            "adapter_version": fields[self.ch_cfg.AV["adapter_version"]],
            "created_by_agent": fields[self.ch_cfg.AV["created_by_agent"]],
        }.items()}
        self.assertEqual(self.ch.v1_defects(v1_view), [])

    def test_semantic_after_payload_not_field_ids(self) -> None:
        payload = self.amb.build_after_payload(_ambient_candidate(1))
        self.assertIn("title", payload)
        self.assertIn("capture_source", payload)
        self.assertNotIn("fields", payload)
        self.assertNotIn("fld8BVmRBSsVuXD8I", json.dumps(payload))

    def test_ambient_create_capture_source_valid(self) -> None:
        cand = _ambient_candidate(2)
        v1f = {
            self.ch_cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
            self.ch_cfg.AV["created_by_agent"]: "clive-man-ambient-capture",
            self.ch_cfg.AV["evidence"]: cand["evidence"],
            self.ch_cfg.AV["after_payload"]: json.dumps(self.amb.build_after_payload(cand)),
        }
        self.assertIsNone(self.ch.verify_capture_source(v1f, None))

    def test_capture_source_foreign_actor(self) -> None:
        v1f = {
            self.ch_cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
            self.ch_cfg.AV["created_by_agent"]: "someone-else",
            self.ch_cfg.AV["evidence"]: "quote",
            self.ch_cfg.AV["after_payload"]: json.dumps({"capture_source": "Chat Session"}),
        }
        self.assertIsNotNone(self.ch.verify_capture_source(v1f, None))

    def test_activity_intake_create_capture_source_valid(self) -> None:
        for actor in (
            "clive-man-activity-intake-cursor",
            "clive-man-activity-intake-hyperagent",
        ):
            v1f = {
                self.ch_cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
                self.ch_cfg.AV["created_by_agent"]: actor,
                self.ch_cfg.AV["evidence"]: "recSession",
                self.ch_cfg.AV["after_payload"]: json.dumps({"capture_source": "Chat Session"}),
            }
            self.assertIsNone(self.ch.verify_capture_source(v1f, None), msg=actor)

    def test_capture_source_missing_evidence(self) -> None:
        v1f = {
            self.ch_cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
            self.ch_cfg.AV["created_by_agent"]: "clive-man-ambient-capture",
            self.ch_cfg.AV["after_payload"]: json.dumps({"capture_source": "Chat Session"}),
        }
        self.assertIsNotNone(self.ch.verify_capture_source(v1f, None))

    def test_capture_source_target_present(self) -> None:
        v1f = {
            self.ch_cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
            self.ch_cfg.AV["created_by_agent"]: "clive-man-ambient-capture",
            self.ch_cfg.AV["evidence"]: "quote",
            self.ch_cfg.AV["target_record_id"]: "recDraft",
            self.ch_cfg.AV["after_payload"]: json.dumps({"capture_source": "Chat Session"}),
        }
        self.assertIsNotNone(self.ch.verify_capture_source(v1f, None))

    def test_v2_row_preserves_supersedes_v1(self) -> None:
        v1f = {
            self.ch_cfg.AV["amendment_version_id"]: "cav-ambient-abc-v1",
            self.ch_cfg.AV["action_class"]: "CREATE_DRAFT_TRUTH",
            self.ch_cfg.AV["target_base_id"]: self.ch_cfg.BASE_WORKSHOP,
            self.ch_cfg.AV["target_table_id"]: self.ch_cfg.T_DRAFT_TRUTH,
            self.ch_cfg.AV["dedupe_key"]: "k",
            self.ch_cfg.AV["adapter_version"]: self.ch_cfg.EXECUTOR_ADAPTER_VERSION,
            self.ch_cfg.AV["after_payload"]: json.dumps(self.amb.build_after_payload(_ambient_candidate(3))),
            self.ch_cfg.AV["confidence"]: 0.8,
            self.ch_cfg.AV["v1_report_record_id"]: "recRep",
            self.ch_cfg.AV["evidence"]: "q",
        }
        v2 = self.ch.build_v2_row(v1f, "recV1", "Cleared", "Amber", "run-v2")
        self.assertEqual(v2[self.ch_cfg.AV["supersedes_version_link"]], ["recV1"])

    def test_executor_manifest_shape_and_draft_create_dry_run(self) -> None:
        payload = self.amb.build_after_payload(_ambient_candidate(4))
        am = {
            "amendment_version_id": "cav-ambient-x-v2",
            "amendment_version_record_id": "recV2",
            "action_class": "CREATE_DRAFT_TRUTH",
            "target_base_id": self.ex.BASE_WORKSHOP,
            "target_table_id": self.ex.T_DRAFT_TRUTH,
            "adapter_version": self.ex.ADAPTER_VERSION,
            "tier": "Amber",
            "dedupe_key": "ambient-key-4",
            "executing_agent": "clive-man-ambient-capture",
            "run_id": "run-ex",
            "payload": payload,
        }
        self.ex._validate_shape(am)
        out, _ = self.ex.act_create_draft_truth(am, "t", True)
        self.assertEqual(out["would_create"][self.ex.F["title"]], payload["title"])

    def test_lane_classification_from_v1_actor_not_v2(self) -> None:
        v1_intake = {
            self.ex.AV["stage"]: {"name": "V1"},
            self.ex.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
            self.ex.AV["created_by_agent"]: "clive-man-ambient-capture",
        }
        v1_maint = {
            self.ex.AV["stage"]: {"name": "V1"},
            self.ex.AV["action_class"]: {"name": "QUARANTINE_DRAFT"},
            self.ex.AV["created_by_agent"]: "clive-man-context-auditor",
        }
        self.assertEqual(self.ex.classify_lane_from_v1(v1_intake), "intake")
        self.assertEqual(self.ex.classify_lane_from_v1(v1_maint), "maintenance")
        for actor in (
            "clive-man-activity-intake-cursor",
            "clive-man-activity-intake-hyperagent",
        ):
            v1_activity = {
                self.ex.AV["stage"]: {"name": "V1"},
                self.ex.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH"},
                self.ex.AV["created_by_agent"]: actor,
            }
            self.assertEqual(
                self.ex.classify_lane_from_v1(v1_activity),
                "intake",
                msg=actor,
            )


class ExecutorQueueMockTest(unittest.TestCase):
    _RESTORE_NAMES = (
        "check_replay_and_attempt",
        "load_cleared_v2_queue",
        "load_v1_ancestor",
        "load_authoritative_v2",
        "_has_terminal_event",
        "_list_records",
        "_create",
        "_update",
        "_get_record",
        "append_execution_event",
        "append_change_log",
        "_verify_readback",
        "check_amber_green",
    )

    @classmethod
    def setUpClass(cls) -> None:
        cls.ex = _load_module("execute_amendment_q", EXEC_DIR / "context_amendment_execute.py", EXEC_DIR)
        cls.cfg = _load_module("execute_context_config_q", EXEC_DIR / "context_config.py", EXEC_DIR)
        cls._fn_snapshot = {name: getattr(cls.ex, name) for name in cls._RESTORE_NAMES}

    def setUp(self) -> None:
        for name, fn in self._fn_snapshot.items():
            setattr(self.ex, name, fn)

    def _v2_row(self, i: int, *, intake: bool) -> dict:
        actor = "clive-man-ambient-capture" if intake else "clive-man-context-auditor"
        action = "CREATE_DRAFT_TRUTH" if intake else "QUARANTINE_DRAFT"
        return {
            "id": f"recV2{i}",
            "fields": {
                self.cfg.AV["stage"]: {"name": "V2"},
                self.cfg.AV["challenger_verdict"]: {"name": "Cleared"},
                self.cfg.AV["amendment_version_id"]: f"cav-{i}-v2",
                self.cfg.AV["action_class"]: action,
                self.cfg.AV["target_base_id"]: self.cfg.BASE_WORKSHOP,
                self.cfg.AV["target_table_id"]: self.cfg.BASE_WORKSHOP if False else self.cfg.T_DRAFT_TRUTH,
                self.cfg.AV["target_record_id"]: None if intake else f"recT{i}",
                self.cfg.AV["before_hash"]: None if intake else "hash",
                self.cfg.AV["dedupe_key"]: f"d{i}",
                self.cfg.AV["tier"]: "Amber",
                self.cfg.AV["adapter_version"]: self.cfg.ADAPTER_VERSION,
                self.cfg.AV["after_payload"]: json.dumps(
                    {
                        "title": f"T{i}",
                        "canonical_text": f"C{i}",
                        "brain_slug": "clive",
                        "capture_source": "Chat Session",
                    }
                )
                if intake
                else json.dumps({"fields": {"status": "Quarantined"}}),
                self.cfg.AV["supersedes_version_link"]: [f"recV1{i}"],
            },
        }

    def _v1_row(self, i: int, *, intake: bool) -> dict:
        return {
            "id": f"recV1{i}",
            "fields": {
                self.cfg.AV["stage"]: {"name": "V1"},
                self.cfg.AV["action_class"]: {"name": "CREATE_DRAFT_TRUTH" if intake else "QUARANTINE_DRAFT"},
                self.cfg.AV["created_by_agent"]: "clive-man-ambient-capture"
                if intake
                else "clive-man-context-auditor",
            },
        }

    def test_thirty_seven_intake_drain(self) -> None:
        v2s = [self._v2_row(i, intake=True) for i in range(37)]
        v1_map = {f"recV1{i}": self._v1_row(i, intake=True) for i in range(37)}
        self.ex._has_terminal_event = lambda *_a, **_k: False
        self.ex.load_cleared_v2_queue = lambda _t: v2s
        self.ex.load_v1_ancestor = lambda vf, _t: v1_map[vf[self.cfg.AV["supersedes_version_link"]][0]]
        self.ex.load_authoritative_v2 = lambda am, _t: next(r for r in v2s if r["id"] == am["amendment_version_record_id"])
        self.ex.check_amber_green = lambda *_a, **_k: None
        self.ex.check_replay_and_attempt = lambda *_a, **_k: (1, [])
        created = {"n": 0}

        def _create(base, table, fields, token):
            created["n"] += 1
            return {"records": [{"id": f"recDraft{created['n']}"}]}

        self.ex._create = _create
        self.ex._get_record = lambda b, t, r, tok: {"id": r, "fields": {}}
        self.ex.append_execution_event = lambda *a, **k: None
        self.ex.append_change_log = lambda *a, **k: None
        self.ex._verify_readback = lambda *a, **k: None
        out = self.ex.run_queue("tok", dry_run=False, run_id="q37")
        self.assertEqual(out["queued"], 37)
        self.assertEqual(out["lanes"]["intake"]["mutations"], 37)

    def test_maintenance_cap_five_of_six(self) -> None:
        live_fields = {
            self.cfg.F["status"]: {"name": "Draft"},
            self.cfg.F["source_documents"]: [],
        }
        live_hash = self.ex.sha(self.ex.canonical(live_fields))
        quarantined: set[str] = set()
        v2s = [self._v2_row(i, intake=False) for i in range(6)]
        for row in v2s:
            row["fields"][self.cfg.AV["before_hash"]] = live_hash
        v1_map = {f"recV1{i}": self._v1_row(i, intake=False) for i in range(6)}

        def _get_record(base, table, rid, tok):
            status = "Quarantined" if rid in quarantined else "Draft"
            return {
                "id": rid,
                "fields": {
                    self.cfg.F["status"]: {"name": status},
                    self.cfg.F["source_documents"]: [],
                },
            }

        def _update(base, table, rid, fields, tok):
            quarantined.add(rid)

        self.ex._has_terminal_event = lambda *_a, **_k: False
        self.ex.load_cleared_v2_queue = lambda _t: list(v2s)
        self.ex.load_v1_ancestor = lambda vf, _t: v1_map[vf[self.cfg.AV["supersedes_version_link"]][0]]
        self.ex.load_authoritative_v2 = lambda am, _t: next(
            r for r in v2s if r["id"] == am["amendment_version_record_id"]
        )
        self.ex.check_amber_green = lambda *_a, **_k: None
        self.ex.check_replay_and_attempt = lambda *_a, **_k: (1, [])
        self.ex._update = _update
        self.ex._get_record = _get_record
        self.ex.append_execution_event = lambda *a, **k: None
        self.ex.append_change_log = lambda *a, **k: None
        out = self.ex.run_queue("tok", dry_run=False, run_id="q6")
        self.assertEqual(out["lanes"]["maintenance"]["mutations"], 5)

    def test_terminal_event_excluded(self) -> None:
        rows = [
            {
                "id": "recV2x",
                "fields": {
                    self.cfg.AV["stage"]: {"name": "V2"},
                    self.cfg.AV["challenger_verdict"]: {"name": "Cleared"},
                },
            }
        ]

        def _filtered_loader(_token):
            out = []
            for r in rows:
                f = r.get("fields", {})
                if self.ex._sel_name(f.get(self.cfg.AV["stage"])) != "V2":
                    continue
                if self.ex._sel_name(f.get(self.cfg.AV["challenger_verdict"])) != "Cleared":
                    continue
                if self.ex._has_terminal_event(r["id"], _token):
                    continue
                out.append(r)
            return out

        self.ex._has_terminal_event = lambda *_a, **_k: True
        self.assertEqual(_filtered_loader("t"), [])

    def test_mixed_batch_lane_isolation(self) -> None:
        intake_v2s = [self._v2_row(i, intake=True) for i in range(3)]
        maint_v2s = [self._v2_row(i + 100, intake=False) for i in range(6)]
        v2s = intake_v2s + maint_v2s
        v1_map = {}
        for i in range(3):
            v1_map[f"recV1{i}"] = self._v1_row(i, intake=True)
        for i in range(6):
            v1_map[f"recV1{i + 100}"] = self._v1_row(i + 100, intake=False)
        live_fields = {
            self.cfg.F["status"]: {"name": "Draft"},
            self.cfg.F["source_documents"]: [],
        }
        live_hash = self.ex.sha(self.ex.canonical(live_fields))
        quarantined: set[str] = set()
        for row in maint_v2s:
            row["fields"][self.cfg.AV["before_hash"]] = live_hash

        def _get_record(base, table, rid, tok):
            status = "Quarantined" if rid in quarantined else "Draft"
            return {
                "id": rid,
                "fields": {
                    self.cfg.F["status"]: {"name": status},
                    self.cfg.F["source_documents"]: [],
                },
            }

        def _update(base, table, rid, fields, tok):
            quarantined.add(rid)

        self.ex._has_terminal_event = lambda *_a, **_k: False
        self.ex.load_cleared_v2_queue = lambda _t: v2s
        self.ex.load_v1_ancestor = lambda vf, _t: v1_map[vf[self.cfg.AV["supersedes_version_link"]][0]]
        self.ex.load_authoritative_v2 = lambda am, _t: next(
            r for r in v2s if r["id"] == am["amendment_version_record_id"]
        )
        self.ex.check_amber_green = lambda *_a, **_k: None
        self.ex.check_replay_and_attempt = lambda *_a, **_k: (1, [])
        self.ex._create = lambda *a, **k: {"records": [{"id": "recNew"}]}
        self.ex._get_record = _get_record
        self.ex._update = _update
        self.ex.append_execution_event = lambda *a, **k: None
        self.ex.append_change_log = lambda *a, **k: None
        self.ex._verify_readback = lambda *a, **k: None
        out = self.ex.run_queue("tok", dry_run=False, run_id="mixed")
        self.assertEqual(out["lanes"]["intake"]["mutations"], 3)
        self.assertEqual(out["lanes"]["maintenance"]["mutations"], 5)

    def test_intake_failures_do_not_stop_maintenance(self) -> None:
        bad = self._v2_row(0, intake=True)
        bad["fields"][self.cfg.AV["after_payload"]] = "{not json"
        good_maint = [self._v2_row(i + 1, intake=False) for i in range(2)]
        v2s = [bad] + good_maint
        live_fields = {
            self.cfg.F["status"]: {"name": "Draft"},
            self.cfg.F["source_documents"]: [],
        }
        live_hash = self.ex.sha(self.ex.canonical(live_fields))
        for row in good_maint:
            row["fields"][self.cfg.AV["before_hash"]] = live_hash
        v1_map = {
            "recV10": self._v1_row(0, intake=True),
            "recV11": self._v1_row(1, intake=False),
            "recV12": self._v1_row(2, intake=False),
        }
        quarantined: set[str] = set()

        def _get_record(base, table, rid, tok):
            status = "Quarantined" if rid in quarantined else "Draft"
            return {
                "id": rid,
                "fields": {
                    self.cfg.F["status"]: {"name": status},
                    self.cfg.F["source_documents"]: [],
                },
            }

        def _update(base, table, rid, fields, tok):
            quarantined.add(rid)

        self.ex._has_terminal_event = lambda *_a, **_k: False
        self.ex.load_cleared_v2_queue = lambda _t: v2s
        self.ex.load_v1_ancestor = lambda vf, _t: v1_map[vf[self.cfg.AV["supersedes_version_link"]][0]]
        self.ex.load_authoritative_v2 = lambda am, _t: next(
            r for r in v2s if r["id"] == am["amendment_version_record_id"]
        )
        self.ex.check_amber_green = lambda *_a, **_k: None
        self.ex.check_replay_and_attempt = lambda *_a, **_k: (1, [])
        self.ex._create = lambda *a, **k: {"records": [{"id": "recX"}]}
        self.ex._get_record = _get_record
        self.ex._update = _update
        self.ex.append_execution_event = lambda *a, **k: None
        self.ex.append_change_log = lambda *a, **k: None
        self.ex._verify_readback = lambda *a, **k: None
        out = self.ex.run_queue("tok", dry_run=False, run_id="iso")
        self.assertEqual(out["lanes"]["intake"]["mutations"], 0)
        self.assertEqual(out["lanes"]["maintenance"]["mutations"], 2)

    def test_legacy_attempt_reconciles_without_reapply(self) -> None:
        """Prior Attempt without Applied → monotonic next attempt (reconcile path)."""
        am = {
            "amendment_version_id": "cav-legacy-v2",
            "amendment_version_record_id": "recV2leg",
            "action_class": "CREATE_DRAFT_TRUTH",
        }

        def _fake_list_records(b, t, tok, fids=None):
            return [
                {
                    "id": "recEv1",
                    "fields": {
                        self.cfg.EE["amendment_version"]: ["recV2leg"],
                        self.cfg.EE["attempt"]: 2,
                        self.cfg.EE["event_type"]: {"name": "Attempt"},
                    },
                }
            ]

        orig_list = self.ex._list_records
        self.ex._list_records = _fake_list_records
        try:
            attempt, prior = self.ex.check_replay_and_attempt(am, "tok")
            self.assertEqual(attempt, 3)
            self.assertEqual(len(prior), 1)
        finally:
            self.ex._list_records = orig_list

        def _applied_list(b, t, tok, fids=None):
            return [
                {
                    "id": "recEv2",
                    "fields": {
                        self.cfg.EE["amendment_version"]: ["recV2leg"],
                        self.cfg.EE["attempt"]: 1,
                        self.cfg.EE["event_type"]: {"name": "Applied"},
                    },
                }
            ]

        self.ex._list_records = _applied_list
        try:
            with self.assertRaises(self.ex.Refusal):
                self.ex.check_replay_and_attempt(am, "tok")
        finally:
            self.ex._list_records = orig_list


class OnDemandBoundaryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ex = _load_module("on_demand_executor", ON_DEMAND_DIR / "clive_man_on_demand_executor.py", ON_DEMAND_DIR)

    def _lane_a(self, **over) -> dict:
        brief = {
            "lane": "A",
            "verbatim": True,
            "content_judgement": False,
            "source_class": "human",
            "source_actor": "Matthew",
            "origin": "interactive",
            "idempotency_key": "lane-a-test",
            "actions": [
                {
                    "operation": "create",
                    "table_id": "tblswvXNYFDqnl6af",
                    "fields": {
                        "fld8BVmRBSsVuXD8I": "Title",
                        "fld95ls0LG26rCNx4": "Verbatim text",
                        "flddfROfNcP1u6gCy": "clive",
                        "fldiMCxuBITyZIOXW": "Draft",
                    },
                }
            ],
        }
        brief.update(over)
        return brief

    def test_lane_a_blocks_patch(self) -> None:
        brief = self._lane_a()
        brief["actions"] = [
            {
                "operation": "patch",
                "table_id": "tblswvXNYFDqnl6af",
                "record_id": "recX",
                "before_hash": "h",
                "before_snapshot": "{}",
                "fields": {"fldiMCxuBITyZIOXW": "Quarantined"},
            }
        ]
        self.assertFalse(self.ex.preview(brief)["ok"])

    def test_lane_b_blocks_revise(self) -> None:
        brief = {
            "lane": "B",
            "challenger_verdict": "revise",
            "proposer_handoff": {"x": 1},
            "final_brief": {},
            "final_brief_hash": "bad",
            "actions": [],
        }
        self.assertFalse(self.ex.preview(brief)["ok"])

    def test_lane_b_proceed_hash_match(self) -> None:
        actions = [
            {
                "operation": "patch",
                "table_id": "tblswvXNYFDqnl6af",
                "record_id": "recX",
                "before_hash": "abc",
                "before_snapshot": "{}",
                "fields": {"fldiMCxuBITyZIOXW": "Quarantined"},
            }
        ]
        handoff = {"handoff": True}
        final_brief = {
            "goal": "capture",
            "actions": actions,
            "proposer_handoff_hash": __import__("hashlib").sha256(
                json.dumps(handoff, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
        }
        brief = {
            "lane": "B",
            "challenger_verdict": "proceed",
            "proposer_handoff": handoff,
            "final_brief": final_brief,
            "final_brief_hash": __import__("hashlib").sha256(
                json.dumps(final_brief, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
            "actions": actions,
        }
        self.assertTrue(self.ex.preview(brief)["ok"])

    @patch.dict(os.environ, {"CLIVE_MAN_ON_DEMAND_WRITE": "pat"})
    @patch("urllib.request.urlopen")
    def test_create_replay_skips(self, mock_urlopen: MagicMock) -> None:
        list_resp = MagicMock()
        list_resp.read.return_value = json.dumps(
            {
                "records": [
                    {
                        "id": "recExisting",
                        "fields": {
                            "fld95ls0LG26rCNx4": "Verbatim text",
                            "fld8BVmRBSsVuXD8I": "Title",
                            "flddfROfNcP1u6gCy": "clive",
                            "fld9zhLHPvjnq8lHT": {"name": "Chat Session"},
                        },
                    }
                ]
            }
        ).encode()
        list_resp.__enter__ = lambda s: list_resp
        list_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = list_resp
        out = self.ex.execute(self._lane_a(), dry_run=False)
        self.assertEqual(out["results"][0]["outcome"], "Skipped")

    @patch.dict(os.environ, {"CLIVE_MAN_ON_DEMAND_WRITE": "pat"})
    @patch("urllib.request.urlopen")
    def test_stale_before_hash_refuses(self, mock_urlopen: MagicMock) -> None:
        live_fields = {"fldiMCxuBITyZIOXW": "Draft", "fld95ls0LG26rCNx4": "text"}
        live_hash = self.ex._hash_fields(live_fields)
        get_resp = MagicMock()
        get_resp.read.return_value = json.dumps({"fields": live_fields}).encode()
        get_resp.__enter__ = lambda s: get_resp
        get_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = get_resp
        import hashlib

        actions = [
            {
                "operation": "patch",
                "table_id": "tblswvXNYFDqnl6af",
                "record_id": "recX",
                "before_hash": "stale-not-matching",
                "before_snapshot": self.ex._canonical(live_fields),
                "fields": {"fldiMCxuBITyZIOXW": "Quarantined"},
            }
        ]
        handoff = {"handoff": True}
        fb = {
            "goal": "patch",
            "actions": actions,
            "proposer_handoff_hash": hashlib.sha256(
                json.dumps(handoff, sort_keys=True, separators=(",", ":")).encode()
            ).hexdigest(),
        }
        h = hashlib.sha256(json.dumps(fb, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        brief = {
            "lane": "B",
            "challenger_verdict": "proceed",
            "proposer_handoff": handoff,
            "final_brief": fb,
            "final_brief_hash": h,
            "actions": actions,
        }
        with self.assertRaises(self.ex.PenError) as ctx:
            self.ex.execute(brief, dry_run=False)
        self.assertIn("stale before_hash", str(ctx.exception))
        self.assertNotEqual(live_hash, "stale-not-matching")

    @patch.dict(os.environ, {"CLIVE_MAN_ON_DEMAND_WRITE": "pat"})
    @patch("urllib.request.urlopen")
    def test_readback_mismatch_fails_without_success(self, mock_urlopen: MagicMock) -> None:
        list_resp = MagicMock()
        list_resp.read.return_value = json.dumps({"records": []}).encode()
        list_resp.__enter__ = lambda s: list_resp
        list_resp.__exit__ = MagicMock(return_value=False)
        create_resp = MagicMock()
        create_resp.read.return_value = json.dumps(
            {"records": [{"id": "recDR", "fields": {"fld8BVmRBSsVuXD8I": "Title"}}]}
        ).encode()
        create_resp.__enter__ = lambda s: create_resp
        create_resp.__exit__ = MagicMock(return_value=False)
        read_resp = MagicMock()
        read_resp.read.return_value = json.dumps(
            {"fields": {"fld8BVmRBSsVuXD8I": "Wrong Title"}}
        ).encode()
        read_resp.__enter__ = lambda s: read_resp
        read_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.side_effect = [list_resp, create_resp, read_resp]
        with self.assertRaises(self.ex.PenError):
            self.ex.execute(self._lane_a(), dry_run=False)


class ReadHelperTest(unittest.TestCase):
    def test_registry_and_workshop_allowed(self) -> None:
        rd = _load_module("workshop_read", ON_DEMAND_DIR / "clive_man_workshop_read.py", ON_DEMAND_DIR)
        rd.discover_trusted_allowlist = lambda _t: {"appTrusted": set()}
        rd._req = lambda m, p, t, body=None: {"fields": {}}
        evidence = rd.read_evidence("tblswvXNYFDqnl6af", "recX", token="fake")
        self.assertEqual(evidence["record_id"], "recX")

    def test_unknown_base_refused(self) -> None:
        rd = _load_module("workshop_read2", ON_DEMAND_DIR / "clive_man_workshop_read.py", ON_DEMAND_DIR)
        rd.discover_trusted_allowlist = lambda _t: {}
        with self.assertRaises(rd.ReadError):
            rd.read_evidence("tblX", "recX", base_id="appUnknown", token="fake")

    def test_write_refused(self) -> None:
        rd = _load_module("workshop_read3", ON_DEMAND_DIR / "clive_man_workshop_read.py", ON_DEMAND_DIR)
        with self.assertRaises(rd.WriteRefused):
            rd._req("POST", "/x", "fake")


class HouseholdEmbedTest(unittest.TestCase):
    def test_four_household_skills_load(self) -> None:
        sys.path.insert(0, str(BUILDS_DIR))
        from _clive_man_household_loader import household_skill_embeds  # noqa: E402

        embeds = household_skill_embeds()
        self.assertEqual(len(embeds), 4)
        names = {e["name"] for e in embeds}
        self.assertIn("Household Communication Standard", names)
        self.assertIn("Household Activity Logging", names)

    def test_activity_logging_credential_present(self) -> None:
        sys.path.insert(0, str(BUILDS_DIR))
        from _clive_man_household_loader import activity_logging_has_credential_schema  # noqa: E402

        self.assertTrue(activity_logging_has_credential_schema())


if __name__ == "__main__":
    unittest.main(verbosity=2)
