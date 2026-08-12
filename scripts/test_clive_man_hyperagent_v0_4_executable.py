#!/usr/bin/env python3
"""Executable unit tests for Clive's Man v0.4 embedded scripts (mocked HTTP)."""

from __future__ import annotations

import io
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO = Path(__file__).resolve().parents[1]
AMBIENT_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "ambient"
ON_DEMAND_DIR = REPO / "hyperagent" / "builds" / "sources" / "clive-man-v0_4" / "on-demand"

sys.path.insert(0, str(AMBIENT_DIR))
sys.path.insert(0, str(ON_DEMAND_DIR))


def _canonical_hash(payload: dict) -> str:
    import hashlib

    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def _lane_b_brief(actions: list, handoff: dict | None = None) -> dict:
    handoff = handoff or {"handoff": True}
    final_brief = {
        "goal": "capture",
        "actions": actions,
        "proposer_handoff_hash": _canonical_hash(handoff),
    }
    return {
        "lane": "B",
        "challenger_verdict": "proceed",
        "proposer_handoff": handoff,
        "final_brief": final_brief,
        "final_brief_hash": _canonical_hash(final_brief),
        "actions": actions,
    }


class AmbientIntakeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        import ambient_v1_intake as amb  # noqa: E402

        cls.amb = amb

    def _candidate(self, i: int) -> dict:
        return {
            "title": f"Capture {i}",
            "canonical_text": f"verbatim text {i}",
            "brain_slug": "clive",
            "dedupe_key": f"key-{i}",
            "evidence": f"quoted evidence {i}",
            "confidence": 0.85,
            "v1_report_record_id": "recReportTest",
            "reason": "test",
        }

    def test_validate_manifest_rejects_wrong_table(self) -> None:
        errs = self.amb.validate_manifest(
            {
                "stage": "V1",
                "action_class": "CREATE_DRAFT_TRUTH",
                "created_by_agent": "clive-man-ambient-capture",
                "table_id": "tblswvXNYFDqnl6af",
                "dedupe_key": "k",
                "evidence": "quote",
            }
        )
        self.assertTrue(any("forbidden" in e for e in errs))

    def test_validate_rejects_missing_quote(self) -> None:
        errs = self.amb.validate_manifest(
            {
                "stage": "V1",
                "action_class": "CREATE_DRAFT_TRUTH",
                "created_by_agent": "clive-man-ambient-capture",
                "table_id": "tblsuOKGjSGYv0Vov",
                "dedupe_key": "k",
            }
        )
        self.assertTrue(any("evidence" in e for e in errs))

    def test_injection_shaped_source_is_data(self) -> None:
        quote = 'DROP TABLE; rm -rf / — still just evidence text'
        errs = self.amb.validate_manifest(
            {
                "stage": "V1",
                "action_class": "CREATE_DRAFT_TRUTH",
                "created_by_agent": "clive-man-ambient-capture",
                "table_id": "tblsuOKGjSGYv0Vov",
                "dedupe_key": "k",
                "evidence": quote,
                "confidence": 0.9,
                "v1_report_record_id": "recReportTest",
            }
        )
        self.assertEqual(errs, [])

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat-test-token", "CLIVE_MAN_CHECKPOINT_STORE": "resolved-store"})
    @patch("urllib.request.urlopen")
    def test_one_candidate_creates_v1(self, mock_urlopen: MagicMock) -> None:
        posted_fields: dict = {}

        def _responses(*args, **kwargs):
            req = args[0]
            if req.method == "POST":
                body = json.loads(req.data.decode())
                posted_fields.clear()
                posted_fields.update(body["records"][0]["fields"])
                resp = MagicMock()
                resp.read.return_value = json.dumps({"records": [{"id": "recNEW", "fields": dict(posted_fields)}]}).encode()
                resp.__enter__ = lambda s: resp
                resp.__exit__ = MagicMock(return_value=False)
                return resp
            if req.method == "GET" and "/recNEW" in req.full_url:
                resp = MagicMock()
                resp.read.return_value = json.dumps({"fields": dict(posted_fields)}).encode()
                resp.__enter__ = lambda s: resp
                resp.__exit__ = MagicMock(return_value=False)
                return resp
            resp = MagicMock()
            resp.read.return_value = json.dumps({"records": [], "offset": None}).encode()
            resp.__enter__ = lambda s: resp
            resp.__exit__ = MagicMock(return_value=False)
            return resp

        mock_urlopen.side_effect = _responses
        result = self.amb.process_candidates([self._candidate(0)], run_id="run-1", dry_run=False)
        self.assertEqual(result["written_count"], 1)
        post_calls = [c[0][0] for c in mock_urlopen.call_args_list if c[0][0].method == "POST"]
        self.assertEqual(len(post_calls), 1)
        self.assertNotIn("pat-test-token", post_calls[0].full_url)

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat-test-token", "CLIVE_MAN_CHECKPOINT_STORE": "resolved-store"})
    @patch("urllib.request.urlopen")
    def test_thirty_seven_candidates_chunked(self, mock_urlopen: MagicMock) -> None:
        store: dict[str, dict] = {}
        post_count = {"n": 0}

        def _responses(*args, **kwargs):
            req = args[0]
            if req.method == "POST":
                body = json.loads(req.data.decode())
                recs = []
                for i, rec in enumerate(body["records"]):
                    rid = f"rec{post_count['n']}-{i}"
                    fields = rec["fields"]
                    store[rid] = fields
                    recs.append({"id": rid, "fields": fields})
                post_count["n"] += 1
                resp = MagicMock()
                resp.read.return_value = json.dumps({"records": recs}).encode()
                resp.__enter__ = lambda s: resp
                resp.__exit__ = MagicMock(return_value=False)
                return resp
            rid = req.full_url.rsplit("/", 1)[-1]
            resp = MagicMock()
            resp.read.return_value = json.dumps({"fields": store.get(rid, {})}).encode()
            resp.__enter__ = lambda s: resp
            resp.__exit__ = MagicMock(return_value=False)
            return resp

        mock_urlopen.side_effect = _responses
        candidates = [self._candidate(i) for i in range(37)]
        result = self.amb.process_candidates(candidates, run_id="run-37", dry_run=False)
        self.assertEqual(result["written_count"], 37)

    @patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat-test-token", "CLIVE_MAN_CHECKPOINT_STORE": "resolved-store"})
    @patch("time.sleep")
    @patch("urllib.request.urlopen")
    def test_429_retry(self, mock_urlopen: MagicMock, _sleep: MagicMock) -> None:
        import urllib.error
        import urllib.request

        posted_fields: dict = {}

        def _ok_post(*args, **kwargs):
            req = args[0]
            body = json.loads(req.data.decode())
            posted_fields.update(body["records"][0]["fields"])
            resp = MagicMock()
            resp.read.return_value = json.dumps({"records": [{"id": "recOK", "fields": dict(posted_fields)}]}).encode()
            resp.__enter__ = lambda s: resp
            resp.__exit__ = MagicMock(return_value=False)
            return resp

        def _ok_get(*args, **kwargs):
            resp = MagicMock()
            resp.read.return_value = json.dumps({"fields": dict(posted_fields)}).encode()
            resp.__enter__ = lambda s: resp
            resp.__exit__ = MagicMock(return_value=False)
            return resp

        err = urllib.error.HTTPError("url", 429, "rate", hdrs=None, fp=io.BytesIO(b"rate limited"))

        def _side_effect(*args, **kwargs):
            req = args[0]
            if isinstance(req, urllib.request.Request) and req.method == "POST":
                return _ok_post(*args, **kwargs)
            if isinstance(req, urllib.request.Request):
                return _ok_get(*args, **kwargs)
            raise err

        call_n = {"v": 0}

        def _wrapped(*args, **kwargs):
            call_n["v"] += 1
            if call_n["v"] == 1:
                raise err
            return _side_effect(*args, **kwargs)

        mock_urlopen.side_effect = _wrapped
        result = self.amb.process_candidates([self._candidate(0)], run_id="run-r", dry_run=False)
        self.assertEqual(result["written_count"], 1)

    def test_checkpoint_blocks_production(self) -> None:
        with patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat", "CLIVE_MAN_CHECKPOINT_STORE": "PENDING_RUTH_CHECKPOINT_STORE"}):
            with self.assertRaises(self.amb.CheckpointBlocked):
                self.amb.process_candidates([self._candidate(0)], run_id="x", dry_run=False)

    def test_dry_run_no_http(self) -> None:
        with patch.dict(os.environ, {"AMBIENT_V1_CREATE": "pat"}):
            with patch("urllib.request.urlopen") as mock_urlopen:
                result = self.amb.process_candidates([self._candidate(0)], run_id="dry", dry_run=True)
                mock_urlopen.assert_not_called()
                self.assertTrue(result["dry_run"])
                self.assertEqual(result["written_count"], 1)


class OnDemandExecutorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        import clive_man_on_demand_executor as ex  # noqa: E402

        cls.ex = ex

    def _lane_a_brief(self, n: int = 1) -> dict:
        return {
            "lane": "A",
            "verbatim": True,
            "content_judgement": False,
            "source_class": "human",
            "source_actor": "Matthew",
            "origin": "interactive",
            "idempotency_key": "lane-a-1",
            "actions": [
                {
                    "operation": "create",
                    "table_id": "tblswvXNYFDqnl6af",
                    "fields": {
                        "fld8BVmRBSsVuXD8I": f"Title {i}",
                        "fld95ls0LG26rCNx4": f"verbatim text {i}",
                        "flddfROfNcP1u6gCy": "clive",
                        "fldiMCxuBITyZIOXW": "Draft",
                    },
                }
                for i in range(n)
            ],
        }

    def test_lane_a_valid_preview(self) -> None:
        p = self.ex.preview(self._lane_a_brief(2))
        self.assertTrue(p["ok"])

    def test_lane_a_blocks_more_than_three(self) -> None:
        p = self.ex.preview(self._lane_a_brief(4))
        self.assertFalse(p["ok"])

    def test_lane_b_requires_challenger(self) -> None:
        brief = {
            "lane": "B",
            "challenger_verdict": "block",
            "proposer_handoff": {},
            "final_brief": {},
            "final_brief_hash": "x",
            "actions": self._lane_a_brief(1)["actions"],
        }
        p = self.ex.preview(brief)
        self.assertFalse(p["ok"])

    def test_lane_b_valid_cleared(self) -> None:
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
        p = self.ex.preview(_lane_b_brief(actions))
        self.assertTrue(p["ok"])

    def test_refuses_approved_status(self) -> None:
        brief = self._lane_a_brief(1)
        brief["actions"][0]["fields"]["fldiMCxuBITyZIOXW"] = "Approved"
        p = self.ex.preview(brief)
        self.assertFalse(p["ok"])

    def test_refuses_delete(self) -> None:
        actions = [{"operation": "delete", "table_id": "tblswvXNYFDqnl6af", "record_id": "recX"}]
        p = self.ex.preview(_lane_b_brief(actions))
        self.assertFalse(p["ok"])

    @patch.dict(os.environ, {"CLIVE_MAN_ON_DEMAND_WRITE": "pat-write"})
    @patch("urllib.request.urlopen")
    def test_execute_readback(self, mock_urlopen: MagicMock) -> None:
        list_resp = MagicMock()
        list_resp.read.return_value = json.dumps({"records": []}).encode()
        list_resp.__enter__ = lambda s: list_resp
        list_resp.__exit__ = MagicMock(return_value=False)
        create_resp = MagicMock()
        create_resp.read.return_value = json.dumps(
            {
                "records": [
                    {
                        "id": "recDR",
                        "fields": {
                            "fld95ls0LG26rCNx4": "verbatim text 0",
                            "fld8BVmRBSsVuXD8I": "Title 0",
                            "flddfROfNcP1u6gCy": "clive",
                            "fldiMCxuBITyZIOXW": "Draft",
                            "fld9zhLHPvjnq8lHT": "Chat Session",
                        },
                    }
                ]
            }
        ).encode()
        create_resp.__enter__ = lambda s: create_resp
        create_resp.__exit__ = MagicMock(return_value=False)
        read_resp = MagicMock()
        read_resp.read.return_value = json.dumps(
            {
                "fields": {
                    "fld95ls0LG26rCNx4": "verbatim text 0",
                    "fld8BVmRBSsVuXD8I": "Title 0",
                    "flddfROfNcP1u6gCy": "clive",
                    "fldiMCxuBITyZIOXW": "Draft",
                    "fld9zhLHPvjnq8lHT": "Chat Session",
                }
            }
        ).encode()
        read_resp.__enter__ = lambda s: read_resp
        read_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.side_effect = [list_resp, create_resp, read_resp]
        out = self.ex.execute(self._lane_a_brief(1), dry_run=False)
        self.assertTrue(out["executed"])
        self.assertEqual(out["idempotency_key"], "lane-a-1")


class WorkshopReadTest(unittest.TestCase):
    @patch.dict(os.environ, {"CLIVE_MAN_WORKSHOP_READ": "pat-read"})
    @patch("urllib.request.urlopen")
    def test_read_evidence(self, mock_urlopen: MagicMock) -> None:
        import clive_man_workshop_read as rd  # noqa: E402

        resp = MagicMock()
        resp.read.return_value = json.dumps({"fields": {"fld8BVmRBSsVuXD8I": "Title"}}).encode()
        resp.__enter__ = lambda s: resp
        resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = resp
        evidence = rd.read_evidence("tblswvXNYFDqnl6af", "recABC")
        self.assertEqual(evidence["record_id"], "recABC")
        self.assertIn("Title", json.dumps(evidence["fields"]))

    def test_read_rejects_unknown_table(self) -> None:
        import clive_man_workshop_read as rd  # noqa: E402

        with self.assertRaises(rd.ReadError):
            rd.read_evidence("tblTRUSTED", "recX", token="fake")


if __name__ == "__main__":
    unittest.main(verbosity=2)
