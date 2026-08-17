#!/usr/bin/env python3
"""Offline unit tests for Skills script Airtable PATCH batching (#155 / bb6cdc6)."""

from __future__ import annotations

import importlib.util
import io
import json
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "apply-skills-script-updates.py"


def _load():
    spec = importlib.util.spec_from_file_location("apply_skills_script_updates", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class PatchRecordsBatchingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_chunks_to_airtable_ten_record_limit(self) -> None:
        records = [{"id": f"rec{i}", "fields": {"Script": str(i)}} for i in range(23)]
        bodies: list[list[dict]] = []

        def fake_urlopen(req, timeout=120):  # noqa: ARG001
            payload = json.loads(req.data.decode("utf-8"))
            bodies.append(payload["records"])
            resp = MagicMock()
            resp.__enter__.return_value = resp
            resp.__exit__.return_value = False
            resp.read.return_value = json.dumps(
                {"records": payload["records"]}
            ).encode("utf-8")
            # json.load(resp) reads via resp; provide a file-like
            resp_io = io.BytesIO(json.dumps({"records": payload["records"]}).encode())
            return MagicMock(
                __enter__=MagicMock(return_value=resp_io),
                __exit__=MagicMock(return_value=False),
            )

        with (
            patch.object(self.m.urllib.request, "urlopen", side_effect=fake_urlopen),
            patch.object(self.m.time, "sleep") as sleep,
        ):
            out = self.m.patch_records("appX", "tblY", records, "patToken")

        self.assertEqual([len(b) for b in bodies], [10, 10, 3])
        self.assertEqual(len(out["records"]), 23)
        # Spacing sleep between chunks only (not after the last).
        self.assertEqual(sleep.call_count, 2)
        sleep.assert_called_with(0.25)

    def test_single_batch_under_limit_no_spacing_sleep(self) -> None:
        records = [{"id": "rec1", "fields": {}}]

        def fake_urlopen(req, timeout=120):  # noqa: ARG001
            payload = json.loads(req.data.decode("utf-8"))
            resp_io = io.BytesIO(json.dumps({"records": payload["records"]}).encode())
            return MagicMock(
                __enter__=MagicMock(return_value=resp_io),
                __exit__=MagicMock(return_value=False),
            )

        with (
            patch.object(self.m.urllib.request, "urlopen", side_effect=fake_urlopen),
            patch.object(self.m.time, "sleep") as sleep,
        ):
            out = self.m.patch_records("appX", "tblY", records, "patToken")

        self.assertEqual(len(out["records"]), 1)
        sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
