#!/usr/bin/env python3
"""Guard Ristral's Last Scanned cursor-write rail (#199 Household Members overlay).

The structural bound is the whole point of this helper: any field outside
`Last Scanned` must be refused before network work. These tests exercise
preflight + table-id checks only — no Airtable calls.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "ristral" / "ristral_cursor_write.py"
SCRIPT_MIRRORS = (
    REPO / ".cursor" / "skills" / "ristral-weekly-scout" / "scripts" / "ristral_cursor_write.py",
    REPO / ".claude" / "skills" / "ristral-weekly-scout" / "scripts" / "ristral_cursor_write.py",
)


def _load():
    spec = importlib.util.spec_from_file_location("ristral_cursor_write", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


mod = _load()


class RefusalMixin:
    def refuse(self, fn, *args, **kwargs) -> str:
        captured = io.StringIO()
        with contextlib.redirect_stderr(captured):
            with self.assertRaises(SystemExit) as raised:
                fn(*args, **kwargs)
        self.assertEqual(raised.exception.code, 1)
        return captured.getvalue()


class PreflightAllowlistTest(RefusalMixin, unittest.TestCase):
    def test_accepts_exactly_last_scanned(self) -> None:
        record_id, fields = mod._preflight(
            {"record_id": "recHouseholdMember01", "fields": {"Last Scanned": "2026-08-23"}}
        )
        self.assertEqual(record_id, "recHouseholdMember01")
        self.assertEqual(fields, {"Last Scanned": "2026-08-23"})

    def test_refuses_extra_field_before_write(self) -> None:
        text = self.refuse(
            mod._preflight,
            {
                "record_id": "recHouseholdMember01",
                "fields": {"Last Scanned": "2026-08-23", "Status": "Active"},
            },
        )
        self.assertIn("outside the Last Scanned allowlist", text)
        self.assertIn("Status", text)

    def test_refuses_missing_last_scanned(self) -> None:
        text = self.refuse(
            mod._preflight,
            {"record_id": "recHouseholdMember01", "fields": {"Notes": "x"}},
        )
        self.assertIn("outside the Last Scanned allowlist", text)

    def test_refuses_empty_fields(self) -> None:
        text = self.refuse(
            mod._preflight,
            {"record_id": "recHouseholdMember01", "fields": {}},
        )
        self.assertIn("non-empty object", text)

    def test_refuses_non_record_id(self) -> None:
        text = self.refuse(
            mod._preflight,
            {"record_id": "not-a-rec", "fields": {"Last Scanned": "2026-08-23"}},
        )
        self.assertIn("record id", text)

    def test_refuses_non_string_date(self) -> None:
        text = self.refuse(
            mod._preflight,
            {"record_id": "recHouseholdMember01", "fields": {"Last Scanned": 20260823}},
        )
        self.assertIn("ISO date string", text)


class TableIdGuardTest(RefusalMixin, unittest.TestCase):
    def test_default_members_overlay_id_is_accepted(self) -> None:
        self.assertEqual(
            mod._require_table_id(
                mod.DEFAULT_MEMBERS_TABLE_ID,
                "RISTRAL_SCOUT_ROSTER_TABLE_ID",
                mod.ROSTER_TABLE_PLACEHOLDER,
            ),
            "tblUXYgkTpbxakFjc",
        )

    def test_placeholder_table_id_is_refused(self) -> None:
        text = self.refuse(
            mod._require_table_id,
            mod.ROSTER_TABLE_PLACEHOLDER,
            "RISTRAL_SCOUT_ROSTER_TABLE_ID",
            mod.ROSTER_TABLE_PLACEHOLDER,
        )
        self.assertIn("RISTRAL_SCOUT_ROSTER_TABLE_ID", text)
        self.assertIn("Household Members", text)


class MirrorSyncTest(unittest.TestCase):
    def test_cursor_and_claude_mirrors_match_scripts_copy(self) -> None:
        canonical = SCRIPT.read_bytes()
        for mirror in SCRIPT_MIRRORS:
            self.assertTrue(mirror.is_file(), mirror)
            self.assertEqual(mirror.read_bytes(), canonical, mirror)


if __name__ == "__main__":
    unittest.main()
