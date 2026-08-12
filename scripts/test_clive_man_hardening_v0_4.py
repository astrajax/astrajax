#!/usr/bin/env python3
"""Bounded hardening tests — no-loss loops, Lane A/B binding, routing freshness, backlog alarm."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO = Path(__file__).resolve().parents[1]
AMBIENT_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "ambient"
EXEC_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "specialists" / "context-amendment-execute"
ON_DEMAND_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "on-demand"
BUILDS_DIR = REPO / "hyperagent" / "builds"
EXPORTS_AGENTS = REPO / "hyperagent" / "exports" / "agents"


def _load_module(module_name: str, file_path: Path, prepend: Path):
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


def _canonical_hash(payload: dict) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def _lane_b_brief(actions: list, *, handoff: dict | None = None, final_brief: dict | None = None) -> dict:
    handoff = handoff or {"handoff": True, "proposer": "clive-man-proposer"}
    fb = final_brief or {
        "goal": "capture",
        "actions": actions,
        "proposer_handoff_hash": _canonical_hash(handoff),
    }
    if "actions" not in fb:
        fb["actions"] = actions
    return {
        "lane": "B",
        "challenger_verdict": "proceed",
        "proposer_handoff": handoff,
        "final_brief": fb,
        "final_brief_hash": _canonical_hash(fb),
        "actions": actions,
    }


class AmbientNoLossTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        sys.path.insert(0, str(AMBIENT_DIR))
        import ambient_v1_intake as amb  # noqa: E402

        cls.amb = amb

    def _candidate(self, i: int, **over) -> dict:
        base = {
            "title": f"T{i}",
            "canonical_text": f"C{i}",
            "brain_slug": "clive",
            "dedupe_key": f"k-{i}",
            "evidence": f"quote {i}",
            "confidence": 0.8,
            "v1_report_record_id": "recReport",
        }
        base.update(over)
        return base

    def test_two_invalid_then_valid_requeues_tail(self) -> None:
        candidates = [
            self._candidate(0, evidence=""),
            self._candidate(1, v1_report_record_id=""),
            self._candidate(2),
            self._candidate(3),
        ]
        out = self.amb.process_candidates(candidates, run_id="r", dry_run=True)
        self.assertEqual(out["written_count"], 0)
        self.assertGreaterEqual(out["requeued_count"], 4)
        self.assertEqual(out["stop_reason"], "failure_cap")

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat", "AMBIENT_CHECKPOINT_APPEND": "pat-append"})
    @patch("urllib.request.urlopen")
    def test_short_post_requeues_all(self, mock_urlopen: MagicMock) -> None:
        def _responses(*args, **kwargs):
            req = args[0]
            if req.method == "POST":
                body = json.loads(req.data.decode())
                # Return one fewer record than requested
                recs = body["records"][:1]
                resp = MagicMock()
                resp.read.return_value = json.dumps(
                    {"records": [{"id": "recONE", "fields": recs[0]["fields"]}]}
                ).encode()
                resp.__enter__ = lambda s: resp
                resp.__exit__ = MagicMock(return_value=False)
                return resp
            resp = MagicMock()
            resp.read.return_value = json.dumps({"records": [], "offset": None}).encode()
            resp.__enter__ = lambda s: resp
            resp.__exit__ = MagicMock(return_value=False)
            return resp

        mock_urlopen.side_effect = _responses
        candidates = [self._candidate(i) for i in range(3)]
        out = self.amb.process_candidates(candidates, run_id="short", dry_run=False)
        self.assertEqual(out["written_count"], 0)
        self.assertGreaterEqual(out["requeued_count"], 3)
        self.assertIn("short_post", out["stop_reason"])

    def test_interrupt_at_thirteen_chunk_ten(self) -> None:
        candidates = [self._candidate(i) for i in range(20)]
        out = self.amb.process_candidates(
            candidates, run_id="cap", dry_run=True, interrupt_after=13, chunk_size=10
        )
        self.assertEqual(out["written_count"], 13)
        self.assertEqual(out["remaining"], 7)
        self.assertEqual(out["checkpoint_through_index"], 13)
        self.assertEqual(out["budget_stop"], 13)
        self.assertEqual(len(out["remaining_candidates"]), 7)


class ExecutorNoLossTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ex = _load_module("exec_hard", EXEC_DIR / "context_amendment_execute.py", EXEC_DIR)
        cls.cfg = _load_module("cfg_hard", EXEC_DIR / "context_config.py", EXEC_DIR)

    def test_terminal_includes_skipped_compensated(self) -> None:
        self.assertIn("Skipped", self.cfg.TERMINAL_EVENT_TYPES)
        self.assertIn("Compensated", self.cfg.TERMINAL_EVENT_TYPES)
        self.assertNotIn("Attempt", self.cfg.TERMINAL_EVENT_TYPES)

    def test_skipped_event_not_terminal_for_queue(self) -> None:
        self.ex._list_records = lambda *a, **k: [
            {
                "id": "ev1",
                "fields": {
                    self.cfg.EE["amendment_version"]: ["recV2"],
                    self.cfg.EE["event_type"]: {"name": "Skipped"},
                },
            }
        ]
        self.assertTrue(self.ex._has_terminal_event("recV2", "tok"))

    def test_attempt_not_terminal(self) -> None:
        self.ex._list_records = lambda *a, **k: [
            {
                "id": "ev1",
                "fields": {
                    self.cfg.EE["amendment_version"]: ["recV2"],
                    self.cfg.EE["event_type"]: {"name": "Attempt"},
                },
            }
        ]
        self.assertFalse(self.ex._has_terminal_event("recV2", "tok"))

    def test_failure_cap_requeues_unattempted(self) -> None:
        ams = [
            {
                "amendment_version_id": f"cav-{i}-v2",
                "action_class": "QUARANTINE_DRAFT",
                "target_base_id": self.cfg.BASE_WORKSHOP,
                "target_table_id": self.cfg.T_DRAFT_TRUTH,
                "target_record_id": f"recT{i}",
                "before_hash": "h",
                "adapter_version": self.cfg.ADAPTER_VERSION,
                "tier": "Amber",
                "dedupe_key": f"d{i}",
                "executing_agent": self.cfg.ACTOR_SCHEDULED,
                "run_id": "r",
            }
            for i in range(4)
        ]
        manifest = {"lane": "maintenance", "executing_agent": self.cfg.ACTOR_SCHEDULED, "run_id": "r", "amendments": ams}

        def _fail_handler(am, token, dry, cur_fields):
            raise self.ex.Blocked("simulated")

        self.ex._get_record = lambda *a, **k: {
            "fields": {self.cfg.F["status"]: {"name": "Draft"}, self.cfg.F["source_documents"]: []}
        }
        self.ex.load_authoritative_v2 = lambda am, tok: None
        self.ex.check_amber_green = lambda *a, **k: None
        self.ex.check_replay_and_attempt = lambda *a, **k: (1, [])
        self.ex._update = lambda *a, **k: None
        self.ex.append_execution_event = lambda *a, **k: None
        self.ex.append_change_log = lambda *a, **k: None
        orig = self.ex.EXISTING_HANDLERS["QUARANTINE_DRAFT"]

        def _fail_handler(am, token, dry, cur_fields):
            raise self.ex.Blocked("simulated")

        self.ex.EXISTING_HANDLERS["QUARANTINE_DRAFT"] = _fail_handler
        try:
            out = self.ex.execute_lane(manifest, "tok", dry_run=False)
            self.assertEqual(out["mutations"], 0)
            self.assertGreaterEqual(out["failures"], 2)
            self.assertGreaterEqual(out["requeued"], 2)
        finally:
            self.ex.EXISTING_HANDLERS["QUARANTINE_DRAFT"] = orig

    def test_backlog_alarm_three_rise(self) -> None:
        self.assertTrue(self.ex.evaluate_backlog_alarm([5, 8], 12))
        self.assertFalse(self.ex.evaluate_backlog_alarm([5, 8], 7))
        self.assertFalse(self.ex.evaluate_backlog_alarm([5], 12))

    def test_run_queue_backlog_alarm_field(self) -> None:
        self.ex.load_cleared_v2_queue = lambda _t: []
        out = self.ex.run_queue("tok", dry_run=False, run_id="q", backlog_history=[3, 5])
        self.assertFalse(out["backlog_alarm"])
        # Rising third run requires current backlog > prior history tail.
        self.ex.load_cleared_v2_queue = lambda _t: [{"id": f"rec{i}", "fields": {}} for i in range(3)]
        self.ex.load_v1_ancestor = lambda vf, tok: {"fields": {}}
        out2 = self.ex.run_queue("tok", dry_run=False, run_id="q2", backlog_history=[1, 2])
        self.assertEqual(out2["backlog"], 3)
        self.assertTrue(out2["backlog_alarm"])


class LaneABindingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ex = _load_module("od_hard", ON_DEMAND_DIR / "clive_man_on_demand_executor.py", ON_DEMAND_DIR)

    def _lane_a(self, actor: str, *, source_class: str | None = None) -> dict:
        if source_class is None:
            source_class = "human" if actor in ("Matthew", "Tara-Lee") else "household_agent"
        return {
            "lane": "A",
            "verbatim": True,
            "content_judgement": False,
            "source_class": source_class,
            "source_actor": actor,
            "origin": "interactive",
            "idempotency_key": f"lane-a-{actor}",
            "actions": [
                {
                    "operation": "create",
                    "table_id": "tblswvXNYFDqnl6af",
                    "fields": {
                        "fld8BVmRBSsVuXD8I": "Title",
                        "fld95ls0LG26rCNx4": "text",
                        "flddfROfNcP1u6gCy": "clive",
                        "fldiMCxuBITyZIOXW": "Draft",
                    },
                }
            ],
        }

    def test_matthew_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("Matthew"))["ok"])

    def test_tara_lee_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("Tara-Lee"))["ok"])

    def test_roster_slug_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("clive-man-proposer"))["ok"])

    def test_builder_minion_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("doc-vercel-minion"))["ok"])

    def test_random_at_rejected(self) -> None:
        self.assertFalse(self.ex.preview(self._lane_a("@evil"))["ok"])

    def test_hyphen_fake_rejected(self) -> None:
        self.assertFalse(self.ex.preview(self._lane_a("made-up-agent"))["ok"])

    def test_ambient_canonical_rejected(self) -> None:
        brief = self._lane_a("clive-man-ambient-capture", source_class="household_agent")
        brief["origin"] = "interactive"
        self.assertFalse(self.ex.preview(brief)["ok"])

    def test_ambient_alias_rejected(self) -> None:
        brief = self._lane_a("clive-s-man-ambient-capture", source_class="household_agent")
        brief["origin"] = "interactive"
        self.assertFalse(self.ex.preview(brief)["ok"])

    def test_clive_human_rejected(self) -> None:
        self.assertFalse(self.ex.preview(self._lane_a("clive", source_class="human"))["ok"])

    def test_matthew_household_agent_rejected(self) -> None:
        self.assertFalse(self.ex.preview(self._lane_a("Matthew", source_class="household_agent"))["ok"])

    def test_clive_household_agent_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("clive", source_class="household_agent"))["ok"])

    def test_matthew_human_allowed(self) -> None:
        self.assertTrue(self.ex.preview(self._lane_a("Matthew", source_class="human"))["ok"])


class LaneBBindingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.ex = _load_module("od_lane_b", ON_DEMAND_DIR / "clive_man_on_demand_executor.py", ON_DEMAND_DIR)

    def _patch_action(self) -> dict:
        return {
            "operation": "patch",
            "table_id": "tblswvXNYFDqnl6af",
            "record_id": "recX",
            "before_hash": "abc",
            "before_snapshot": "{}",
            "fields": {"fldiMCxuBITyZIOXW": "Quarantined"},
        }

    def test_valid_proceed(self) -> None:
        actions = [self._patch_action()]
        self.assertTrue(self.ex.preview(_lane_b_brief(actions))["ok"])

    def test_substituted_action_rejected(self) -> None:
        actions = [self._patch_action()]
        fb_actions = [
            {
                **self._patch_action(),
                "fields": {"fldiMCxuBITyZIOXW": "Draft"},
            }
        ]
        handoff = {"handoff": True}
        fb = {"goal": "x", "actions": fb_actions, "proposer_handoff_hash": _canonical_hash(handoff)}
        brief = {
            "lane": "B",
            "challenger_verdict": "proceed",
            "proposer_handoff": handoff,
            "final_brief": fb,
            "final_brief_hash": _canonical_hash(fb),
            "actions": actions,
        }
        self.assertFalse(self.ex.preview(brief)["ok"])

    def test_handoff_substitution_rejected(self) -> None:
        actions = [self._patch_action()]
        handoff = {"handoff": True}
        wrong_handoff = {"handoff": False}
        fb = {
            "goal": "x",
            "actions": actions,
            "proposer_handoff_hash": _canonical_hash(handoff),
        }
        brief = {
            "lane": "B",
            "challenger_verdict": "proceed",
            "proposer_handoff": wrong_handoff,
            "final_brief": fb,
            "final_brief_hash": _canonical_hash(fb),
            "actions": actions,
        }
        self.assertFalse(self.ex.preview(brief)["ok"])


class RoutingFreshnessTest(unittest.TestCase):
    def test_family_embedded_routing_option3(self) -> None:
        sys.path.insert(0, str(BUILDS_DIR))
        from _clive_man_household_loader import household_skill_embeds  # noqa: E402

        routing = next(e for e in household_skill_embeds() if e["name"] == "Household Routing Standard")
        body = routing.get("skillMdBody") or routing.get("documentation") or ""
        self.assertIn("Lane A (direct Executor)", body)
        self.assertIn("@clive-man", body)
        self.assertNotIn("cmr6w20tg1ng407adunjmxnge", body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
