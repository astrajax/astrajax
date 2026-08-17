#!/usr/bin/env python3
"""Tests for Clive's Man Activity Intake v0.1 (HA twin).

Floor: 10+ capability, 15+ boundary (ACT-INT-*).
"""

from __future__ import annotations

import importlib.util
import json
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
SOURCE_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-activity-intake-v0_1"
EXPORT_PATH = (
    REPO / "hyperagent" / "exports" / "agents" / "agent-clive-man-activity-intake-hyperagent-v0_1.json"
)
BUILD_PACK = REPO / "agents" / "registry" / "hyperagent" / "clive" / "activity-intake" / "build-pack-v0.1.md"


def _load_module(name: str, filename: str):
    path = SOURCE_DIR / filename
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.path.insert(0, str(SOURCE_DIR))
    try:
        spec.loader.exec_module(mod)
        return mod
    finally:
        if str(SOURCE_DIR) in sys.path:
            sys.path.remove(str(SOURCE_DIR))


class ActivityIntakeCapabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cfg = _load_module("act_cfg", "household_activity_config.py")
        cls.read = _load_module("act_read", "household_activity_read.py")
        cls.intake = _load_module("act_intake", "household_activity_intake.py")

    def test_act_int_001_actor_literal(self) -> None:
        self.assertEqual(self.cfg.ACTOR_HYPERAGENT, "clive-man-activity-intake-hyperagent")

    def test_act_int_002_stream_key(self) -> None:
        self.assertEqual(
            self.cfg.STREAM_KEY,
            "household-activity:activity:clive-man-activity-intake:v1",
        )

    def test_act_int_003_legacy_stream_distinct(self) -> None:
        self.assertNotEqual(self.cfg.STREAM_KEY, self.cfg.LEGACY_THREAD_STREAM_KEY)
        self.assertIn("clive-man-activity-intake", self.cfg.STREAM_KEY)
        self.assertNotIn("ambient", self.cfg.STREAM_KEY.lower())

    def test_act_int_004_first_live_cap(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE", None)
            self.assertEqual(self.intake.v1_cap_for_run(), 1)

    def test_act_int_005_steady_cap(self) -> None:
        with patch.dict(os.environ, {"ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE": "true"}):
            self.assertEqual(self.intake.v1_cap_for_run(), 10)

    def test_act_int_006_read_pen_sessions_and_activity_only(self) -> None:
        base = self.cfg.HOUSEHOLD_BASE_ID
        for table in (self.cfg.SESSIONS_TABLE, self.cfg.ACTIVITY_TABLE):
            path = f"/{base}/{table}"
            self.read.enforce_read_path("GET", path)  # no raise
        with self.assertRaises(self.read.ReadPenError):
            self.read.enforce_read_path("GET", f"/{base}/{self.cfg.REPORTS_TABLE}")

    def test_act_int_007_write_pen_amendment_versions_only(self) -> None:
        path = f"/{self.cfg.WORKSHOP_BASE_ID}/{self.cfg.AMENDMENT_VERSIONS_TABLE}"
        self.intake._enforce_path_for_role("POST", path, self.cfg.CRED_ROLE_V1_CREATE)
        with self.assertRaises(self.intake.IntakeError):
            draft = f"/{self.cfg.WORKSHOP_BASE_ID}/{self.cfg.DRAFT_TRUTH_TABLE}"
            self.intake._enforce_path_for_role("POST", draft, self.cfg.CRED_ROLE_V1_CREATE)

    def test_act_int_008_exchange_requires_both_messages(self) -> None:
        af = {
            self.cfg.ACT["user_message"]: "hello",
            self.cfg.ACT["reply_digest"]: "world",
            self.cfg.ACT["event_type"]: "Turn",
        }
        ok, _ = self.intake.is_eligible_exchange_row(af, None)
        self.assertTrue(ok)
        af2 = dict(af)
        af2[self.cfg.ACT["reply_digest"]] = ""
        ok2, reason = self.intake.is_eligible_exchange_row(af2, None)
        self.assertFalse(ok2)
        self.assertEqual(reason, "incomplete_exchange")

    def test_act_int_009_excluded_agent_slugs(self) -> None:
        self.assertIn("clive-man-ambient-capture", self.cfg.EXCLUDED_AGENT_SLUGS)
        self.assertIn("clive-man-activity-intake-cursor", self.cfg.EXCLUDED_AGENT_SLUGS)
        self.assertIn("clive-man-activity-intake-hyperagent", self.cfg.EXCLUDED_AGENT_SLUGS)

    def test_act_int_010_truthful_actor_on_v1_fields(self) -> None:
        cand = {
            "title": "T",
            "canonical_text": "x" * 25,
            "brain_slug": "clive",
            "evidence": "e",
            "confidence": 0.8,
            "dedupe_key": "k1",
            "v1_report_record_id": "recReport",
            "capture_source_chat_session": "recSess1",
        }
        fields = self.intake.build_v1_fields(cand, "run-1")
        self.assertEqual(fields[self.cfg.AV["created_by_agent"]], "clive-man-activity-intake-hyperagent")

    def test_act_int_011_after_payload_matches_executor_allowlist(self) -> None:
        cand = {
            "title": "T",
            "canonical_text": "x" * 25,
            "brain_slug": "clive",
            "capture_source_chat_session": "recSessABC",
        }
        after = self.intake.build_after_payload(cand)
        self.assertEqual(after["capture_source"], "Chat Session")
        self.assertNotIn("capture_source_chat_session", after)
        # Executor CREATE_DRAFT_TRUTH allowlist — any extra key is a terminal Refusal.
        executor_allowed = {
            "title",
            "canonical_text",
            "brain_slug",
            "proposed_category",
            "brain_theme",
            "record_type",
            "horizon",
            "capture_source",
            "supersedes_trusted_truth_id",
            "source_documents",
        }
        self.assertTrue(set(after) <= executor_allowed, after)

    def test_act_int_011b_event_type_is_agent_turn_type(self) -> None:
        # User Turn Type is AI-owned; eligibility reads Agent Turn Type only.
        self.assertEqual(self.cfg.ACT["event_type"], "fldvskIDzutu4JzQt")
        self.assertNotEqual(self.cfg.ACT["event_type"], "fldTCd93XF8XhsVoZ")

    def test_act_int_012_export_governed_defaults(self) -> None:
        if not EXPORT_PATH.is_file():
            self.skipTest("export not built yet — run build generator first")
        export = json.loads(EXPORT_PATH.read_text(encoding="utf-8"))
        data = export["data"]
        tools = json.loads(data["toolSettings"])
        self.assertTrue(tools.get("execute-script"))
        self.assertFalse(tools.get("globalTablesEnabled"))
        self.assertFalse(tools.get("browser"))
        self.assertFalse(tools.get("web-search"))
        self.assertEqual(data["modelId"], "moonshotai/kimi-k3")
        self.assertEqual(data["effort"], "low")
        self.assertEqual(data["maxBudgetUsd"], 10)
        self.assertFalse(data["enableKnowledgeDiscovery"])
        self.assertFalse(data["enableSkillSuggestions"])
        self.assertEqual(data["skillScope"], "selected")
        self.assertEqual(data["skillLoadMode"], "preload")
        self.assertEqual(json.loads(data["allowedIntegrations"]), [])
        self.assertEqual(data["scheduledInvocations"], [])


class ActivityIntakeBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.cfg = _load_module("act_cfg_b", "household_activity_config.py")
        cls.read = _load_module("act_read_b", "household_activity_read.py")
        cls.intake = _load_module("act_intake_b", "household_activity_intake.py")

    def _candidate(self, **over) -> dict:
        base = {
            "title": "Proposal title here",
            "canonical_text": "Durable canonical text for the proposal row.",
            "brain_slug": "clive",
            "evidence": '{"event":"e1"}',
            "confidence": 0.8,
            "dedupe_key": "ha-exchange:recS1:ev1",
            "v1_report_record_id": "recReport",
            "capture_source_chat_session": "recS1",
            "created_by_agent": self.cfg.ACTOR_HYPERAGENT,
        }
        base.update(over)
        return base

    def test_boundary_read_pen_rejects_post(self) -> None:
        with self.assertRaises(self.read.ReadPenError):
            self.read.enforce_read_path("POST", f"/{self.cfg.HOUSEHOLD_BASE_ID}/{self.cfg.ACTIVITY_TABLE}")

    def test_boundary_read_pen_rejects_other_base(self) -> None:
        with self.assertRaises(self.read.ReadPenError):
            self.read.enforce_read_path("GET", f"/appOTHER/{self.cfg.ACTIVITY_TABLE}")

    def test_boundary_blank_capture_source_chat_session(self) -> None:
        errs = self.intake.validate_candidate(self._candidate(capture_source_chat_session=""))
        self.assertTrue(any("capture_source_chat_session" in e for e in errs))

    def test_boundary_nonblank_capture_same_create_payload(self) -> None:
        cand = self._candidate()
        after = self.intake.build_after_payload(cand)
        # Sessions provenance stays on the candidate / evidence, not after_payload.
        self.assertTrue(str(cand["capture_source_chat_session"]).startswith("rec"))
        self.assertNotIn("capture_source_chat_session", after)
        self.assertEqual(after["capture_source"], "Chat Session")

    def test_boundary_wrong_created_by_agent(self) -> None:
        errs = self.intake.validate_candidate(
            self._candidate(created_by_agent="clive-man-ambient-capture")
        )
        self.assertTrue(any("created_by_agent" in e for e in errs))

    def test_boundary_fresh_foreign_lease_refused(self) -> None:
        future = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        token = {"runtime_owner": "cursor", "lease_until_utc": future}
        ok, reason = self.intake.check_runtime_lease(token, runtime_owner="hyperagent")
        self.assertFalse(ok)
        self.assertIn("lease_held", reason)

    def test_boundary_expired_foreign_lease_allowed(self) -> None:
        past = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        token = {"runtime_owner": "cursor", "lease_until_utc": past}
        ok, _ = self.intake.check_runtime_lease(token, runtime_owner="hyperagent")
        self.assertTrue(ok)

    def test_boundary_same_runtime_lease_allowed(self) -> None:
        future = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        token = {"runtime_owner": "hyperagent", "lease_until_utc": future}
        ok, _ = self.intake.check_runtime_lease(token, runtime_owner="hyperagent")
        self.assertTrue(ok)

    def test_boundary_session_end_excluded(self) -> None:
        af = {
            self.cfg.ACT["user_message"]: "u",
            self.cfg.ACT["reply_digest"]: "r",
            self.cfg.ACT["event_type"]: "Session End",
        }
        ok, reason = self.intake.is_eligible_exchange_row(af, None)
        self.assertFalse(ok)
        self.assertIn("Session End", reason)

    def test_boundary_action_noise_excluded(self) -> None:
        af = {
            self.cfg.ACT["user_message"]: "u",
            self.cfg.ACT["reply_digest"]: "r",
            self.cfg.ACT["event_type"]: "Action",
        }
        ok, _ = self.intake.is_eligible_exchange_row(af, None)
        self.assertFalse(ok)

    def test_boundary_legacy_stream_read_forbidden(self) -> None:
        with self.assertRaises(self.intake.IntakeError):
            self.intake.read_stream_tip(stream_key=self.cfg.LEGACY_THREAD_STREAM_KEY, dry_run=False)

    def test_boundary_checkpoint_optional_without_append_pen(self) -> None:
        """Checkpoint pen is optional; missing pen yields empty tip, not a hard block."""
        with patch.dict(os.environ, {}, clear=True):
            tip = self.intake.read_stream_tip(dry_run=False)
        self.assertEqual(tip.get("tip_revision"), -1)
        self.assertEqual(tip.get("cursor_token"), {})

    def test_boundary_dedupe_skips_existing(self) -> None:
        cands = [self._candidate()]
        with patch.object(self.intake, "list_existing_by_dedupe", return_value={cands[0]["dedupe_key"]: "recX"}):
            out = self.intake.process_candidates(cands, run_id="r1", dry_run=True)
        self.assertEqual(out["written_count"], 0)
        self.assertEqual(out["skipped_count"], 1)

    def test_boundary_cap_one_first_live(self) -> None:
        cands = [self._candidate(dedupe_key=f"k{i}") for i in range(3)]
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE", None)
            out = self.intake.process_candidates(cands, run_id="r1", dry_run=True)
        self.assertEqual(out["written_count"], 1)
        self.assertEqual(out["cap"], 1)
        self.assertGreaterEqual(out["requeued_count"], 2)

    def test_boundary_sealed_v1_pen_missing_on_post(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(self.intake.IntakeError):
                self.intake.airtable_request(
                    "POST",
                    f"/{self.cfg.WORKSHOP_BASE_ID}/{self.cfg.AMENDMENT_VERSIONS_TABLE}",
                    credential_role=self.cfg.CRED_ROLE_V1_CREATE,
                    body={"records": []},
                    dry_run=False,
                )

    def test_boundary_no_auto_clear_first_live_eligibility(self) -> None:
        """First-live cap must not auto-clear without explicit env gate."""
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(self.intake.v1_cap_for_run(), 1)
            self.assertNotIn("ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE", os.environ)

    def test_boundary_after_payload_capture_source_chat_session(self) -> None:
        cand = self._candidate()
        after = self.intake.build_after_payload(cand)
        self.assertEqual(after.get("capture_source"), "Chat Session")
        self.assertNotIn("capture_source_chat_session", after)
        errs = self.intake.validate_candidate({**cand, "after_payload": after})
        self.assertEqual(errs, [])

    def test_boundary_live_dedupe_unavailable_refuses_create(self) -> None:
        """Without the checkpoint pen, live create must not silently skip dedupe."""
        cands = [self._candidate()]
        with patch.dict(os.environ, {}, clear=True):
            out = self.intake.process_candidates(cands, run_id="r1", dry_run=False)
        self.assertEqual(out["written_count"], 0)
        self.assertEqual(out["stop_reason"], "dedupe_unavailable")
        self.assertEqual(out["skipped_count"], 1)
        self.assertEqual(out["skipped"][0]["reason"], "dedupe_unavailable")

    def test_boundary_user_question_not_excluded_via_agent_field(self) -> None:
        """User Turn Type=Question must not exclude; exclusions use Agent Turn Type."""
        af = {
            self.cfg.ACT["user_message"]: "Should we promote?",
            self.cfg.ACT["reply_digest"]: "Only after Phase B clears.",
            # Agent Turn Type blank (ordinary exchange) — eligible.
        }
        ok, reason = self.intake.is_eligible_exchange_row(af, None)
        self.assertTrue(ok, reason)
        # If someone stuffed User Turn Type into the old wrong field id, Agent field
        # still governs — confirm Session End on Agent field excludes.
        af_end = {
            **af,
            self.cfg.ACT["event_type"]: {"name": "Session End"},
        }
        ok2, reason2 = self.intake.is_eligible_exchange_row(af_end, None)
        self.assertFalse(ok2)
        self.assertIn("Session End", reason2)

    def test_boundary_manifest_forbids_draft_truth_target(self) -> None:
        manifest = {
            "created_by_agent": self.cfg.ACTOR_HYPERAGENT,
            "action_class": self.cfg.ACTION_CLASS,
            "stage": self.cfg.V1_STAGE,
            "table_id": self.cfg.DRAFT_TRUTH_TABLE,
        }
        errs = self.intake.validate_manifest(manifest)
        self.assertTrue(any("Draft" in e for e in errs))

    def test_boundary_export_display_no_ambient_word(self) -> None:
        if not EXPORT_PATH.is_file():
            self.skipTest("export not built yet")
        export = json.loads(EXPORT_PATH.read_text(encoding="utf-8"))
        name = export["data"]["name"].lower()
        self.assertNotIn("ambient", name)

    def test_boundary_skill_credential_sealed_v1_label(self) -> None:
        if not EXPORT_PATH.is_file():
            self.skipTest("export not built yet")
        export = json.loads(EXPORT_PATH.read_text(encoding="utf-8"))
        raw_schema = export["data"]["skills"][0]["credentialSchema"]
        self.assertIsInstance(raw_schema, str)
        schema = json.loads(raw_schema)
        names = [e["name"] for e in schema]
        self.assertIn("AMBIENT_V1_CREATE", names)
        self.assertIn("HOUSEHOLD_ACTIVITY_READ", names)
        ambient_names = [n for n in names if "ambient" in n.lower()]
        self.assertEqual(ambient_names, ["AMBIENT_V1_CREATE", "AMBIENT_CHECKPOINT_APPEND"])

    def test_boundary_legacy_stream_guard(self) -> None:
        self.intake.assert_legacy_stream_untouched()
        self.assertFalse(
            any("ambient" in k for k in (self.cfg.STREAM_KEY, self.cfg.ACTOR_HYPERAGENT))
        )


class BuildArtifactTests(unittest.TestCase):
    def test_source_files_exist(self) -> None:
        for name in (
            "household_activity_config.py",
            "household_activity_read.py",
            "household_activity_intake.py",
        ):
            self.assertTrue((SOURCE_DIR / name).is_file(), name)

    def test_build_pack_exists_after_build(self) -> None:
        if not BUILD_PACK.is_file():
            self.skipTest("run build generator")
        text = BUILD_PACK.read_text(encoding="utf-8")
        self.assertIn("clive-man-activity-intake-hyperagent", text)
        self.assertNotIn("ambient capture", text.lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
