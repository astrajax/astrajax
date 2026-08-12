#!/usr/bin/env python3
"""Mocked behavioral tests for Ambient checkpoint append (tblRbjD0PHtuTWsIL)."""

from __future__ import annotations

import hashlib
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO = Path(__file__).resolve().parents[1]
AMBIENT_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "ambient"

sys.path.insert(0, str(AMBIENT_DIR))


def _bootstrap_fields() -> dict:
    from ambient_config import CP, CP_BACKLOG, CP_EVENT_TYPE, CP_STREAM_STATE, DEFAULT_STREAM_KEY

    return {
        CP["checkpoint_event_id"]: "acp-genesis-hyperagent-ambient-v1",
        CP["stream_key"]: DEFAULT_STREAM_KEY,
        CP["revision"]: 0,
        CP["event_type"]: CP_EVENT_TYPE["bootstrap"],
        CP["stream_state"]: CP_STREAM_STATE["active"],
        CP["previous_event_id"]: "",
        CP["backlog_measurement"]: CP_BACKLOG["unknown"],
        CP["backlog_lower_bound"]: 0,
        CP["disposition_unit_count"]: 0,
        CP["run_id"]: "ruth-build-bootstrap",
    }


class CheckpointMockStore:
    """In-memory Airtable mock for checkpoint + amendment version tables."""

    def __init__(self) -> None:
        self.checkpoint: dict[str, dict] = {
            "recHsDmDx00c636BP": {"id": "recHsDmDx00c636BP", "fields": _bootstrap_fields()}
        }
        self.amendments: dict[str, dict] = {}
        self.post_log: list[tuple[str, str]] = []

    def handle(self, req) -> MagicMock:
        from ambient_config import CHECKPOINT_TABLE, TABLE_ID

        url = req.full_url if hasattr(req, "full_url") else str(req)
        method = req.method
        # https://api.airtable.com/v0/appXXX/tblYYY/...
        path = url.split("/v0/", 1)[-1] if "/v0/" in url else url
        segments = [s for s in path.split("?")[0].split("/") if s]
        table = segments[1] if len(segments) >= 2 else ""
        record_id = segments[2] if len(segments) >= 3 else None

        if method == "POST":
            body = json.loads(req.data.decode())
            self.post_log.append((method, table))
            recs = []
            for i, rec in enumerate(body.get("records") or []):
                rid = f"recNEW{len(self.checkpoint) + len(self.amendments) + i}"
                if table == CHECKPOINT_TABLE:
                    self.checkpoint[rid] = {"id": rid, "fields": dict(rec["fields"])}
                    recs.append(self.checkpoint[rid])
                elif table == TABLE_ID:
                    self.amendments[rid] = {"id": rid, "fields": dict(rec["fields"])}
                    recs.append(self.amendments[rid])
            payload = json.dumps({"records": recs}).encode()
        elif method == "GET":
            if table == CHECKPOINT_TABLE and record_id:
                payload = json.dumps(self.checkpoint[record_id]).encode()
            elif table == CHECKPOINT_TABLE:
                rows = list(self.checkpoint.values())
                payload = json.dumps({"records": rows, "offset": None}).encode()
            elif table == TABLE_ID:
                rows = list(self.amendments.values())
                payload = json.dumps({"records": rows, "offset": None}).encode()
            else:
                payload = b"{}"
        else:
            raise AssertionError(f"forbidden method {method}")

        resp = MagicMock()
        resp.read.return_value = payload
        resp.__enter__ = lambda s: resp
        resp.__exit__ = MagicMock(return_value=False)
        return resp


class CheckpointAppendTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        import ambient_v1_intake as amb  # noqa: E402

        cls.amb = amb
        cls.store = CheckpointMockStore()

    def setUp(self) -> None:
        self.store = CheckpointMockStore()

    def _env(self) -> dict:
        return {
            "AMBIENT_V1_CREATE": "pat-v1",
            "AMBIENT_CHECKPOINT_APPEND": "pat-cp",
            "AMBIENT_INITIAL_SCAN_BOUNDARY_UTC": "2026-08-01T00:00:00.000Z",
            "AMBIENT_SOURCE_ORDER_VERIFIED": "true",
            "AMBIENT_THREAD_ORDER_FIELDS": "createdAt,threadId",
        }

    def _observation_semantic(self, tip_sem: dict, *, revision: int | None = None) -> dict:
        rev = (revision if revision is not None else tip_sem["revision"] + 1)
        return {
            "stream_key": tip_sem["stream_key"],
            "revision": rev,
            "event_type": "observation",
            "stream_state": tip_sem.get("stream_state") or "active",
            "previous_event_id": tip_sem["checkpoint_event_id"],
            "cursor_utc": tip_sem.get("cursor_utc") or "",
            "cursor_token_json": "{}",
            "backlog_lower_bound": 3,
            "backlog_measurement": "lower_bound",
            "disposition_unit_count": 1,
            "disposition_manifest_hash": "abc",
            "run_id": "run-test",
        }

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_bootstrap_tip_read(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        self.assertEqual(tip["tip_revision"], 0)
        self.assertEqual(tip["tip_event_id"], "acp-genesis-hyperagent-ambient-v1")

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_exact_append_and_readback(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        sem = self._observation_semantic(tip["tip_semantic"])
        out = self.amb.append_checkpoint_event(sem, dry_run=False)
        self.assertTrue(out.get("appended"))
        self.assertEqual(out["revision"], 1)
        self.assertTrue(out["checkpoint_event_id"].startswith("acp-"))

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_exact_replay_skips(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        sem = self._observation_semantic(tip["tip_semantic"])
        first = self.amb.append_checkpoint_event(sem, dry_run=False)
        sem_retry = dict(sem)
        sem_retry["checkpoint_event_id"] = first["checkpoint_event_id"]
        sem_retry["revision"] = first["revision"]
        second = self.amb.append_checkpoint_event(sem_retry, dry_run=False)
        self.assertTrue(second.get("skipped"))
        self.assertEqual(first["checkpoint_event_id"], second["checkpoint_event_id"])

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_fork_refused(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        rows = list(self.store.checkpoint.values())
        from ambient_config import CP

        # Two successors from bootstrap — chain validator must refuse
        fork_fields = self.amb.semantic_to_airtable_fields(
            {
                "checkpoint_event_id": "acp-fork-a",
                "stream_key": rows[0]["fields"][CP["stream_key"]],
                "revision": 1,
                "event_type": "observation",
                "stream_state": "active",
                "previous_event_id": "acp-genesis-hyperagent-ambient-v1",
                "backlog_measurement": "unknown",
                "run_id": "r",
            }
        )
        fork2_fields = dict(fork_fields)
        fork2_fields[CP["checkpoint_event_id"]] = "acp-fork-b"
        rows = rows + [
            {"id": "recF1", "fields": fork_fields},
            {"id": "recF2", "fields": fork2_fields},
        ]
        with self.assertRaises(self.amb.CheckpointRefused):
            self.amb.validate_chain_rows(rows)

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_duplicate_revision_in_store_refused(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        sem = self._observation_semantic(tip["tip_semantic"])
        self.amb.append_checkpoint_event(sem, dry_run=False)
        # Inject duplicate revision directly
        dup_fields = self.amb.semantic_to_airtable_fields(
            {**sem, "revision": 1, "checkpoint_event_id": "acp-dup-rev"}
        )
        self.store.checkpoint["recDUP"] = {"id": "recDUP", "fields": dup_fields}
        with self.assertRaises(self.amb.CheckpointRefused):
            self.amb.read_stream_tip(dry_run=False)

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_previous_event_regression_refused(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        sem = self._observation_semantic(tip["tip_semantic"])
        sem["previous_event_id"] = "acp-wrong-predecessor"
        with self.assertRaises(self.amb.CheckpointRefused):
            self.amb.append_checkpoint_event(sem, dry_run=False)

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    def test_partial_intake_yields_observation_cursor_unchanged(self) -> None:
        tip_sem = {
            "checkpoint_event_id": "acp-genesis-hyperagent-ambient-v1",
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 0,
            "stream_state": "active",
            "cursor_utc": "2026-08-01T00:00:00.000Z",
        }
        intake = {
            "written_count": 2,
            "written": [{"dedupe_key": "a"}, {"dedupe_key": "b"}],
            "skipped": [],
            "requeued_count": 1,
            "remaining": 4,
            "stop_reason": "budget_stop",
            "complete": False,
            "checkpoint_through_index": 2,
        }
        sem = self.amb.derive_checkpoint_from_intake(intake, run_id="r", tip_semantic=tip_sem)
        self.assertEqual(sem["event_type"], "observation")
        self.assertEqual(sem["cursor_utc"], tip_sem["cursor_utc"])
        self.assertIn(sem["backlog_measurement"], ("lower_bound", "unknown"))
        self.assertNotEqual(sem["backlog_measurement"], "exact")

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    def test_full_advance_requires_activation_gates(self) -> None:
        tip_sem = {
            "checkpoint_event_id": "acp-genesis-hyperagent-ambient-v1",
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 0,
            "stream_state": "active",
            "cursor_utc": "2026-08-01T00:00:00.000Z",
        }
        intake = {
            "written_count": 1,
            "written": [{"dedupe_key": "a"}],
            "skipped": [],
            "requeued_count": 0,
            "remaining": 0,
            "complete": True,
            "checkpoint_through_index": 1,
        }
        with patch.dict(os.environ, {}, clear=True):
            sem = self.amb.derive_checkpoint_from_intake(intake, run_id="r", tip_semantic=tip_sem)
            self.assertEqual(sem["event_type"], "held")

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    def test_full_advance_with_gates(self) -> None:
        tip_sem = {
            "checkpoint_event_id": "acp-genesis-hyperagent-ambient-v1",
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 0,
            "stream_state": "active",
            "cursor_utc": "2026-08-01T00:00:00.000Z",
        }
        intake = {
            "written_count": 1,
            "written": [{"dedupe_key": "a"}],
            "skipped": [],
            "requeued_count": 0,
            "remaining": 0,
            "complete": True,
            "checkpoint_through_index": 1,
        }
        with patch.dict(os.environ, self._env(), clear=False):
            sem = self.amb.derive_checkpoint_from_intake(
                intake,
                run_id="r",
                tip_semantic=tip_sem,
                new_cursor_utc="2026-08-02T00:00:00.000Z",
            )
            self.assertEqual(sem["event_type"], "advance")
            self.assertEqual(sem["cursor_utc"], "2026-08-02T00:00:00.000Z")
            self.assertEqual(sem["backlog_measurement"], "exact")

    def test_missing_initial_boundary_blocks_advance(self) -> None:
        sem = {
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 1,
            "event_type": "advance",
            "stream_state": "active",
            "previous_event_id": "acp-genesis-hyperagent-ambient-v1",
            "backlog_measurement": "exact",
            "backlog_lower_bound": 0,
            "run_id": "r",
        }
        with patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat"}, clear=True):
            with self.assertRaises(self.amb.CheckpointRefused):
                self.amb.append_checkpoint_event(sem, dry_run=True)

    def test_missing_source_order_verification_blocks_advance(self) -> None:
        sem = {
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 1,
            "event_type": "advance",
            "stream_state": "active",
            "previous_event_id": "acp-genesis-hyperagent-ambient-v1",
            "backlog_measurement": "exact",
            "backlog_lower_bound": 0,
            "run_id": "r",
        }
        with patch.dict(
            os.environ,
            {
                "AMBIENT_CHECKPOINT_APPEND": "pat",
                "AMBIENT_INITIAL_SCAN_BOUNDARY_UTC": "2026-08-01T00:00:00.000Z",
            },
            clear=True,
        ):
            with self.assertRaises(self.amb.CheckpointRefused):
                self.amb.append_checkpoint_event(sem, dry_run=True)

    def test_forbidden_patch_refused(self) -> None:
        from ambient_config import CHECKPOINT_TABLE, CRED_ROLE_CHECKPOINT_APPEND

        with patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat"}, clear=False):
            with self.assertRaises(self.amb.IntakeError) as ctx:
                self.amb._airtable_request(
                    "PATCH",
                    f"/appL2fdnGmhA02WXd/{CHECKPOINT_TABLE}/recX",
                    credential_role=CRED_ROLE_CHECKPOINT_APPEND,
                )
            self.assertNotIn("pat", str(ctx.exception))

    def test_forbidden_draft_table_post_refused(self) -> None:
        from ambient_config import CRED_ROLE_CHECKPOINT_APPEND, FORBIDDEN_TABLE

        with patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat"}, clear=False):
            with self.assertRaises(self.amb.IntakeError) as ctx:
                self.amb._airtable_request(
                    "POST",
                    f"/appL2fdnGmhA02WXd/{FORBIDDEN_TABLE}",
                    credential_role=CRED_ROLE_CHECKPOINT_APPEND,
                    body={"records": []},
                )
            self.assertNotIn("pat", str(ctx.exception))

    def test_v1_role_cannot_post_checkpoint_table(self) -> None:
        from ambient_config import CHECKPOINT_TABLE, CRED_ROLE_V1_CREATE

        shared = "pat-shared-dummy-token-xyz"
        with patch.dict(
            os.environ,
            {"AMBIENT_V1_CREATE": shared, "AMBIENT_CHECKPOINT_APPEND": shared},
            clear=False,
        ):
            with self.assertRaises(self.amb.IntakeError) as ctx:
                self.amb._airtable_request(
                    "POST",
                    f"/appL2fdnGmhA02WXd/{CHECKPOINT_TABLE}",
                    credential_role=CRED_ROLE_V1_CREATE,
                    body={"records": [{"fields": {}}]},
                )
            err = str(ctx.exception)
            self.assertIn("may not POST", err)
            self.assertNotIn(shared, err)

    def test_checkpoint_role_cannot_post_amendment_versions(self) -> None:
        from ambient_config import CRED_ROLE_CHECKPOINT_APPEND, TABLE_ID

        shared = "pat-shared-dummy-token-xyz"
        with patch.dict(
            os.environ,
            {"AMBIENT_V1_CREATE": shared, "AMBIENT_CHECKPOINT_APPEND": shared},
            clear=False,
        ):
            with self.assertRaises(self.amb.IntakeError) as ctx:
                self.amb._airtable_request(
                    "POST",
                    f"/appL2fdnGmhA02WXd/{TABLE_ID}",
                    credential_role=CRED_ROLE_CHECKPOINT_APPEND,
                    body={"records": [{"fields": {}}]},
                )
            err = str(ctx.exception)
            self.assertIn("may not POST", err)
            self.assertNotIn(shared, err)

    def test_v1_role_cannot_get_checkpoint_table(self) -> None:
        from ambient_config import CHECKPOINT_TABLE, CRED_ROLE_V1_CREATE

        shared = "pat-shared-dummy-token-xyz"
        with patch.dict(
            os.environ,
            {"AMBIENT_V1_CREATE": shared, "AMBIENT_CHECKPOINT_APPEND": shared},
            clear=False,
        ):
            with self.assertRaises(self.amb.IntakeError) as ctx:
                self.amb._airtable_request(
                    "GET",
                    f"/appL2fdnGmhA02WXd/{CHECKPOINT_TABLE}",
                    credential_role=CRED_ROLE_V1_CREATE,
                )
            self.assertNotIn(shared, str(ctx.exception))

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat-v1", "AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_v1_create_post_passes_role_gate(self, mock_urlopen: MagicMock) -> None:
        from ambient_config import AV, TABLE_ID

        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        fields = {
            AV["dedupe_key"]: "dk-test",
            AV["amendment_version_id"]: "cav-ambient-test-v1",
            AV["run_id"]: "run-test",
        }
        out = self.amb.create_batch([fields], dry_run=False)
        self.assertEqual(len(out.get("records") or []), 1)
        self.assertEqual(self.store.post_log[-1], ("POST", TABLE_ID))

    @patch.dict(os.environ, {"AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_checkpoint_post_passes_role_gate(self, mock_urlopen: MagicMock) -> None:
        from ambient_config import CHECKPOINT_TABLE

        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        tip = self.amb.read_stream_tip(dry_run=False)
        sem = self._observation_semantic(tip["tip_semantic"])
        self.amb.append_checkpoint_event(sem, dry_run=False)
        self.assertEqual(self.store.post_log[-1], ("POST", CHECKPOINT_TABLE))

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat-v1", "AMBIENT_CHECKPOINT_APPEND": "pat-cp"}, clear=False)
    @patch("urllib.request.urlopen")
    def test_v1_disposition_mismatch_forces_observation(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = lambda *a, **k: self.store.handle(a[0])
        intake = {
            "written_count": 1,
            "written": [{"dedupe_key": "missing-key"}],
            "skipped": [],
            "requeued_count": 0,
            "remaining": 0,
            "complete": True,
            "checkpoint_through_index": 1,
            "v1_report_record_id": "recReport",
        }
        with patch.dict(os.environ, self._env(), clear=False):
            out = self.amb.append_checkpoint_after_intake(intake, run_id="run-x", dry_run=False)
        self.assertIn(out.get("event_type"), ("observation", "held"))

    def test_event_id_deterministic(self) -> None:
        sem = {
            "stream_key": "hyperagent:eligible-threads:clive-man-ambient-capture:v1",
            "revision": 1,
            "event_type": "observation",
            "stream_state": "active",
            "previous_event_id": "acp-genesis-hyperagent-ambient-v1",
            "cursor_utc": "",
            "cursor_token_json": "{}",
            "backlog_lower_bound": 0,
            "backlog_measurement": "unknown",
            "disposition_unit_count": 0,
            "disposition_manifest_hash": "",
            "run_id": "r",
        }
        a = self.amb.compute_event_id(sem)
        b = self.amb.compute_event_id(sem)
        self.assertEqual(a, b)
        self.assertTrue(a.startswith("acp-"))
        self.assertEqual(len(a), 4 + 64)

    def test_no_credential_leakage_in_schema_constants(self) -> None:
        from ambient_config import CHECKPOINT_APPEND_CRED_ENV, CRED_ENV

        text = Path(AMBIENT_DIR / "ambient_config.py").read_text(encoding="utf-8")
        self.assertNotRegex(text, r"pat[A-Za-z0-9]{10,}")
        self.assertIn(CRED_ENV, text)
        self.assertIn(CHECKPOINT_APPEND_CRED_ENV, text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
