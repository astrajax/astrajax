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
    DEFAULT_CHANGE_SOURCE,
    DEFAULT_CONFIG_NAME,
    HOUSEHOLD_MEMBERS_TABLE,
    HOUSEHOLD_MINIONS_TABLE,
    HOUSEHOLD_VERSIONS_TABLE,
    MEMBERS_FLD,
    MINIONS_FLD,
    REGISTER_SKILLS_TABLE,
    SKILL_VERSIONS_FLD,
    SKILL_VERSIONS_TABLE,
    SKILLS_FLD,
    VERSIONS_FLD,
    ExportBundle,
    apply_plan,
    build_plan,
    load_roster,
    load_verify_pass_payload,
    plan_verify_pass,
)


class InMemoryAirtableClient:
    """Minimal stand-in for planner read-before-write tests."""

    def __init__(self, state: dict[tuple[str, str], list[dict]]) -> None:
        self.state = state
        self.tables: dict[str, dict[str, str]] = {
            "appPrpfvsAr71RPP3": {
                "Household Members": HOUSEHOLD_MEMBERS_TABLE,
                "Household Minions": "tbl6aVm9rgWoOBVfd",
                "Household Versions": "tbleX09zbkUNKTGBz",
                "Skills": "tblAIXtDBBMrLuEYc",
                "Skill Versions": "tbllp30BraLWgslhk",
            },
            "appI5tpwsKNwjfrqR": {
                "Persona Config": "tblPC",
                "Skills": "tblSkills",
            },
        }

    def table_id(self, base_id: str, table_name: str) -> str | None:
        return self.tables.get(base_id, {}).get(table_name)

    def create_records(self, base_id: str, table_id: str, rows: list[dict]) -> list[dict]:
        created: list[dict] = []
        bucket = self.state.setdefault((base_id, table_id), [])
        for fields in rows:
            rec = {"id": f"recNew{len(bucket)}", "fields": dict(fields)}
            bucket.append(rec)
            created.append(rec)
        return created

    def update_records(self, base_id: str, table_id: str, rows: list[tuple[str, dict]]) -> list[dict]:
        updated: list[dict] = []
        bucket = self.state.setdefault((base_id, table_id), [])
        by_id = {row["id"]: row for row in bucket}
        for record_id, fields in rows:
            row = by_id[record_id]
            row["fields"].update(fields)
            updated.append(row)
        return updated

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
        if "Skill Name" in formula:
            name = formula.split("'")[1]
            return [row for row in rows if (row.get("fields") or {}).get("Skill Name") == name]
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
            ("appPrpfvsAr71RPP3", "tbleX09zbkUNKTGBz"): [],
            ("appPrpfvsAr71RPP3", "tblAIXtDBBMrLuEYc"): [],
            ("appPrpfvsAr71RPP3", "tbllp30BraLWgslhk"): [],
            ("appI5tpwsKNwjfrqR", "tblPC"): [
                {
                    "id": "recPC",
                    "fields": {
                        "Config Name": DEFAULT_CONFIG_NAME,
                        "Operational System Prompt": "old prompt",
                        "Rules Section": "",
                        "Output Format": "",
                        # Pending may be updated in place; Approved must not.
                        "Status": "Pending",
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

    def test_refuses_inplace_overwrite_of_approved_persona_config(self) -> None:
        self.state[("appI5tpwsKNwjfrqR", "tblPC")][0]["fields"]["Status"] = "Approved"
        client = InMemoryAirtableClient(self.state)
        plan = build_plan(
            client,
            self.roster_raw,
            self.agents,
            self.exports,
            config_name=DEFAULT_CONFIG_NAME,
            allow_create_bases=False,
        )
        pc_updates = [
            item
            for item in plan.actions
            if item.target == "persona_config" and item.action == "update"
        ]
        self.assertEqual(pc_updates, [], "must not PATCH Approved Persona Config")
        refused = [
            item
            for item in plan.actions
            if item.target == "persona_config" and item.action == "refuse"
        ]
        self.assertEqual(len(refused), 1)
        self.assertIn("Approved", refused[0].reason or "")
        self.assertEqual(refused[0].record_id, "recPC")
        # Live Approved prompt must stay untouched even if apply were run.
        self.assertEqual(
            self.state[("appI5tpwsKNwjfrqR", "tblPC")][0]["fields"]["Operational System Prompt"],
            "old prompt",
        )

    def test_refuses_inplace_overwrite_of_approved_skill(self) -> None:
        self.state[("appI5tpwsKNwjfrqR", "tblSkills")][0]["fields"].update(
            {
                "Status": "Approved",
                "Documentation": "# stale approved body",
            }
        )
        self.exports[0] = ExportBundle(
            slug="doc",
            path=Path("agent-doc-albright-onplatform-v0_1.json"),
            name="Doc Albright",
            description="Dispatcher",
            system_prompt="old prompt",  # match Pending PC path irrelevant here
            skills=[
                {
                    "name": "doc",
                    "description": "Doc skill",
                    "whenToUse": "Always",
                    "documentation": "# new body from export",
                }
            ],
        )
        # Keep PC identical so only the skill refuse is under test.
        self.state[("appI5tpwsKNwjfrqR", "tblPC")][0]["fields"]["Operational System Prompt"] = (
            "old prompt"
        )
        client = InMemoryAirtableClient(self.state)
        plan = build_plan(
            client,
            self.roster_raw,
            self.agents,
            self.exports,
            config_name=DEFAULT_CONFIG_NAME,
            allow_create_bases=False,
        )
        skill_updates = [
            item
            for item in plan.actions
            if item.target == "agent_skill" and item.action == "update"
        ]
        self.assertEqual(skill_updates, [], "must not PATCH Approved skill Documentation")
        refused = [
            item
            for item in plan.actions
            if item.target == "agent_skill" and item.action == "refuse"
        ]
        self.assertEqual(len(refused), 1)
        self.assertIn("Approved skill", refused[0].reason or "")

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
        minion_writes = [item for item in plan.actions if item.target == "household_minion"]
        self.assertTrue(minion_writes)
        self.assertIn("System Prompt", minion_writes[0].fields)
        self.assertEqual(minion_writes[0].fields["System Prompt"], "proposer prompt")


class VerifyPassRegisterTest(unittest.TestCase):
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
            ("appPrpfvsAr71RPP3", HOUSEHOLD_MINIONS_TABLE): [
                {
                    "id": "recMinion",
                    "fields": {
                        "Agent Slug": "clive-man-proposer",
                        "Agent Name": "Clive's Man Proposer",
                        "Purpose": "old",
                        "System Prompt": "old minion prompt",
                        "Status": "Active",
                    },
                }
            ],
            ("appPrpfvsAr71RPP3", HOUSEHOLD_VERSIONS_TABLE): [],
            ("appPrpfvsAr71RPP3", REGISTER_SKILLS_TABLE): [
                {
                    "id": "recSkillLive",
                    "fields": {
                        "Skill Name": "Self-Update Executor",
                        "When to Use": "old",
                        "Documentation": "old docs",
                        "Description": "old desc",
                    },
                }
            ],
            ("appPrpfvsAr71RPP3", SKILL_VERSIONS_TABLE): [],
        }
        self.client = InMemoryAirtableClient(self.state)

    def _payload(self, **overrides: object) -> dict:
        payload = {
            "slug": "doc",
            "kind": "head",
            "agent_name": "Doc Albright",
            "system_prompt": "new prompt",
            "purpose": "Dispatcher",
            "what_changed": "Self-Update verify pass",
            "version": "20260819T084100Z",
            "change_reason": "Improvement",
            "change_source": "Matthew Directed",
            "rolled_back": False,
            "skills": [
                {
                    "name": "Self-Update Executor",
                    "description": "method skill",
                    "when_to_use": "Cursor Self-Update thread",
                    "documentation": "# Self-Update Executor",
                    "what_changed": "method v0.1",
                    "version": "20260819T084100Z",
                    "change_reason": "Improvement",
                    "change_source": "Matthew Directed",
                }
            ],
        }
        payload.update(overrides)
        return payload

    def test_change_source_defaults_to_matthew_directed(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump({"slug": "doc", "kind": "head", "system_prompt": "x"}, handle)
            path = Path(handle.name)
        loaded = load_verify_pass_payload(path)
        path.unlink()
        self.assertEqual(loaded["change_source"], DEFAULT_CHANGE_SOURCE)

    def test_head_pass_updates_prompt_and_creates_versions(self) -> None:
        plan = plan_verify_pass(self.client, self.roster_raw, self.agents, self._payload())
        self.assertEqual(plan.errors, [])
        self.assertFalse(any(item.target == "persona_config" for item in plan.actions))
        member = next(item for item in plan.actions if item.target == "household_member")
        self.assertEqual(member.action, "update")
        self.assertEqual(member.fields[MEMBERS_FLD["system_prompt"]], "new prompt")
        version = next(item for item in plan.actions if item.target == "household_version")
        self.assertEqual(version.action, "create")
        self.assertEqual(version.fields[VERSIONS_FLD["change_source"]], "Matthew Directed")
        self.assertEqual(version.fields[VERSIONS_FLD["active_member"]], ["recHead"])
        skill_version = next(item for item in plan.actions if item.target == "skill_version")
        self.assertEqual(skill_version.action, "create")
        self.assertEqual(skill_version.fields[SKILL_VERSIONS_FLD["change_reason"]], "Improvement")
        self.assertEqual(skill_version.fields[SKILL_VERSIONS_FLD["change_source"]], "Matthew Directed")
        self.assertEqual(skill_version.fields[SKILL_VERSIONS_FLD["change_reason"]], skill_version.fields[SKILL_VERSIONS_FLD["change_reason"]])
        self.assertEqual(SKILL_VERSIONS_FLD["change_reason"], "fldEh3aXTh12qzrog")

    def test_minion_pass_writes_system_prompt_field_id(self) -> None:
        payload = self._payload(
            slug="clive-man-proposer",
            kind="minion",
            agent_name="Clive's Man Proposer",
            system_prompt="new minion prompt",
            skills=[],
        )
        plan = plan_verify_pass(self.client, self.roster_raw, self.agents, payload)
        minion = next(item for item in plan.actions if item.target == "household_minion")
        self.assertEqual(minion.fields[MINIONS_FLD["system_prompt"]], "new minion prompt")
        self.assertEqual(MINIONS_FLD["system_prompt"], "fldex5K15FTjEWoM7")
        self.assertFalse(any(item.target == "persona_config" for item in plan.actions))

    def test_rollback_skips_live_rows_but_snapshots_version(self) -> None:
        payload = self._payload(rolled_back=True, change_reason="Broken/failing", skills=[])
        plan = plan_verify_pass(self.client, self.roster_raw, self.agents, payload)
        live = [
            item
            for item in plan.actions
            if item.target in {"household_member", "household_minion", "register_skill"}
            and item.action in {"create", "update"}
        ]
        self.assertEqual(live, [])
        versions = [item for item in plan.actions if item.target == "household_version"]
        self.assertEqual(len(versions), 1)
        self.assertEqual(versions[0].action, "create")
        self.assertEqual(versions[0].fields[VERSIONS_FLD["change_source"]], "Matthew Directed")

    def test_apply_links_skill_versions_to_live_skill(self) -> None:
        plan = plan_verify_pass(self.client, self.roster_raw, self.agents, self._payload())
        reversal = apply_plan(self.client, self.roster_raw, self.agents, plan)
        skill_versions = [
            row
            for row in reversal["created"]
            if row["target"] == "skill_version"
        ]
        self.assertEqual(len(skill_versions), 1)
        fields = skill_versions[0]["fields"]
        self.assertEqual(fields[SKILL_VERSIONS_FLD["skills"]], ["recSkillLive"])
        self.assertEqual(fields[SKILL_VERSIONS_FLD["change_source"]], "Matthew Directed")
        household_versions = [row for row in reversal["created"] if row["target"] == "household_version"]
        self.assertEqual(len(household_versions), 1)
        self.assertIn(VERSIONS_FLD["skill_versions"], household_versions[0]["fields"])
        link_updates = [row for row in reversal["updated"] if row["target"] == "register_skill_versions_link"]
        self.assertTrue(link_updates)
        self.assertEqual(link_updates[0]["fields"][SKILLS_FLD["skill_versions"]], [skill_versions[0]["record_id"]])


if __name__ == "__main__":
    unittest.main()
