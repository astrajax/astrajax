#!/usr/bin/env python3
"""Offline unit tests for Approved Persona Config resolution."""

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


if __name__ == "__main__":
    unittest.main()
