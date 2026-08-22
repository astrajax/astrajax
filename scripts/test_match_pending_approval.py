#!/usr/bin/env python3
"""Offline unit tests for Self-Update / Skill Forge pending-approval matching.

Wrong match or a silent miss on canResolve=false would approve the wrong
draft_save (or skip restore) on a live HyperAgent apply.
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = (
    REPO
    / ".cursor"
    / "skills"
    / "self-update-executor"
    / "scripts"
    / "match_pending_approval.py"
)


def _load():
    # Unique module name so this stays isolated from Skill Forge imports.
    spec = importlib.util.spec_from_file_location(
        "match_pending_approval_coverage",
        SCRIPT,
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class MatchPendingApprovalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_matches_first_resolvable_draft_save_by_target_name(self) -> None:
        pending = {
            "approvals": [
                {
                    "kind": "draft_save",
                    "approvalId": "apr_other",
                    "entity": "agent",
                    "canResolve": True,
                    "title": "Marcel",
                },
                {
                    "kind": "draft_save",
                    "approvalId": "apr_doc",
                    "entity": "agent",
                    "canResolve": True,
                    "title": "Doc Albright",
                },
            ]
        }
        result = self.m.match_draft_save(
            pending,
            target_name="Doc Albright",
            entity="agent",
            decision="approve",
        )
        self.assertTrue(result["matched"])
        self.assertEqual(result["match_count"], 1)
        self.assertEqual(
            result["resolve"],
            {
                "kind": "draft_save",
                "approvalId": "apr_doc",
                "decision": "approve",
            },
        )

    def test_skips_non_draft_save_kinds(self) -> None:
        pending = [
            {
                "kind": "tool_call",
                "approvalId": "apr_tool",
                "canResolve": True,
                "title": "Doc Albright",
            }
        ]
        result = self.m.match_draft_save(
            pending,
            target_name="Doc Albright",
            decision="approve",
        )
        self.assertFalse(result["matched"])
        self.assertIsNone(result["resolve"])

    def test_entity_filter_rejects_skill_when_agent_requested(self) -> None:
        pending = {
            "rows": [
                {
                    "kind": "draft_save",
                    "approval_id": "apr_skill",
                    "entity": "skill",
                    "canResolve": True,
                    "label": "Doc Albright helpers",
                }
            ]
        }
        result = self.m.match_draft_save(
            pending,
            target_name="Doc Albright",
            entity="agent",
            decision="approve",
        )
        self.assertFalse(result["matched"])

    def test_unresolvable_row_sets_break_glass_hint(self) -> None:
        pending = {
            "items": [
                {
                    "type": "draft_save",
                    "id": "apr_locked",
                    "can_resolve": False,
                    "entity": "agent",
                    "name": "Doc Albright",
                }
            ]
        }
        result = self.m.match_draft_save(
            pending,
            target_name="Doc Albright",
            entity="agent",
            decision="approve",
        )
        self.assertFalse(result["matched"])
        self.assertEqual(len(result["skipped_unresolvable"]), 1)
        self.assertIn("canResolve is false", result["break_glass"])

    def test_deny_decision_is_echoed_in_resolve_args(self) -> None:
        pending = [
            {
                "kind": "draft_save",
                "approvalId": "apr_restore",
                "canResolve": True,
                "entity": "skill",
                "title": "clive-man",
            }
        ]
        result = self.m.match_draft_save(
            pending,
            target_name="clive-man",
            entity="skill",
            decision="deny",
        )
        self.assertTrue(result["matched"])
        self.assertEqual(result["resolve"]["decision"], "deny")

    def test_invalid_decision_is_refused(self) -> None:
        with self.assertRaises(ValueError):
            self.m.match_draft_save(
                [],
                target_name="Doc",
                decision="maybe",
            )


class SkillForgeRefuseReasonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        forge = (
            REPO
            / ".cursor"
            / "skills"
            / "skill-forge-executor"
            / "scripts"
            / "verify_skill_forge.py"
        )
        spec = importlib.util.spec_from_file_location(
            "verify_skill_forge_coverage",
            forge,
        )
        assert spec and spec.loader
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        cls.forge = mod

    def test_refuse_triggers_block_unattended_paths(self) -> None:
        self.assertIn("slack", self.forge.refuse_reason(trigger="Slack") or "")
        self.assertIn("schedule", self.forge.refuse_reason(trigger="schedule") or "")
        self.assertIsNone(self.forge.refuse_reason(trigger="interactive"))

    def test_refuse_invented_and_autosave_gates(self) -> None:
        self.assertIn("invent", self.forge.refuse_reason(invented=True) or "")
        self.assertIn(
            "auto-save",
            self.forge.refuse_reason(enable_autosave=True) or "",
        )
        self.assertIn(
            "Self-Update",
            self.forge.refuse_reason(agent_identity=True) or "",
        )


if __name__ == "__main__":
    unittest.main()
