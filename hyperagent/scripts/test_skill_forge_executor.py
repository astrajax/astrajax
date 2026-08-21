#!/usr/bin/env python3
"""Offline tests for Skill Forge Executor verify + hosted MCP handoff."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import ModuleType

SKILL_SCRIPTS = (
    Path(__file__).resolve().parents[2]
    / ".cursor"
    / "skills"
    / "skill-forge-executor"
    / "scripts"
)
SELF_UPDATE_SCRIPTS = (
    Path(__file__).resolve().parents[2]
    / ".cursor"
    / "skills"
    / "self-update-executor"
    / "scripts"
)


def _load_script(module_name: str, path: Path) -> ModuleType:
    """Load by unique module name so Self-Update's same-named scripts cannot collide."""
    spec = importlib.util.spec_from_file_location(module_name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod


hosted_mcp_handoff = _load_script(
    "skill_forge_hosted_mcp_handoff", SKILL_SCRIPTS / "hosted_mcp_handoff.py"
)
verify_skill_forge = _load_script(
    "skill_forge_verify", SKILL_SCRIPTS / "verify_skill_forge.py"
)
match_pending_approval = _load_script(
    "skill_forge_match_pending_approval",
    SELF_UPDATE_SCRIPTS / "match_pending_approval.py",
)
fleet_sync = _load_script(
    "skill_forge_fleet_sync",
    Path(__file__).resolve().parent / "sync_hyperagent_fleet_to_airtable.py",
)


def _skill(**overrides: object) -> dict:
    payload = {
        "name": "Skill Forge Executor",
        "description": "method",
        "whenToUse": "Cursor skill job",
        "documentation": "# skill",
        "scripts": None,
        "tags": ["astrajax"],
        "authType": "none",
        "credentialSchema": None,
        "icon": "⚒️",
    }
    payload.update(overrides)
    return payload


def _thread(before: dict | str, after: dict) -> str:
    if isinstance(before, str):
        before_block = before
    else:
        before_block = f"```json\n{json.dumps(before)}\n```"
    return (
        "intro\n"
        f"{verify_skill_forge.BEFORE_MARKER}\n{before_block}\n"
        f"{verify_skill_forge.AFTER_MARKER}\n```json\n"
        f"{json.dumps(after)}\n```\n"
    )


class RefuseContractTest(unittest.TestCase):
    def test_refuses_unattended_and_identity(self) -> None:
        self.assertIn("invent", verify_skill_forge.refuse_reason(invented=True) or "")
        self.assertIn(
            "Self-Update",
            verify_skill_forge.refuse_reason(agent_identity=True) or "",
        )
        self.assertIn(
            "draft_save",
            verify_skill_forge.refuse_reason(enable_autosave=True) or "",
        )


class VerifySkillForgeTest(unittest.TestCase):
    def test_pass_when_after_matches_brief(self) -> None:
        after = _skill()
        result = verify_skill_forge.verify(
            thread=_thread(_skill(documentation="# old"), after),
            brief={
                "skill_name": "Skill Forge Executor",
                "expected": {"documentation": "# skill"},
            },
        )
        self.assertTrue(result["pass"], result["errors"])
        self.assertFalse(result["creating"])

    def test_accepts_none_creating_before(self) -> None:
        after = _skill()
        result = verify_skill_forge.verify(
            thread=_thread("none — creating", after),
            brief={
                "skill_name": "Skill Forge Executor",
                "expected": {"name": "Skill Forge Executor"},
            },
        )
        self.assertTrue(result["pass"], result["errors"])
        self.assertTrue(result["creating"])

    def test_fail_on_mismatch_and_keep_before_for_restore(self) -> None:
        before = _skill(documentation="# old")
        after = _skill(documentation="# wrong")
        result = verify_skill_forge.verify(
            thread=_thread(before, after),
            brief={
                "skill_name": "Skill Forge Executor",
                "expected": {"documentation": "# skill"},
            },
        )
        self.assertFalse(result["pass"])
        self.assertEqual(result["before"]["documentation"], "# old")


class HostedMcpHandoffTest(unittest.TestCase):
    def test_apply_targets_skill_forge_only(self) -> None:
        message = hosted_mcp_handoff.build_message(
            mode="apply",
            payload={"expected": {"name": "Skill Forge Executor"}},
        )
        self.assertIn("EXPECTED SKILL END-STATE", message)
        self.assertIn("cmr6im5in1iw106ad59qx2cgr", message)
        self.assertIn("draft_save", message)
        self.assertNotIn("custom MCP", message)

    def test_cli_prints_hosted_mcp_persist_tools(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump({"expected": {"name": "X"}}, handle)
            brief = Path(handle.name)
        try:
            import subprocess

            result = subprocess.run(
                [
                    sys.executable,
                    str(SKILL_SCRIPTS / "hosted_mcp_handoff.py"),
                    "--mode",
                    "apply",
                    "--brief",
                    str(brief),
                ],
                capture_output=True,
                text=True,
                check=True,
            )
        finally:
            brief.unlink()
        payload = json.loads(result.stdout)
        self.assertEqual(payload["target_id"], "cmr6im5in1iw106ad59qx2cgr")
        self.assertFalse(payload["custom_mcp"])
        tool_names = [item["tool"] for item in payload["tools"]]
        self.assertIn("list_pending_approvals", tool_names)
        self.assertIn("resolve_approval", tool_names)


class PersistAndWriterTest(unittest.TestCase):
    def test_skill_draft_match_is_shared_matcher(self) -> None:
        pending = {
            "rows": [
                {
                    "kind": "draft_save",
                    "approvalId": "apd_skill",
                    "canResolve": True,
                    "entity": "skill",
                    "name": "Household Activity Logging",
                }
            ]
        }
        result = match_pending_approval.match_draft_save(
            pending,
            target_name="Household Activity Logging",
            entity="skill",
            decision="approve",
        )
        self.assertEqual(result["resolve"]["approvalId"], "apd_skill")

    def test_skill_only_payload_does_not_require_system_prompt(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump(
                {
                    "kind": "skill",
                    "phase": "before",
                    "change_source": "Matthew Directed",
                    "skills": [{"name": "Skill Forge Executor", "documentation": "# skill"}],
                },
                handle,
            )
            path = Path(handle.name)
        try:
            payload = fleet_sync.load_verify_pass_payload(path)
        finally:
            path.unlink()
        self.assertEqual(payload["kind"], "skill")
        self.assertEqual(payload["phase"], "before")
        self.assertEqual(payload["slug"], "skill-forge-executor")
        self.assertIn("before-snapshot", payload["what_changed"])


if __name__ == "__main__":
    unittest.main()
