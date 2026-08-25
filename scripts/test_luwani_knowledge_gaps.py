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

    def test_tag_turn_matches_need_keywords_and_skips_developer_knowhow(self) -> None:
        tags = self.mod.tag_turn("Approve this and green go — then execute.")
        self.assertIn("trinity_gates", tags)
        self.assertEqual(self.mod.tag_turn(""), [])
        self.assertEqual(
            self.mod.tag_turn("Please add Playwright coverage for the CSS"),
            [],
        )

    def test_human_turns_from_activity_window_and_session_end_skip(self) -> None:
        window_start = self.mod.dt.datetime(2026, 8, 12, tzinfo=self.mod.dt.timezone.utc)
        window_end = self.mod.dt.datetime(2026, 8, 19, tzinfo=self.mod.dt.timezone.utc)
        fields = self.mod.ACTIVITY_FIELDS
        activity = [
            {
                "id": "rec-in",
                "fields": {
                    fields["turn_started"]: "2026-08-15T10:00:00.000Z",
                    fields["user_message"]: "Log this decision for the next thread.",
                    fields["human_quality"]: 4,
                    fields["review_status"]: {"name": "Reviewed"},
                    fields["user_turn_type"]: {"name": "Brief"},
                },
            },
            {
                "id": "rec-end",
                "fields": {
                    fields["turn_started"]: "2026-08-15T11:00:00.000Z",
                    fields["user_message"]: "Closing out.",
                    fields["agent_turn_type"]: {"name": "Session End"},
                },
            },
            {
                "id": "rec-out",
                "fields": {
                    fields["turn_started"]: "2026-08-01T10:00:00.000Z",
                    fields["user_message"]: "Just ship it without asking.",
                },
            },
            {
                "id": "rec-blank",
                "fields": {
                    fields["turn_started"]: "2026-08-15T12:00:00.000Z",
                    fields["user_message"]: "   ",
                },
            },
        ]
        turns = self.mod.human_turns_from_activity(
            activity, window_start=window_start, window_end=window_end,
        )
        self.assertEqual([row["record_id"] for row in turns], ["rec-in"])
        self.assertIn("capture", turns[0]["topics"])
        self.assertFalse(turns[0]["dispatch_brief"])

    def test_build_pack_counts_and_quiet_flag(self) -> None:
        window_start = self.mod.dt.datetime(2026, 8, 12, tzinfo=self.mod.dt.timezone.utc)
        window_end = self.mod.dt.datetime(2026, 8, 19, tzinfo=self.mod.dt.timezone.utc)
        turns = [
            {
                "developer_knowhow": False,
                "dispatch_brief": False,
                "topics": ["trinity_gates"],
                "human_quality": 2,
                "user_ask": "Just ship it.",
                "user_turn_type": "Brief",
                "review_status": "Reviewed",
            },
            {
                "developer_knowhow": False,
                "dispatch_brief": False,
                "topics": ["trinity_gates"],
                "human_quality": 3,
                "user_ask": "Green go.",
                "user_turn_type": "Decision",
                "review_status": "Unreviewed",
            },
            {
                "developer_knowhow": True,
                "dispatch_brief": False,
                "topics": [],
                "human_quality": 2,
                "user_ask": "Add Playwright.",
                "user_turn_type": "Brief",
                "review_status": "Reviewed",
            },
        ]
        pack = self.mod.build_pack(
            turns=turns,
            operator=self.mod.HOUSEHOLD_OPERATOR,
            window_start=window_start,
            window_end=window_end,
        )
        self.assertEqual(pack["human_turn_count"], 3)
        self.assertEqual(pack["excluded_developer_count"], 1)
        self.assertEqual(pack["unreviewed_count"], 1)
        self.assertFalse(pack["quiet"])
        self.assertEqual(pack["gaps"][0]["topic"], "trinity_gates")
        self.assertEqual(pack["operator"]["user_label"], "Matthew")

    def test_prior_luwani_index_filters_other_agents(self) -> None:
        fields = self.mod.REPORTS_FIELDS
        rows = self.mod.prior_luwani_index([
            {
                "id": "rec-luwani",
                "fields": {
                    fields["agent_slug"]: "luwani",
                    fields["title"]: "Week of gaps",
                    fields["headline"]: "Gates still soft",
                    fields["period_end"]: "2026-08-19",
                },
            },
            {
                "id": "rec-other",
                "fields": {
                    fields["agent_slug"]: "ristral",
                    fields["title"]: "Scout note",
                },
            },
        ])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["record_id"], "rec-luwani")
        self.assertEqual(rows[0]["title"], "Week of gaps")


if __name__ == "__main__":
    unittest.main()
