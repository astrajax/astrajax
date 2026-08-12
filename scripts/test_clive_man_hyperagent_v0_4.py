#!/usr/bin/env python3
"""Hyperagent offline contract tests for Clive's Man v0.4 (CM-HA-001 … CM-HA-038).

Run after generator --fixture-approved. Does not contact Airtable or import exports.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BUILDS = REPO / "hyperagent" / "builds"
EXPORTS_AGENTS = REPO / "hyperagent" / "exports" / "agents"
EXPORTS_SKILLS = REPO / "hyperagent" / "exports" / "skills"
VALIDATOR = REPO / "hyperagent" / "scripts" / "validate_hyperagent_export.py"

sys.path.insert(0, str(BUILDS))

from _clive_man_ambient_intake import (  # noqa: E402
    script_source,
    simulate_chunk_drain,
)
from _clive_man_v0_4_contract import (  # noqa: E402
    ACTOR_AMBIENT,
    ACTOR_AUDITOR,
    ACTOR_CHALLENGER,
    ACTOR_EXECUTOR,
    AGENT_EXPORTS,
    CAP_DAILY_MUTATIONS,
    CAP_FAILURES,
    CAPTURE_SOURCE_CHAT_SESSION,
    CHAT_BACKFILL_CLEAR_CAP,
    CHECKPOINT_SENTINEL,
    CONTEXT_AMENDMENT_VERSIONS_TABLE,
    CRED_AMBIENT_V1_CREATE,
    CRED_CLIVE_MAN_ON_DEMAND_WRITE,
    CRED_CLIVE_MAN_WORKSHOP_READ,
    DRAFT_BRAIN_TRUTH_TABLE,
    EXPECTED_EXPORT_COUNT,
    FIELD_CAPTURE_SOURCE,
    FIELD_PROPOSED_BY_AGENT,
    FIELD_STATUS,
    LEGACY_SCHEDULE_MARKERS,
    MODEL_AUDITOR,
    MODEL_CHALLENGER_ONDEMAND,
    MODEL_CHALLENGER_SCHEDULED,
    MODEL_CONTEXT_EXECUTOR,
    MODEL_EXECUTOR_ONDEMAND,
    MODEL_HEAD,
    MODEL_KIMI_K3,
    MODEL_PROPOSER,
    PERSONA_V04_RECORD_ID,
    SCHEDULE_CONTRACT,
    STANDALONE_SKILL_EXPORTS,
)
from _clive_man_persona_gate import load_fixture  # noqa: E402


def setUpModule() -> None:
    """Generate labelled fixture exports once before any CM-HA test reads them."""
    proc = subprocess.run(
        [sys.executable, str(BUILDS / "build_clive_man_family_v0_4.py"), "--fixture-approved"],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr or proc.stdout)


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _tool_settings(export: dict) -> dict:
    return json.loads(export["data"]["toolSettings"])


def _embedded_skills(export: dict) -> list[dict]:
    return export["data"].get("skills") or []


def _skill_by_name(export: dict, name: str) -> dict | None:
    for skill in _embedded_skills(export):
        if skill.get("name") == name:
            return skill
    return None


def _parse_scripts(skill: dict) -> list[dict]:
    raw = skill.get("scripts")
    if not raw:
        return []
    return json.loads(raw) if isinstance(raw, str) else raw


class GeneratorGateTest(unittest.TestCase):
    def test_cm_ha_001_pending_gate_fails_closed(self) -> None:
        env = {**dict(**{k: v for k, v in __import__("os").environ.items()}), "AIRTABLE_READ_TOKEN": ""}
        proc = subprocess.run(
            [sys.executable, str(BUILDS / "build_clive_man_family_v0_4.py"), "--pin-persona", "Operational v0.4"],
            cwd=REPO,
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(proc.returncode, 0)
        combined = proc.stdout + proc.stderr
        self.assertTrue(
            "Missing Airtable token" in combined
            or "FAIL CLOSED" in combined
            or "not Approved" in combined
        )

    def test_cm_ha_002_fixture_resolves_record_and_sha256(self) -> None:
        persona = load_fixture()
        self.assertEqual(persona.record_id, PERSONA_V04_RECORD_ID)
        self.assertEqual(len(persona.content_sha256), 64)

    def test_cm_ha_003_verify_pending_gate_mode(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(BUILDS / "build_clive_man_family_v0_4.py"), "--verify-pending-gate"],
            cwd=REPO,
            capture_output=True,
            text=True,
        )
        if proc.returncode == 0:
            self.assertIn("Pending", proc.stdout + proc.stderr)
        else:
            self.assertIn("Missing Airtable token", proc.stderr + proc.stdout)


class ExportInventoryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        proc = subprocess.run(
            [sys.executable, str(BUILDS / "build_clive_man_family_v0_4.py"), "--fixture-approved"],
            cwd=REPO,
            capture_output=True,
            text=True,
        )
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr or proc.stdout)

    def test_cm_ha_004_exact_fifteen_exports(self) -> None:
        agents = list(EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"))
        skills = list(EXPORTS_SKILLS.glob("skill-clive-man*v0_4.json"))
        self.assertEqual(len(agents) + len(skills), EXPECTED_EXPORT_COUNT)
        for name in AGENT_EXPORTS:
            self.assertTrue((EXPORTS_AGENTS / name).is_file(), name)
        for name in STANDALONE_SKILL_EXPORTS:
            self.assertTrue((EXPORTS_SKILLS / name).is_file(), name)

    def test_cm_ha_005_no_standalone_ambient_skill(self) -> None:
        self.assertFalse((EXPORTS_SKILLS / "skill-clive-man-ambient-capture-v0_4.json").exists())

    def test_cm_ha_006_validator_passes_all_exports(self) -> None:
        paths = list(EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json")) + list(
            EXPORTS_SKILLS.glob("skill-clive-man*v0_4.json")
        )
        for path in paths:
            proc = subprocess.run(
                [sys.executable, str(VALIDATOR), str(path)],
                capture_output=True,
                text=True,
            )
            self.assertEqual(proc.returncode, 0, f"{path.name}: {proc.stderr}")


class GovernedDefaultsTest(unittest.TestCase):
    def test_cm_ha_007_auto_save_and_suggestions_false(self) -> None:
        for path in EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"):
            data = _read_json(path)["data"]
            for key in (
                "autoSaveMemories",
                "autoSaveSkills",
                "autoSaveAgents",
                "autoSavePrompts",
                "enableSkillSuggestions",
                "enableMemorySuggestions",
                "enablePromptSuggestions",
            ):
                self.assertFalse(data[key], f"{path.name} {key}")

    def test_cm_ha_008_skill_scope_preload(self) -> None:
        for path in EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"):
            data = _read_json(path)["data"]
            self.assertEqual(data["skillScope"], "selected")
            self.assertEqual(data["skillLoadMode"], "preload")

    def test_cm_ha_009_no_github_integrations(self) -> None:
        for path in EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"):
            integrations = json.loads(_read_json(path)["data"]["allowedIntegrations"])
            self.assertEqual(integrations, [])


class ModelPinTest(unittest.TestCase):
    def test_cm_ha_010_head_model_pin(self) -> None:
        data = _read_json(EXPORTS_AGENTS / "agent-clive-man-v0_4.json")["data"]
        self.assertEqual(data["modelId"], MODEL_HEAD)
        self.assertNotIn("alias", data["modelId"])

    def test_cm_ha_011_on_demand_models(self) -> None:
        specs = {
            "proposer": (MODEL_PROPOSER, "low"),
            "challenger": (MODEL_CHALLENGER_ONDEMAND, "high"),
            "executor": (MODEL_EXECUTOR_ONDEMAND, "low"),
        }
        for slug, (model, effort) in specs.items():
            data = _read_json(EXPORTS_AGENTS / f"agent-clive-man-{slug}-v0_4.json")["data"]
            self.assertEqual(data["modelId"], model)
            self.assertEqual(data["effort"], effort)
            self.assertNotIn("alias", data["modelId"])

    def test_cm_ha_012_kimi_ambient_budget_only(self) -> None:
        ambient = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")["data"]
        self.assertEqual(ambient["modelId"], MODEL_KIMI_K3)
        self.assertEqual(ambient["effort"], "low")
        self.assertEqual(ambient["maxBudgetUsd"], 20)

        ctx_exec = _read_json(EXPORTS_AGENTS / "agent-clive-man-context-executor-v0_4.json")["data"]
        self.assertEqual(ctx_exec["modelId"], MODEL_CONTEXT_EXECUTOR)
        self.assertEqual(ctx_exec["effort"], "low")
        self.assertIsNone(ctx_exec.get("maxBudgetUsd"))

    def test_cm_ha_012b_scheduled_specialist_models(self) -> None:
        auditor = _read_json(EXPORTS_AGENTS / "agent-clive-man-context-auditor-v0_4.json")["data"]
        self.assertEqual(auditor["modelId"], MODEL_AUDITOR)
        self.assertEqual(auditor["effort"], "high")
        challenger = _read_json(EXPORTS_AGENTS / "agent-clive-man-context-challenger-v0_4.json")["data"]
        self.assertEqual(challenger["modelId"], MODEL_CHALLENGER_SCHEDULED)
        self.assertEqual(challenger["effort"], "high")


class AmbientContractTest(unittest.TestCase):
    def test_cm_ha_013_actor_literal_in_script(self) -> None:
        config = (REPO / "hyperagent/builds/sources/clive-man-v0_4/ambient/ambient_config.py").read_text()
        self.assertIn(ACTOR_AMBIENT, config)
        self.assertIn("created_by_agent", script_source())

    def test_cm_ha_014_pen_table_not_draft_brain_truth(self) -> None:
        src = script_source()
        self.assertIn(CONTEXT_AMENDMENT_VERSIONS_TABLE, src)
        self.assertIn(DRAFT_BRAIN_TRUTH_TABLE, src)
        self.assertIn("FORBIDDEN_TABLE", src)
        self.assertNotRegex(
            src,
            rf"TABLE_ID\s*=\s*{DRAFT_BRAIN_TRUTH_TABLE!r}",
        )

    def test_cm_ha_015_payload_field_ids(self) -> None:
        config_path = REPO / "hyperagent/builds/sources/clive-man-v0_4/ambient/ambient_config.py"
        src = config_path.read_text() + script_source()
        for fid in (FIELD_STATUS, FIELD_PROPOSED_BY_AGENT, FIELD_CAPTURE_SOURCE, CAPTURE_SOURCE_CHAT_SESSION):
            self.assertIn(fid, src)

    def test_cm_ha_016_tools_searchthreads_execute_only(self) -> None:
        data = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")["data"]
        tools = json.loads(data["toolSettings"])
        self.assertTrue(tools["searchthreads"])
        self.assertTrue(tools["execute-script"])
        self.assertFalse(tools["globalTablesEnabled"])
        for key, val in tools.items():
            if key in ("searchMode", "webpageGenerationModel", "slideGenerationModel"):
                continue
            if key in ("searchthreads", "execute-script"):
                continue
            if isinstance(val, bool):
                self.assertFalse(val, key)

    def test_cm_ha_017_no_fleet_roster_in_ambient(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        skill = _embedded_skills(export)[0]
        text = json.dumps(skill) + export["data"]["systemPrompt"]
        self.assertNotIn("astrajax-fleet-roster", text)
        self.assertNotIn("clive-man-proposer", text.lower())

    def test_cm_ha_018_no_five_row_cap(self) -> None:
        prompt = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")["data"]["systemPrompt"]
        self.assertNotIn("up to 5 rows", prompt.lower())
        self.assertNotIn("5 rows per tick", prompt.lower())

    def test_cm_ha_019_checkpoint_sentinel(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        blob = json.dumps(export)
        self.assertIn(CHECKPOINT_SENTINEL, blob)

    def test_cm_ha_020_disabled_schedule_omitted(self) -> None:
        data = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")["data"]
        self.assertEqual(data["scheduledInvocations"], [])
        contract = data.get("scheduleContract") or {}
        self.assertFalse(contract.get("importable", True))


class ChunkAndCapTest(unittest.TestCase):
    def test_cm_ha_021_thirty_seven_candidates_drain(self) -> None:
        result = simulate_chunk_drain(37)
        self.assertEqual(result["total_written"], 37)

    def test_cm_ha_022_interruption_resume(self) -> None:
        result = simulate_chunk_drain(37, interrupt_after=15)
        self.assertEqual(result["total_written"], 37)

    def test_cm_ha_023_cap_constants(self) -> None:
        self.assertIsNone(CAP_DAILY_MUTATIONS["intake"])
        self.assertEqual(CAP_DAILY_MUTATIONS["maintenance"], 5)
        self.assertEqual(CAP_FAILURES["intake"], 2)
        self.assertEqual(CHAT_BACKFILL_CLEAR_CAP, 1)


class ScheduledFamilyTest(unittest.TestCase):
    def test_cm_ha_024_context_schedules_060708(self) -> None:
        mapping = {
            "agent-clive-man-context-auditor-v0_4.json": 6,
            "agent-clive-man-context-challenger-v0_4.json": 7,
            "agent-clive-man-context-executor-v0_4.json": 8,
        }
        for fname, hour in mapping.items():
            invocations = _read_json(EXPORTS_AGENTS / fname)["data"]["scheduledInvocations"]
            self.assertEqual(len(invocations), 1)
            self.assertIn(f"BYHOUR={hour}", invocations[0]["rrule"])
            self.assertEqual(invocations[0]["timezone"], "Europe/London")

    def test_cm_ha_024b_read_only_mode_metadata(self) -> None:
        specs = {
            ACTOR_AUDITOR: ("agent-clive-man-context-auditor-v0_4.json", False),
            ACTOR_CHALLENGER: ("agent-clive-man-context-challenger-v0_4.json", True),
            ACTOR_EXECUTOR: ("agent-clive-man-context-executor-v0_4.json", True),
        }
        for actor, (fname, expected_ro) in specs.items():
            inv = _read_json(EXPORTS_AGENTS / fname)["data"]["scheduledInvocations"][0]
            self.assertEqual(inv["readOnlyMode"], expected_ro, actor)
            self.assertEqual(SCHEDULE_CONTRACT[actor]["read_only_mode"], expected_ro)

    def test_cm_ha_025_no_legacy_paused_schedules(self) -> None:
        for path in EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"):
            blob = path.read_text(encoding="utf-8")
            for marker in LEGACY_SCHEDULE_MARKERS:
                self.assertNotIn(marker, blob, f"{path.name} contains {marker}")

    def test_cm_ha_026_head_no_schedule(self) -> None:
        inv = _read_json(EXPORTS_AGENTS / "agent-clive-man-v0_4.json")["data"]["scheduledInvocations"]
        self.assertEqual(inv, [])

    def test_cm_ha_027_on_demand_executor_no_schedule(self) -> None:
        inv = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")["data"]["scheduledInvocations"]
        self.assertEqual(inv, [])


class ExecutorRemovalTest(unittest.TestCase):
    def test_cm_ha_028_no_context_amendment_execute_skill(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")
        skill_names = [s.get("name", "") for s in export["data"].get("skills") or []]
        self.assertNotIn("Context Amendment Execute", skill_names)
        self.assertNotIn("context-amendment-execute", [n.lower() for n in skill_names])

    def test_cm_ha_029_no_context_config_script(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")
        for skill in export["data"].get("skills") or []:
            scripts = skill.get("scripts")
            if scripts:
                self.assertNotIn("context_config.py", scripts)

    def test_cm_ha_030_no_context_amendment_execute_schema(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")
        for skill in export["data"].get("skills") or []:
            blob = json.dumps(skill)
            self.assertNotIn("CONTEXT_AMENDMENT_EXECUTE", blob)

    def test_cm_ha_031_lane_a_b_documented(self) -> None:
        prompt = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")["data"]["systemPrompt"]
        self.assertIn("Lane A", prompt)
        self.assertIn("Lane B", prompt)


class ContextChallengerTest(unittest.TestCase):
    def test_cm_ha_032_actor_agnostic_query_doc(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-context-challenger-v0_4.json")
        prompt = export["data"]["systemPrompt"]
        self.assertIn("Stage=V1", prompt)
        self.assertIn("actor-agnostic", prompt.lower())
        self.assertIn("_events_for_amendment", prompt)

    def test_cm_ha_033_maintenance_cap_five(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-context-challenger-v0_4.json")
        self.assertIn("maintenanceCap", json.dumps(export["data"]))
        skill = (REPO / ".cursor/skills/clive-man-context-challenger/SKILL.md").read_text()
        self.assertIn("5", skill)


class ArchiveAndSupersessionTest(unittest.TestCase):
    def test_cm_ha_034_v0_1_exports_not_active(self) -> None:
        for name in (
            "agent-clive-man-v0_1.json",
            "agent-clive-man-ambient-capture-v0_1.json",
        ):
            self.assertFalse((EXPORTS_AGENTS / name).exists(), name)

    def test_cm_ha_035_v0_1_archived(self) -> None:
        archive = REPO / "hyperagent" / "exports" / "archive" / "agents"
        self.assertTrue((archive / "agent-clive-man-v0_1.json").exists())

    def test_cm_ha_036_old_generators_archived(self) -> None:
        builds_archive = BUILDS / "archive"
        self.assertTrue((builds_archive / "build_clive_man_family_v0_1.py").exists())


class PersonaProvenanceTest(unittest.TestCase):
    def test_cm_ha_037_head_carries_persona_hash(self) -> None:
        data = _read_json(EXPORTS_AGENTS / "agent-clive-man-v0_4.json")["data"]
        self.assertEqual(data["personaConfigRecordId"], PERSONA_V04_RECORD_ID)
        self.assertRegex(data["personaConfigSha256"], r"^[0-9a-f]{64}$")


class SecurityAndEvidenceTest(unittest.TestCase):
    def test_cm_ha_038_no_secret_leakage_in_exports(self) -> None:
        secret_patterns = (
            r"pat[A-Za-z0-9]{10,}",
            r"sk-[A-Za-z0-9]{20,}",
            r"AIRTABLE_[A-Z_]*TOKEN\s*=\s*['\"][^'\"]+['\"]",
        )
        for path in EXPORTS_AGENTS.glob("agent-clive-man*v0_4.json"):
            text = path.read_text(encoding="utf-8")
            for pat in secret_patterns:
                self.assertIsNone(re.search(pat, text), f"{path.name} matches {pat}")

    def test_cm_ha_038b_observed_live_manifest(self) -> None:
        manifest = REPO / "agents/registry/hyperagent/clive/man/observed-live/2026-08-12/MANIFEST.json"
        self.assertTrue(manifest.is_file())
        data = json.loads(manifest.read_text())
        self.assertEqual(len(data["files"]), 8)
        self.assertIn("historical daily brief", data["provenance_gaps"][0])


class SpecialistCapabilityTest(unittest.TestCase):
    def test_cm_ha_039_scheduled_skills_executable(self) -> None:
        expected = {
            "agent-clive-man-context-auditor-v0_4.json": (
                "Context Estate Audit & Propose",
                ("context_config.py", "context_estate_audit_propose.py"),
                ("CONTEXT_ESTATE_READ", "CONTEXT_V1_CONTROL_WRITE"),
            ),
            "agent-clive-man-context-challenger-v0_4.json": (
                "Context Estate Challenge",
                ("context_config.py", "context_estate_challenge.py"),
                ("CONTEXT_CHALLENGE_READ", "CONTEXT_V2_CONTROL_WRITE"),
            ),
            "agent-clive-man-context-executor-v0_4.json": (
                "Context Amendment Execute",
                ("context_config.py", "context_amendment_execute.py"),
                ("CONTEXT_AMENDMENT_EXECUTE",),
            ),
        }
        for fname, (skill_name, script_names, creds) in expected.items():
            export = _read_json(EXPORTS_AGENTS / fname)
            skill = _skill_by_name(export, skill_name)
            self.assertIsNotNone(skill, fname)
            assert skill is not None
            self.assertEqual(skill["authType"], "api_key")
            self.assertTrue(skill.get("credentialSchema"))
            scripts = _parse_scripts(skill)
            filenames = {s["filename"] for s in scripts}
            for sn in script_names:
                self.assertIn(sn, filenames)
                content = next(s["content"] for s in scripts if s["filename"] == sn)
                self.assertTrue(len(content) > 100, sn)
            main_script = script_names[-1]
            main_content = next(s["content"] for s in scripts if s["filename"] == main_script)
            self.assertIn("def ", main_content)
            blob = skill["credentialSchema"]
            for cred in creds:
                self.assertIn(cred, blob)

    def test_cm_ha_040_ambient_skill_http_pen(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        skill = _embedded_skills(export)[0]
        self.assertEqual(skill["authType"], "api_key")
        self.assertIn(CRED_AMBIENT_V1_CREATE, skill["credentialSchema"])
        scripts = _parse_scripts(skill)
        self.assertTrue(any(s["filename"] == "ambient_v1_intake.py" for s in scripts))
        intake = next(s["content"] for s in scripts if s["filename"] == "ambient_v1_intake.py")
        self.assertIn("urllib.request", intake)
        self.assertIn(CRED_AMBIENT_V1_CREATE, intake)

    def test_cm_ha_041_on_demand_read_only_proposer_challenger(self) -> None:
        for slug in ("proposer", "challenger"):
            export = _read_json(EXPORTS_AGENTS / f"agent-clive-man-{slug}-v0_4.json")
            skill = _embedded_skills(export)[0]
            self.assertEqual(skill["authType"], "api_key")
            self.assertIn(CRED_CLIVE_MAN_WORKSHOP_READ, skill["credentialSchema"])
            scripts = _parse_scripts(skill)
            self.assertTrue(any(s["filename"] == "clive_man_workshop_read.py" for s in scripts))
            self.assertNotIn(CRED_CLIVE_MAN_ON_DEMAND_WRITE, skill.get("credentialSchema") or "")

    def test_cm_ha_042_on_demand_executor_own_pen(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-executor-v0_4.json")
        skill = _embedded_skills(export)[0]
        self.assertIn(CRED_CLIVE_MAN_ON_DEMAND_WRITE, skill["credentialSchema"])
        scripts = _parse_scripts(skill)
        self.assertTrue(any(s["filename"] == "clive_man_on_demand_executor.py" for s in scripts))
        contaminated = (
            "CONTEXT_AMENDMENT_EXECUTE",
            "CONTEXT_ESTATE_READ",
            "CONTEXT_V1_CONTROL_WRITE",
            "CONTEXT_CHALLENGE_READ",
            "CONTEXT_V2_CONTROL_WRITE",
        )
        skill_blob = json.dumps(skill)
        for cred in contaminated:
            self.assertNotIn(cred, skill_blob)

    def test_cm_ha_043_head_no_write_or_scheduled_creds(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-v0_4.json")
        blob = json.dumps(export)
        for cred in (
            CRED_AMBIENT_V1_CREATE,
            CRED_CLIVE_MAN_ON_DEMAND_WRITE,
            "CONTEXT_AMENDMENT_EXECUTE",
        ):
            self.assertNotIn(cred, blob)
        self.assertIn(CRED_CLIVE_MAN_WORKSHOP_READ, export["data"]["systemPrompt"])


HOUSEHOLD_SKILL_NAMES = (
    "Household Communication Standard",
    "Household Routing Standard",
    "Household Conduct Standard",
    "Household Activity Logging",
)


class HouseholdSkillsTest(unittest.TestCase):
    def test_cm_ha_044_all_agents_embed_four_household_skills(self) -> None:
        for name in AGENT_EXPORTS:
            export = _read_json(EXPORTS_AGENTS / name)
            embedded = {s.get("name") for s in _embedded_skills(export)}
            for hs in HOUSEHOLD_SKILL_NAMES:
                self.assertIn(hs, embedded, f"{name} missing {hs}")

    def test_cm_ha_045_ambient_only_household_plus_intake(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        names = {s.get("name") for s in _embedded_skills(export)}
        self.assertTrue(names.issuperset(HOUSEHOLD_SKILL_NAMES))
        self.assertIn("clive-man-ambient-capture", names)
        forbidden = {
            "Clive's Man",
            "Context Estate Audit & Propose",
            "Context Estate Challenge",
            "Context Amendment Execute",
        }
        self.assertFalse(names & forbidden, f"ambient must not embed fleet head/PCE skills: {names & forbidden}")

    def test_cm_ha_046_activity_logging_credential_schema(self) -> None:
        export = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        skill = _skill_by_name(export, "Household Activity Logging")
        self.assertIsNotNone(skill)
        assert skill is not None
        schema_blob = json.dumps(skill.get("credentialSchema") or [])
        self.assertIn("FLEET_ACTIVITY_WRITE", schema_blob)
        self.assertNotRegex(schema_blob, r"pat[A-Za-z0-9]{10,}")

    def test_cm_ha_047_routing_standard_option3_embedded(self) -> None:
        sys.path.insert(0, str(BUILDS))
        from _clive_man_household_loader import household_skill_embeds  # noqa: E402

        routing = next(
            e for e in household_skill_embeds() if e["name"] == "Household Routing Standard"
        )
        body = routing.get("skillMdBody") or ""
        self.assertIn("Lane A (direct Executor)", body)
        self.assertIn("@clive-man", body)
        self.assertNotIn("cmr6w20tg1ng407adunjmxnge", body)
        ambient = _read_json(EXPORTS_AGENTS / "agent-clive-man-ambient-capture-v0_4.json")
        ambient_prompt = ambient["data"]["systemPrompt"]
        self.assertIn("Activity Logging", ambient_prompt)
        self.assertIn("v1_report_record_id", ambient_prompt)


if __name__ == "__main__":
    unittest.main(verbosity=2)
