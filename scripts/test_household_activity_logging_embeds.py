#!/usr/bin/env python3
"""Guard Household Activity Logging embeds against the User Turn Type field bug.

Airtable split Turn Type into User Turn Type (AI-owned, fldTCd93…) and Agent
Turn Type (mechanical, fldvskI…). Mapping semantic `event_type` onto User Turn
Type writes mechanical values into an AI field (or fails the write), leaves
Agent Turn Type empty, and breaks Session End / intake consumers.

Repo script and skill export must stay on Agent Turn Type; agent JSON embeds
must not drift back.
"""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
EXPORTS = REPO / "hyperagent" / "exports"
LOGGER = REPO / "hyperagent" / "scripts" / "log_fleet_activity.py"

AGENT_TURN_TYPE = "fldvskIDzutu4JzQt"
USER_TURN_TYPE = "fldTCd93XF8XhsVoZ"
EVENT_TYPE_TO_USER = re.compile(
    r"""["']event_type["']\s*:\s*["']""" + re.escape(USER_TURN_TYPE) + r"""["']"""
)
EVENT_TYPE_TO_AGENT = re.compile(
    r"""["']event_type["']\s*:\s*["']""" + re.escape(AGENT_TURN_TYPE) + r"""["']"""
)


def _iter_log_fleet_scripts(node, *, path: str):
    if isinstance(node, dict):
        if node.get("filename") == "log_fleet_activity.py" and isinstance(
            node.get("content"), str
        ):
            yield path, node["content"]
        for key, value in node.items():
            yield from _iter_log_fleet_scripts(value, path=f"{path}.{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from _iter_log_fleet_scripts(value, path=f"{path}[{index}]")
    elif isinstance(node, str) and "log_fleet_activity.py" in node and node.strip().startswith(
        "["
    ):
        try:
            parsed = json.loads(node)
        except json.JSONDecodeError:
            return
        yield from _iter_log_fleet_scripts(parsed, path=f"{path}<scripts-json>")


class HouseholdActivityLoggingEmbedsTest(unittest.TestCase):
    def test_repo_logger_maps_event_type_to_agent_turn_type(self) -> None:
        content = LOGGER.read_text(encoding="utf-8")
        self.assertRegex(content, EVENT_TYPE_TO_AGENT)
        self.assertIsNone(EVENT_TYPE_TO_USER.search(content))
        # User Turn Type may appear only as an AI-owned reject entry.
        self.assertIn(USER_TURN_TYPE, content)

    def test_exports_never_map_event_type_to_user_turn_type(self) -> None:
        bad: list[str] = []
        checked = 0
        for path in sorted(EXPORTS.rglob("*.json")):
            data = json.loads(path.read_text(encoding="utf-8"))
            for loc, content in _iter_log_fleet_scripts(data, path=str(path.relative_to(REPO))):
                checked += 1
                if EVENT_TYPE_TO_USER.search(content):
                    bad.append(loc)
                else:
                    self.assertRegex(
                        content,
                        EVENT_TYPE_TO_AGENT,
                        msg=f"{loc} missing Agent Turn Type event_type map",
                    )
        self.assertGreater(checked, 0, "expected at least one embedded log_fleet_activity.py")
        self.assertEqual(bad, [], msg="event_type mapped to User Turn Type in: " + ", ".join(bad))

    def test_halvard_export_uses_agent_turn_type(self) -> None:
        path = EXPORTS / "agents" / "agent-prof-halvard-bjornson-v0_1.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        scripts = [
            content
            for _, content in _iter_log_fleet_scripts(data, path=path.name)
        ]
        self.assertEqual(len(scripts), 1)
        self.assertRegex(scripts[0], EVENT_TYPE_TO_AGENT)
        self.assertIsNone(EVENT_TYPE_TO_USER.search(scripts[0]))


if __name__ == "__main__":
    unittest.main()
