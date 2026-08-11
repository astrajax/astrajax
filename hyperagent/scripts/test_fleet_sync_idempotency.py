#!/usr/bin/env python3
"""Offline idempotency tests for fleet sync planner."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from sync_hyperagent_fleet_to_airtable import (  # noqa: E402
    DEFAULT_CONFIG_NAME,
    HOUSEHOLD_MEMBERS_TABLE,
    ExportBundle,
    build_plan,
    load_roster,
)


class InMemoryAirtableClient:
    """Minimal stand-in for planner read-before-write tests."""

    def __init__(self, state: dict[tuple[str, str], list[dict]]) -> None:
        self.state = state
        self.tables: dict[str, dict[str, str]] = {
            "appPrpfvsAr71RPP3": {
                "Household Members": HOUSEHOLD_MEMBERS_TABLE,
                "Household Minions": "tbl6aVm9rgWoOBVfd",
                "Skills": "tblAIXtDBBMrLuEYc",
            },
            "appI5tpwsKNwjfrqR": {
                "Persona Config": "tblPC",
                "Skills": "tblSkills",
            },
        }

    def table_id(self, base_id: str, table_name: str) -> str | None:
        return self.tables.get(base_id, {}).get(table_name)

    def list_records(
        self,
        base_id: str,
        table_id: str,
        *,
        fields: list[str] | None = None,
        formula: str | None = None,
    ) -> list[dict]:
        rows = list(self.state.get((base_id, table_id), []))
        if not formula:
            return rows
        if "Agent Slug" in formula:
            slug = formula.split("'")[1]
            return [row for row in rows if (row.get("fields") or {}).get("Agent Slug") == slug]
        return rows


class FleetSyncIdempotencyTest(unittest.TestCase):
    def setUp(self) -> None:
        self.roster_raw, self.agents = load_roster()
        self.state: dict[tuple[str, str], list[dict]] = {
            ("appPrpfvsAr71RPP3", HOUSEHOLD_MEMBERS_TABLE): [
                {
                    "id": "recHead",
                    "fields": {
                        "Agent Slug": "doc",
                        "Agent Name": "Doc Albright",
                        "System Prompt": "old prompt",
                        "Purpose": "old purpose",
                        "Agent Base ID": "appI5tpwsKNwjfrqR",
                        "Status": "Active",
                    },
                }
            ],
            ("appPrpfvsAr71RPP3", "tbl6aVm9rgWoOBVfd"): [],
            ("appPrpfvsAr71RPP3", "tblAIXtDBBMrLuEYc"): [],
            ("appI5tpwsKNwjfrqR", "tblPC"): [
                {
                    "id": "recPC",
                    "fields": {
                        "Config Name": DEFAULT_CONFIG_NAME,
                        "Operational System Prompt": "old prompt",
                        "Rules Section": "",
                        "Output Format": "",
                        "Status": "Approved",
                    },
                }
            ],
            ("appI5tpwsKNwjfrqR", "tblSkills"): [
                {
                    "id": "recSkill",
                    "fields": {
                        "Skill Name": "doc",
                        "Description": "Doc skill",
                        "When to Use": "Always",
                        "Documentation": "# doc",
                        "Status": "Proposed",
                        "Provenance Status": "Pending",
                    },
                }
            ],
        }
        self.exports = [
            ExportBundle(
                slug="doc",
                path=Path("agent-doc-albright-onplatform-v0_1.json"),
                name="Doc Albright",
                description="Dispatcher",
                system_prompt="new prompt",
                skills=[
                    {
                        "name": "doc",
                        "description": "Doc skill",
                        "whenToUse": "Always",
                        "documentation": "# doc",
                    }
                ],
            )
        ]

    def test_second_plan_has_no_creates_after_state_matches(self) -> None:
        client = InMemoryAirtableClient(self.state)
        first = build_plan(
            client,
            self.roster_raw,
            self.agents,
            self.exports,
            config_name=DEFAULT_CONFIG_NAME,
            allow_create_bases=False,
        )
        first_creates = [item for item in first.actions if item.action == "create"]
        first_mutations = [item for item in first.actions if item.action in {"create", "update"}]
        self.assertGreater(len(first_mutations), 0, "first run should propose creates or updates")

        # Simulate successful apply into memory store.
        for item in first.actions:
            if item.action == "update" and item.record_id:
                for rows in self.state.values():
                    for row in rows:
                        if row["id"] == item.record_id:
                            row["fields"].update(item.fields)
            if item.action == "create":
                table_key = {
                    "household_member": ("appPrpfvsAr71RPP3", HOUSEHOLD_MEMBERS_TABLE),
                    "persona_config": ("appI5tpwsKNwjfrqR", "tblPC"),
                    "agent_skill": ("appI5tpwsKNwjfrqR", "tblSkills"),
                }[item.target]
                self.state.setdefault(table_key, []).append(
                    {"id": f"recNew{len(self.state[table_key])}", "fields": dict(item.fields)}
                )

        second = build_plan(
            client,
            self.roster_raw,
            self.agents,
            self.exports,
            config_name=DEFAULT_CONFIG_NAME,
            allow_create_bases=False,
        )
        second_creates = [item for item in second.actions if item.action == "create"]
        self.assertEqual(second_creates, [], "second run must not create duplicate rows")
        second_updates = [item for item in second.actions if item.action == "update"]
        self.assertEqual(second_updates, [], "second run must not update identical rows")
        self.assertFalse(first_creates, "fixture should not require creates on first run")

    def test_minion_never_plans_agent_base_create(self) -> None:
        client = InMemoryAirtableClient(self.state)
        exports = [
            ExportBundle(
                slug="clive-man-proposer",
                path=Path("agent-clive-man-proposer-v0_1.json"),
                name="Clive's Man Proposer",
                description="Proposer minion",
                system_prompt="proposer prompt",
                skills=[],
            )
        ]
        plan = build_plan(
            client,
            self.roster_raw,
            self.agents,
            exports,
            config_name=DEFAULT_CONFIG_NAME,
            allow_create_bases=False,
        )
        forbidden = [item for item in plan.actions if item.target in {"persona_config", "agent_skill"}]
        self.assertEqual(forbidden, [])
        refused = [item for item in plan.actions if item.action == "refuse"]
        self.assertEqual(refused, [])


if __name__ == "__main__":
    unittest.main()
