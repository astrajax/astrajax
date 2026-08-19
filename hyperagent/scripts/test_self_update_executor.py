#!/usr/bin/env python3
"""Offline tests for Self-Update Executor verify + hosted MCP handoff."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

SKILL_SCRIPTS = (
    Path(__file__).resolve().parents[2]
    / ".cursor"
    / "skills"
    / "self-update-executor"
    / "scripts"
)
sys.path.insert(0, str(SKILL_SCRIPTS))

import hosted_mcp_handoff  # noqa: E402
import match_pending_approval  # noqa: E402
import verify_self_update  # noqa: E402


def _state(**overrides: object) -> dict:
    payload = {
        "name": "Doc Albright",
        "description": "Dispatcher",
        "systemPrompt": "new prompt",
        "toolSettings": {"searchMode": "native"},
        "allowedIntegrations": [],
        "skillScope": "selected",
        "skillLoadMode": "preload",
        "modelId": "opus-latest",
        "effort": "max",
        "maxThinkingTokens": 32000,
        "autoSaveMemories": False,
        "autoSaveSkills": False,
        "autoSaveAgents": False,
        "autoSavePrompts": False,
        "enableMemorySuggestions": False,
        "enableSkillSuggestions": False,
        "enablePromptSuggestions": False,
        "skills": [
            {
                "name": "Self-Update Executor",
                "description": "method",
                "whenToUse": "Cursor thread",
                "documentation": "# skill",
                "scripts": None,
                "tags": ["astrajax"],
                "authType": "none",
            }
        ],
    }
    payload.update(overrides)
    return payload


def _thread(before: dict, after: dict) -> str:
    return (
        "intro\n"
        f"{verify_self_update.BEFORE_MARKER}\n```json\n"
        f"{json.dumps(before)}\n```\n"
        f"{verify_self_update.AFTER_MARKER}\n```json\n"
        f"{json.dumps(after)}\n```\n"
    )


class RefuseContractTest(unittest.TestCase):
    def test_refuses_unattended_triggers(self) -> None:
        for trigger in ("slack", "schedule", "live", "webhook", "email", "unattended"):
            reason = verify_self_update.refuse_reason(trigger=trigger)
            self.assertIsNotNone(reason, trigger)

    def test_refuses_invented_and_other_agent(self) -> None:
        self.assertIn("invent", verify_self_update.refuse_reason(invented=True) or "")
        self.assertIn("different agent", verify_self_update.refuse_reason(other_agent=True) or "")
        self.assertIn(
            "auto-save",
            verify_self_update.refuse_reason(enable_memory_skill_prompt_autosave=True) or "",
        )


class VerifySelfUpdateTest(unittest.TestCase):
    def test_pass_when_after_matches_brief(self) -> None:
        after = _state()
        result = verify_self_update.verify(
            thread=_thread(_state(systemPrompt="old"), after),
            brief={"target_agent_name": "Doc Albright", "expected": {"systemPrompt": "new prompt"}},
        )
        self.assertTrue(result["pass"], result["errors"])

    def test_fail_on_mismatch_and_keep_before_for_restore(self) -> None:
        before = _state(systemPrompt="old")
        after = _state(systemPrompt="wrong")
        result = verify_self_update.verify(
            thread=_thread(before, after),
            brief={"target_agent_name": "Doc Albright", "expected": {"systemPrompt": "new prompt"}},
        )
        self.assertFalse(result["pass"])
        self.assertEqual(result["before"]["systemPrompt"], "old")

    def test_fail_if_memory_autosave_turned_on(self) -> None:
        after = _state(autoSaveMemories=True)
        result = verify_self_update.verify(
            thread=_thread(_state(), after),
            brief={"target_agent_name": "Doc Albright", "expected": {"systemPrompt": "new prompt"}},
        )
        self.assertFalse(result["pass"])
        self.assertTrue(any("autoSaveMemories" in err for err in result["errors"]))

    def test_fail_if_agent_autosave_turned_on(self) -> None:
        after = _state(autoSaveAgents=True)
        result = verify_self_update.verify(
            thread=_thread(_state(), after),
            brief={"target_agent_name": "Doc Albright", "expected": {"systemPrompt": "new prompt"}},
        )
        self.assertFalse(result["pass"])
        self.assertTrue(any("autoSaveAgents" in err for err in result["errors"]))

    def test_fail_if_after_is_a_different_agent(self) -> None:
        after = _state(name="Pam Portiscue")
        result = verify_self_update.verify(
            thread=_thread(_state(), after),
            brief={"target_agent_name": "Doc Albright", "expected": {"systemPrompt": "new prompt"}},
        )
        self.assertFalse(result["pass"])
        self.assertTrue(any("other-agent" in err for err in result["errors"]))


class HostedMcpHandoffTest(unittest.TestCase):
    def test_apply_message_is_self_contained(self) -> None:
        message = hosted_mcp_handoff.build_message(
            mode="apply",
            target_name="Doc Albright",
            payload={"expected": {"systemPrompt": "new"}},
        )
        self.assertIn("EXPECTED END-STATE", message)
        self.assertIn("yourself", message.lower())
        self.assertNotIn("custom MCP", message)

    def test_restore_carries_before_state(self) -> None:
        message = hosted_mcp_handoff.build_message(
            mode="restore",
            target_name="Doc Albright",
            payload={"before": {"systemPrompt": "old"}},
        )
        self.assertIn("RESTORE-TO", message)
        self.assertIn("old", message)

    def test_bootstrap_does_not_ask_matthew_to_pin(self) -> None:
        message = hosted_mcp_handoff.build_message(
            mode="bootstrap",
            target_name="Doc Albright",
            payload=None,
        )
        self.assertIn("Self-Update Executor", message)
        self.assertIn("draft_save", message)
        self.assertNotIn("pin twelve", message.lower())

    def test_cli_prints_hosted_mcp_only(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            json.dump({"expected": {"systemPrompt": "x"}}, handle)
            brief = Path(handle.name)
        try:
            import subprocess

            result = subprocess.run(
                [
                    sys.executable,
                    str(SKILL_SCRIPTS / "hosted_mcp_handoff.py"),
                    "--mode",
                    "apply",
                    "--target-name",
                    "Doc Albright",
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
        self.assertEqual(payload["hosted_mcp"], hosted_mcp_handoff.HOSTED_MCP)
        self.assertEqual(payload["cursor_server_name"], "hyperagent")
        self.assertEqual(payload["cursor_server_id"], "user-hyperagent")
        self.assertEqual(payload["cursor_mcp_config"], "~/.cursor/mcp.json")
        self.assertFalse(payload["custom_mcp"])
        self.assertEqual(len(payload["tools"]), 6)
        tool_names = [item["tool"] for item in payload["tools"]]
        self.assertIn("list_pending_approvals", tool_names)
        self.assertIn("resolve_approval", tool_names)


class MatchPendingApprovalTest(unittest.TestCase):
    def test_matches_resolvable_draft_save(self) -> None:
        pending = {
            "rows": [
                {
                    "kind": "draft_save",
                    "approvalId": "apd_skill",
                    "canResolve": True,
                    "entity": "skill",
                    "name": "Skill Forge Executor",
                },
                {
                    "kind": "draft_save",
                    "approvalId": "apd_agent",
                    "canResolve": True,
                    "entity": "agent_update",
                    "name": "Doc Albright",
                },
            ]
        }
        result = match_pending_approval.match_draft_save(
            pending, target_name="Doc Albright", entity="agent", decision="approve"
        )
        self.assertTrue(result["matched"])
        self.assertEqual(result["resolve"]["approvalId"], "apd_agent")
        self.assertEqual(result["resolve"]["kind"], "draft_save")
        self.assertEqual(result["resolve"]["decision"], "approve")

    def test_skips_unresolvable_and_flags_break_glass(self) -> None:
        pending = {
            "rows": [
                {
                    "kind": "draft_save",
                    "approvalId": "apd_stuck",
                    "canResolve": False,
                    "entity": "agent",
                    "name": "Doc Albright",
                }
            ]
        }
        result = match_pending_approval.match_draft_save(
            pending, target_name="Doc Albright", entity="agent"
        )
        self.assertFalse(result["matched"])
        self.assertIsNotNone(result["break_glass"])


if __name__ == "__main__":
    unittest.main()
