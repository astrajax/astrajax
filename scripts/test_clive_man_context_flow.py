#!/usr/bin/env python3
"""Cursor-relevant static contract tests for Clive's Man context flow (Option 3).

Manifest: 38 Cursor tests (CM-CUR-001 … CM-CUR-038) of 76 total cleared manifest.
Hyperagent runtime/offline tests (CM-HA-001 … CM-HA-038) belong to Hyperagent Builder.
"""

from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "scripts"))

import generate_persona_config_sync as sync  # noqa: E402


def _read(path: str) -> str:
    return (REPO / path).read_text(encoding="utf-8")


def _read_json(path: str) -> dict:
    return json.loads(_read(path))


class PersonaResolverContractTest(unittest.TestCase):
    def test_cm_cur_001_expected_record_id_in_agent_config(self) -> None:
        cfg = sync.AGENTS["clive-man"]
        self.assertEqual(cfg["expected_record_id"], "recSKTT8NTTJOmuRu")

    def test_cm_cur_002_expected_version_exact_name(self) -> None:
        cfg = sync.AGENTS["clive-man"]
        self.assertEqual(cfg["expected_version"], "Operational v0.4")

    def test_cm_cur_003_strict_semver_rejects_suffix(self) -> None:
        self.assertIsNone(sync._parse_operational_version("Operational v0.4 (draft)"))

    def test_cm_cur_004_airtable_ids_pending_v04(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn('operationalV04Pending: "recSKTT8NTTJOmuRu"', text)

    def test_cm_cur_005_no_v04_generated_sync_file(self) -> None:
        gen = _read("agents/registry/cursor/clive/clive-man/persona-config.generated.md")
        self.assertIn("Operational v0.3", gen)
        self.assertNotIn("recSKTT8NTTJOmuRu", gen)

    def test_cm_cur_006_generator_documents_full_sha256(self) -> None:
        text = _read("scripts/generate_persona_config_sync.py")
        self.assertIn("content-sha256:", text)
        self.assertIn("hashlib.sha256", text)


class Option3LanesStaticTest(unittest.TestCase):
    def test_cm_cur_007_head_agent_documents_lane_a(self) -> None:
        text = _read(".cursor/agents/clive-man.md")
        self.assertIn("Option 3", text)
        self.assertIn("Lane A", text)
        self.assertIn("@clive-man-executor", text)

    def test_cm_cur_008_skill_documents_lane_b_trinity(self) -> None:
        text = _read(".cursor/skills/clive-man/SKILL.md")
        self.assertIn("Option 3", text)
        self.assertIn("Proposer", text)
        self.assertIn("Challenger", text)

    def test_cm_cur_009_skill_documents_lane_c_human(self) -> None:
        text = _read(".cursor/skills/clive-man/SKILL.md")
        self.assertIn("Option 3", text)
        self.assertIn("Trusted promotion", text)

    def test_cm_cur_010_executor_supports_lane_a_and_b(self) -> None:
        text = _read(".cursor/skills/clive-man-executor/SKILL.md")
        self.assertIn("Lane A", text)
        self.assertIn("Lane B", text)

    def test_cm_cur_011_proposer_lane_b_only(self) -> None:
        text = _read(".cursor/skills/clive-man-proposer/SKILL.md")
        self.assertIn("Lane B only", text)

    def test_cm_cur_012_batch_threshold_four(self) -> None:
        text = _read(".cursor/skills/clive-man/SKILL.md")
        self.assertIn("≥4", text)


class Route1StaticTest(unittest.TestCase):
    def test_cm_cur_013_cursor_routing_lane_a_gate(self) -> None:
        text = _read(".cursor/skills/household-routing-standard/SKILL.md")
        self.assertIn("only when Lane A is complete", text)

    def test_cm_cur_014_claude_mirror_matches_cursor_route1(self) -> None:
        cursor = _read(".cursor/skills/household-routing-standard/SKILL.md")
        claude = _read(".claude/skills/household-routing-standard/SKILL.md")
        self.assertIn("only when Lane A is complete", claude)
        self.assertEqual(
            cursor.split("Route 1")[1][:400],
            claude.split("Route 1")[1][:400],
        )


class InjectionFenceStaticTest(unittest.TestCase):
    PATHS = [
        ".cursor/skills/clive-man/SKILL.md",
        ".cursor/skills/clive-man-proposer/SKILL.md",
        ".cursor/skills/clive-man-challenger/SKILL.md",
        ".cursor/skills/clive-man-executor/SKILL.md",
    ]

    def test_cm_cur_015_injection_fence_in_head_skill(self) -> None:
        self.assertIn("Injection fence", _read(self.PATHS[0]))

    def test_cm_cur_016_injection_fence_in_proposer(self) -> None:
        self.assertIn("untrusted data", _read(self.PATHS[1]))

    def test_cm_cur_017_injection_fence_in_challenger(self) -> None:
        self.assertIn("injection", _read(self.PATHS[2]).lower())

    def test_cm_cur_018_injection_fence_in_executor(self) -> None:
        self.assertIn("Injection fence", _read(self.PATHS[3]))


class DraftStatusStaticTest(unittest.TestCase):
    def test_cm_cur_019_four_value_operating_set_in_schema(self) -> None:
        text = _read("docs/initiatives/brain-key-schema.md")
        self.assertIn("Draft, Quarantined, Rejected, Promoted", text)

    def test_cm_cur_020_agent_write_split_documented(self) -> None:
        text = _read("docs/initiatives/brain-key-schema.md")
        self.assertIn("agents write", text.lower())
        self.assertIn("Approved", text)

    def test_cm_cur_021_airtable_ids_four_statuses(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        for status in ("draft", "quarantined", "rejected", "promoted"):
            self.assertIn(f"{status}:", text)

    def test_cm_cur_022_executor_draft_quarantined_only(self) -> None:
        text = _read(".cursor/skills/clive-man-executor/SKILL.md")
        self.assertIn("Draft", text)
        self.assertIn("Quarantined", text)
        self.assertIn("drift", text.lower())


class AmbientCaptureStaticTest(unittest.TestCase):
    def test_cm_cur_023_ambient_agent_exists(self) -> None:
        self.assertTrue(
            (REPO / ".cursor/agents/clive-man-ambient-capture.md").is_file()
        )

    def test_cm_cur_024_frozen_actor_literal(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("clive-man-ambient-capture", text)
        self.assertIn("alias the actor slug", text.lower())

    def test_cm_cur_025_create_draft_truth_pen(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("CREATE_DRAFT_TRUTH", text)

    def test_cm_cur_026_payload_field_ids(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("fldiMCxuBITyZIOXW", text)
        self.assertIn("flde1d1sda9lWwrj9", text)
        self.assertIn("fld9zhLHPvjnq8lHT", text)
        self.assertIn("sel16ONJz9yPx76hH", text)

    def test_cm_cur_027_tools_boundary(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("searchthreads", text)
        self.assertIn("execute-script", text)

    def test_cm_cur_028_credential_v1_amendment_queue_only(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("appL2fdnGmhA02WXd", text)
        self.assertIn("tblsuOKGjSGYv0Vov", text)
        self.assertNotIn("tblswvXNYFDqnl6af", text)
        self.assertIn("cannot write draft brain truth directly", text.lower())

    def test_cm_cur_028b_control_plane_id_map_retains_both_tables(self) -> None:
        ids = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn('contextAmendments: "tblsuOKGjSGYv0Vov"', ids)
        self.assertIn('draftBrainTruth: "tblswvXNYFDqnl6af"', ids)

    def test_cm_cur_029_schedule_disabled_metadata(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("disabled", text.lower())
        self.assertIn("05:00", text)

    def test_cm_cur_030_kimi_budget_cap(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("Kimi K3", text)
        self.assertIn("20", text)


class CheckpointAndThroughputStaticTest(unittest.TestCase):
    def test_cm_cur_031_checkpoint_sentinel_constant(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn("PENDING_RUTH_CHECKPOINT_STORE", text)

    def test_cm_cur_032_skill_checkpoint_sentinel(self) -> None:
        text = _read(".cursor/skills/clive-man-ambient-capture/SKILL.md")
        self.assertIn("PENDING_RUTH_CHECKPOINT_STORE", text)

    def test_cm_cur_033_no_five_row_intake_cap(self) -> None:
        text = _read(".cursor/skills/clive-man/SKILL.md")
        self.assertIn("uncapped", text.lower())
        self.assertIn("maintenance cap **5**", text)

    def test_cm_cur_034_per_lane_failure_cap_two(self) -> None:
        text = _read(".cursor/skills/clive-man/SKILL.md")
        self.assertIn("failure cap **2**", text)


class IdLedgerAndAliasesStaticTest(unittest.TestCase):
    def test_cm_cur_035_workshop_control_table_ids(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn("tblsuOKGjSGYv0Vov", text)
        self.assertIn("tblM7gxcsWYijdaM8", text)
        self.assertIn("tblakbMPiim1K13Ru", text)

    def test_cm_cur_036_household_versions_ids(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn("appPrpfvsAr71RPP3", text)
        self.assertIn("tbleX09zbkUNKTGBz", text)

    def test_cm_cur_037_archive_ledger_eight_pairs(self) -> None:
        text = _read("website/src/lib/brains/airtable-ids.ts")
        self.assertIn("CLIVE_MAN_HOUSEHOLD_ARCHIVE_LEDGER", text)
        self.assertEqual(text.count('head: "rec'), 8)

    def test_cm_cur_038_fleet_aliases_never_alias_actor(self) -> None:
        roster = _read_json("hyperagent/scripts/fleet_sync_roster.json")
        aliases = roster["export_aliases"]
        self.assertEqual(
            aliases.get("clive-s-man-ambient-capture"), "clive-man-ambient-capture"
        )
        # Canonical actor slug must not map away to a different slug.
        self.assertNotIn("clive-man-ambient-capture", aliases)
        agents = roster["agents"]
        self.assertIn("clive-man-ambient-capture", agents)
        self.assertEqual(agents["clive-man-ambient-capture"]["parent_slug"], "clive-man")


class NoHardcodedPersonaAnchorsTest(unittest.TestCase):
    def test_cm_cur_persona_generated_not_in_agent_frontmatter(self) -> None:
        """Agents reference record IDs, not embedded Persona prompt paragraphs."""
        agent = _read(".cursor/agents/clive-man.md")
        gen = _read("agents/registry/cursor/clive/clive-man/persona-config.generated.md")
        prompt_snippet = "FLEET STANDARDS (5 Jul 2026)"
        self.assertIn(prompt_snippet, gen)
        self.assertNotIn(prompt_snippet, agent)


if __name__ == "__main__":
    unittest.main()
