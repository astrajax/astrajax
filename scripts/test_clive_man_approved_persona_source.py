#!/usr/bin/env python3
"""Negative and positive tests for MCP-approved Persona snapshot path."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
BUILDS = REPO / "hyperagent" / "builds"
sys.path.insert(0, str(BUILDS))
sys.path.insert(0, str(REPO / "scripts"))

from _clive_man_approved_persona_source import (  # noqa: E402
    APPROVED_SOURCE_NOTE,
    load_approved_source_json,
    validate_approved_source_payload,
)
from _clive_man_persona_gate import load_approved_source_file  # noqa: E402
from _clive_man_v0_4_contract import PERSONA_V04_RECORD_ID  # noqa: E402

APPROVED_JSON = (
    REPO / "agents/registry/cursor/clive/clive-man/persona-config.approved-v0.4.json"
)
FIXTURE_JSON = BUILDS / "fixtures" / "persona_operational_v0_4_approved.json"


class ApprovedSourcePositiveTest(unittest.TestCase):
    def test_committed_mirror_loads_and_hash_matches(self) -> None:
        payload = load_approved_source_json(APPROVED_JSON)
        self.assertEqual(payload["source"], APPROVED_SOURCE_NOTE)
        self.assertEqual(payload["record_id"], PERSONA_V04_RECORD_ID)
        self.assertEqual(payload["status"], "Approved")
        persona = load_approved_source_file(APPROVED_JSON)
        self.assertEqual(persona.content_sha256, payload["content_sha256"])
        self.assertEqual(persona.source, APPROVED_SOURCE_NOTE)

    def test_generated_persona_carries_bundle_sha(self) -> None:
        gen = (REPO / "agents/registry/cursor/clive/clive-man/persona-config.generated.md").read_text(
            encoding="utf-8"
        )
        payload = load_approved_source_json(APPROVED_JSON)
        self.assertIn(payload["content_sha256"], gen)
        self.assertIn("airtable-mcp-approved-snapshot", gen)
        self.assertNotIn("TEST FIXTURE", gen)

    def test_production_head_export_carries_approved_sha_not_fixture(self) -> None:
        export = json.loads(
            (REPO / "hyperagent/exports/agents/agent-clive-man-v0_4.json").read_text(encoding="utf-8")
        )
        data = export["data"]
        payload = load_approved_source_json(APPROVED_JSON)
        self.assertEqual(data["personaConfigSha256"], payload["content_sha256"])
        self.assertEqual(data["personaSource"], APPROVED_SOURCE_NOTE)
        self.assertNotIn("TEST FIXTURE", data["systemPrompt"])
        self.assertIn("context steward", data["systemPrompt"])


class ApprovedSourceNegativeTest(unittest.TestCase):
    def _write_temp(self, payload: dict) -> Path:
        tmp = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
        json.dump(payload, tmp)
        tmp.close()
        self.addCleanup(lambda: Path(tmp.name).unlink(missing_ok=True))
        return Path(tmp.name)

    def test_rejects_fixture_note_payload(self) -> None:
        payload = json.loads(FIXTURE_JSON.read_text(encoding="utf-8"))
        path = self._write_temp(payload)
        with self.assertRaises(SystemExit) as ctx:
            load_approved_source_json(path)
        self.assertIn("airtable-mcp-approved-snapshot", str(ctx.exception))

    def test_rejects_pending_status(self) -> None:
        base = json.loads(APPROVED_JSON.read_text(encoding="utf-8"))
        base["status"] = "Pending"
        path = self._write_temp(base)
        with self.assertRaises(SystemExit) as ctx:
            load_approved_source_json(path)
        self.assertIn("Approved", str(ctx.exception))

    def test_rejects_hash_mismatch(self) -> None:
        base = json.loads(APPROVED_JSON.read_text(encoding="utf-8"))
        base["content_sha256"] = "0" * 64
        path = self._write_temp(base)
        with self.assertRaises(SystemExit) as ctx:
            load_approved_source_json(path)
        self.assertIn("content_sha256 mismatch", str(ctx.exception))

    def test_rejects_wrong_record_id(self) -> None:
        base = json.loads(APPROVED_JSON.read_text(encoding="utf-8"))
        base["record_id"] = "recWRONG00000000"
        path = self._write_temp(base)
        with self.assertRaises(SystemExit) as ctx:
            validate_approved_source_payload(base, path=path)
        self.assertIn("record_id mismatch", str(ctx.exception))


class GenerateSyncApprovedPathTest(unittest.TestCase):
    def test_generate_from_approved_source_without_token(self) -> None:
        import generate_persona_config_sync as sync  # noqa: E402

        with patch.dict("os.environ", {}, clear=True):
            with patch.object(sync, "_token", side_effect=SystemExit("no token")):
                out = sync.generate(
                    "clive-man",
                    approved_source_file=APPROVED_JSON,
                )
        text = out.read_text(encoding="utf-8")
        payload = load_approved_source_json(APPROVED_JSON)
        self.assertIn(payload["content_sha256"], text)
        self.assertIn("Operational v0.4", text)


if __name__ == "__main__":
    unittest.main()
