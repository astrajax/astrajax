#!/usr/bin/env python3
"""Offline tests for Lane B handoff card wording (#178 skill-only path)."""

from __future__ import annotations

import importlib.util
import io
import unittest
from contextlib import redirect_stdout
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "handoff_hyperagent_export.py"


def _load():
    spec = importlib.util.spec_from_file_location("handoff_hyperagent_export", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class HandoffCardTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def _card(self, export: dict) -> str:
        buf = io.StringIO()
        with redirect_stdout(buf):
            self.m._handoff_card(Path("/tmp/export.json"), export)
        return buf.getvalue()

    def test_skill_export_tells_cursor_to_attach_not_pin(self) -> None:
        text = self._card(
            {
                "type": "skill",
                "data": {
                    "name": "Self-Update Executor",
                    "authType": "none",
                },
            }
        )
        self.assertIn("skill JSON only", text)
        self.assertIn("Do not pin twelve agents", text)
        self.assertIn("no (shared method skill; no schedule/Slack/Live)", text)
        self.assertNotIn("Import agent JSON", text)

    def test_skill_api_key_marks_credentials_owed(self) -> None:
        text = self._card(
            {
                "type": "skill",
                "data": {
                    "name": "Credentialed Skill",
                    "authType": "api_key",
                },
            }
        )
        self.assertIn("Credentials owed: yes", text)
        self.assertIn("Add credentials on skill (UI only) before first run", text)

    def test_agent_with_embedded_skill_prefers_agent_only_import(self) -> None:
        text = self._card(
            {
                "type": "agent",
                "data": {
                    "name": "Doc Albright",
                    "skills": [{"name": "Self-Update Executor", "authType": "none"}],
                },
            }
        )
        self.assertIn("agent-only (embedded skills[]", text)
        self.assertIn("Import agent JSON", text)
        self.assertIn("Credentials owed: no", text)


if __name__ == "__main__":
    unittest.main()
