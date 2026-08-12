#!/usr/bin/env python3
"""Offline unit tests for Approved Persona Config resolution and v0.4 gate."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import generate_persona_config_sync as sync  # noqa: E402


CFG = {
    "base": "appTest",
    "table": "tblPC",
    "fields": {
        "name": "fldName",
        "prompt": "fldPrompt",
        "rules": "fldRules",
        "output": "fldOutput",
        "status": "fldStatus",
    },
    "expected_version": "Operational v0.4",
    "expected_record_id": "recSKTT8NTTJOmuRu",
}


def _record(record_id: str, name: str, status: str) -> dict:
    return {
        "id": record_id,
        "fields": {
            CFG["fields"]["name"]: name,
            CFG["fields"]["status"]: status,
            CFG["fields"]["prompt"]: f"prompt for {name}",
            CFG["fields"]["rules"]: "rules",
            CFG["fields"]["output"]: "output",
        },
    }


class ParseOperationalVersionTest(unittest.TestCase):
    def test_accepts_strict_operational_semver(self) -> None:
        self.assertEqual(sync._parse_operational_version("Operational v1.2"), (1, 2))
        self.assertEqual(sync._parse_operational_version("  Operational v0.9  "), (0, 9))

    def test_rejects_suffixes_and_non_operational_names(self) -> None:
        self.assertIsNone(
            sync._parse_operational_version("Operational v1.0 (HyperAgent sync)")
        )
        self.assertIsNone(sync._parse_operational_version("Proposal v2.0"))
        self.assertIsNone(sync._parse_operational_version("Operational v1.0.1"))


class ResolveApprovedRecordTest(unittest.TestCase):
    def test_picks_highest_approved_operational_semver(self) -> None:
        records = [
            _record("recOld", "Operational v1.0", "Approved"),
            _record("recSuffix", "Operational v2.0 (HyperAgent sync)", "Approved"),
            _record("recDraft", "Operational v3.0", "Draft"),
            _record("recNew", "Operational v2.0", "Approved"),
        ]
        with (
            patch.object(sync, "_list_records", return_value=records),
            patch.object(
                sync,
                "_fetch_record",
                side_effect=lambda cfg, record_id: next(
                    r for r in records if r["id"] == record_id
                ),
            ),
        ):
            chosen = sync._resolve_approved_record("clive-man", CFG)

        self.assertEqual(chosen["id"], "recNew")

    def test_fails_when_no_approved_strict_semver_exists(self) -> None:
        records = [
            _record("recSuffix", "Operational v1.0 (HyperAgent sync)", "Approved"),
            _record("recDraft", "Operational v2.0", "Draft"),
        ]
        with patch.object(sync, "_list_records", return_value=records):
            with self.assertRaises(SystemExit) as raised:
                sync._resolve_approved_record("clive-man", CFG)

        self.assertIn("No Approved Persona Config", str(raised.exception))

    def test_fails_loudly_on_duplicate_highest_version(self) -> None:
        records = [
            _record("recA", "Operational v1.1", "Approved"),
            _record("recB", "Operational v1.1", "Approved"),
        ]
        with patch.object(sync, "_list_records", return_value=records):
            with self.assertRaises(SystemExit) as raised:
                sync._resolve_approved_record("clive-man", CFG)

        message = str(raised.exception)
        self.assertIn("Ambiguous Approved Persona Config", message)
        self.assertIn("recA", message)
        self.assertIn("recB", message)

    def test_ignores_pending_proposal_with_similar_name(self) -> None:
        records = [
            _record("recV03", "Operational v0.3", "Approved"),
            _record("recV04", "Operational v0.4", "Pending"),
        ]
        with (
            patch.object(sync, "_list_records", return_value=records),
            patch.object(
                sync,
                "_fetch_record",
                side_effect=lambda cfg, record_id: next(
                    r for r in records if r["id"] == record_id
                ),
            ),
        ):
            chosen = sync._resolve_approved_record("clive-man", CFG)

        self.assertEqual(chosen["id"], "recV03")


class PinVersionResolutionTest(unittest.TestCase):
    def test_pin_version_fails_closed_when_pending(self) -> None:
        records = [_record("recSKTT8NTTJOmuRu", "Operational v0.4", "Pending")]
        with patch.object(sync, "_list_records", return_value=records):
            with self.assertRaises(SystemExit) as raised:
                sync._resolve_pinned_record("clive-man", CFG, "Operational v0.4")

        message = str(raised.exception)
        self.assertIn("FAIL CLOSED", message)
        self.assertIn("recSKTT8NTTJOmuRu", message)
        self.assertIn("Pending", message)

    def test_pin_version_requires_exact_record_id(self) -> None:
        records = [_record("recWRONG", "Operational v0.4", "Approved")]
        with patch.object(sync, "_list_records", return_value=records):
            with self.assertRaises(SystemExit) as raised:
                sync._resolve_pinned_record("clive-man", CFG, "Operational v0.4")

        self.assertIn("Record ID mismatch", str(raised.exception))

    def test_pin_version_succeeds_when_approved(self) -> None:
        records = [_record("recSKTT8NTTJOmuRu", "Operational v0.4", "Approved")]
        with (
            patch.object(sync, "_list_records", return_value=records),
            patch.object(
                sync,
                "_fetch_record",
                side_effect=lambda cfg, record_id: records[0],
            ),
        ):
            chosen = sync._resolve_pinned_record("clive-man", CFG, "Operational v0.4")

        self.assertEqual(chosen["id"], "recSKTT8NTTJOmuRu")


class RenderHashTest(unittest.TestCase):
    def test_render_includes_full_sha256_marker(self) -> None:
        record = _record("recTest", "Operational v0.3", "Approved")
        text = sync._render(CFG, record)
        full, short = sync._extract_hash(text)
        self.assertIsNotNone(full)
        self.assertIsNotNone(short)
        self.assertEqual(len(full), 64)
        self.assertEqual(len(short), 16)
        self.assertEqual(full[:16], short)


class VerifyPendingGateTest(unittest.TestCase):
    AGENT_CFG = sync.AGENTS["clive-man"]

    def _gate_record(self, name: str, status: str) -> dict:
        f = self.AGENT_CFG["fields"]
        return {
            "id": self.AGENT_CFG["expected_record_id"],
            "fields": {
                f["name"]: name,
                f["status"]: status,
            },
        }

    def test_verify_pending_gate_reports_closed(self) -> None:
        record = self._gate_record("Operational v0.4", "Pending")
        with patch.object(sync, "_fetch_record", return_value=record):
            sync.verify_pending_gate("clive-man")

    def test_verify_pending_gate_fails_on_wrong_name(self) -> None:
        record = self._gate_record("Operational v0.3", "Pending")
        with patch.object(sync, "_fetch_record", return_value=record):
            with self.assertRaises(SystemExit) as raised:
                sync.verify_pending_gate("clive-man")

        self.assertIn("Config Name", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
