#!/usr/bin/env python3
"""Discoverable tests for Luwani knowledge-gap helper."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "hyperagent" / "scripts" / "luwani_knowledge_gaps.py"


def _load():
    spec = importlib.util.spec_from_file_location("luwani_knowledge_gaps", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class LuwaniKnowledgeGapsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = _load()

    def test_self_test_passes(self) -> None:
        self.mod._self_test()

    def test_developer_knowhow_is_out_of_scope(self) -> None:
        self.assertTrue(self.mod.is_developer_knowhow("Please add Playwright coverage"))
        self.assertTrue(self.mod.is_developer_knowhow("fix the CSS on the wall"))
        self.assertFalse(
            self.mod.is_developer_knowhow("Approve this, then Doc can build.")
        )

    def test_need_is_citizen_builder_not_engineering(self) -> None:
        topics = self.mod.need_topics_for_operator({
            "archetype": "Founder",
            "primary_function": "Sales",
            "citizen_builder": True,
        })
        self.assertIn("trinity_gates", topics)
        self.assertIn("briefing", topics)
        self.assertIn("capture", topics)
        self.assertNotIn("typescript", topics)

    def test_one_messy_question_is_not_a_gap(self) -> None:
        gaps = self.mod.select_gaps(
            [{
                "developer_knowhow": False,
                "topics": ["briefing"],
                "human_quality": 3,
                "user_ask": "Can you look at this?",
                "user_turn_type": "Question",
                "review_status": "Reviewed",
            }],
            need_topics=["briefing"],
        )
        self.assertEqual(gaps, [])

    def test_clustered_low_scores_on_a_need_topic_are_a_gap(self) -> None:
        gaps = self.mod.select_gaps(
            [
                {
                    "developer_knowhow": False,
                    "topics": ["trinity_gates"],
                    "human_quality": 2,
                    "user_ask": "Just ship it.",
                    "user_turn_type": "Brief",
                    "review_status": "Reviewed",
                },
                {
                    "developer_knowhow": False,
                    "topics": ["trinity_gates"],
                    "human_quality": 3,
                    "user_ask": "Green go, skip the gate.",
                    "user_turn_type": "Decision",
                    "review_status": "Reviewed",
                },
            ],
            need_topics=["trinity_gates", "briefing"],
        )
        self.assertEqual(len(gaps), 1)
        self.assertEqual(gaps[0]["topic"], "trinity_gates")
        self.assertEqual(gaps[0]["evidence_count"], 2)

    def test_dispatch_briefs_are_not_operator_gaps(self) -> None:
        gaps = self.mod.select_gaps(
            [
                {
                    "developer_knowhow": False,
                    "dispatch_brief": True,
                    "topics": [],
                    "human_quality": 2,
                    "user_ask": "You are Clive's Man. Load the skill.",
                    "user_turn_type": "Brief",
                    "review_status": "Reviewed",
                },
                {
                    "developer_knowhow": False,
                    "dispatch_brief": True,
                    "topics": [],
                    "human_quality": 2,
                    "user_ask": "You are Doc. Phase B.",
                    "user_turn_type": "Brief",
                    "review_status": "Reviewed",
                },
            ],
            need_topics=["briefing", "trinity_gates"],
        )
        self.assertEqual(gaps, [])
        self.assertTrue(self.mod.is_dispatch_brief(
            "You are Clive's Man. Load `clive-man` skill.\n\n## Goal\nFile draft truth."
        ))
        self.assertTrue(self.mod.is_dispatch_brief(
            "Route 1. Doc just locked Skill Forge. File draft truth."
        ))
        self.assertFalse(self.mod.is_dispatch_brief("Can you make the wall letter shorter?"))

    def test_unused_need_topics_are_not_invented(self) -> None:
        gaps = self.mod.select_gaps(
            [
                {
                    "developer_knowhow": False,
                    "topics": ["briefing"],
                    "human_quality": 2,
                    "user_ask": "Can you make this?",
                    "user_turn_type": "Brief",
                    "review_status": "Reviewed",
                },
                {
                    "developer_knowhow": False,
                    "topics": ["briefing"],
                    "human_quality": 2,
                    "user_ask": "Dispatch Doc on the wall copy.",
                    "user_turn_type": "Brief",
                    "review_status": "Reviewed",
                },
            ],
            need_topics=["briefing", "model_routing", "capture"],
        )
        self.assertEqual([gap["topic"] for gap in gaps], ["briefing"])


if __name__ == "__main__":
    unittest.main()
