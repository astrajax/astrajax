#!/usr/bin/env python3
"""Guard the dispatch-ticket contract in Household Activity Logging.

Halvard's 2026-08-19 equip: a child session (Parent Session ID filled) must
record the verbatim brief it was dispatched with as its first-turn User Message,
or agent-to-agent prompting cannot be read, let alone scored. Several real
chains (Clive's Man to Executor, Doc to Workshop Challenger, Clive to Ruth)
logged Action and Reports rows and no User Message at all.

These tests pin the two halves of the fix:
  1. the pen refuses a child Sessions row with no dispatch_ticket, and fills the
     first Activity row itself when the ticket is supplied;
  2. the agent-to-agent marker is Parent Session ID plus a first-turn User
     Message — never User Turn Type = "Brief", which is mostly Matthew briefing
     a head.

No network: only validation and row derivation are exercised.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import re
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LOGGER = REPO / "hyperagent" / "scripts" / "log_fleet_activity.py"
SCRIPT_MIRRORS = (
    REPO / ".cursor" / "skills" / "fleet-activity-logging" / "scripts" / "log_fleet_activity.py",
    REPO / ".claude" / "skills" / "fleet-activity-logging" / "scripts" / "log_fleet_activity.py",
)
SKILL_MIRRORS = (
    REPO / ".cursor" / "skills" / "fleet-activity-logging" / "SKILL.md",
    REPO / ".claude" / "skills" / "fleet-activity-logging" / "SKILL.md",
)


def _load_pen():
    spec = importlib.util.spec_from_file_location("log_fleet_activity", LOGGER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pen = _load_pen()

CHILD_SESSION = {
    "session_id": "clive-man-executor--20260819T0704Z--x1",
    "parent_session_id": "clive-man--20260819T0702Z--t1sm",
    "agent_slug": "clive-man-executor",
    "agent_name": "Clive's Man Executor",
    "runtime": "Hyperagent",
    "trigger": "Interactive",
    "user": "Matthew",
    "thread_url": "https://example.invalid/thread",
    "model": "moonshotai/kimi-k3",
}
TICKET = "Capture the two Draft Brain Truth rows from the 2026-08-19 consult."


def _session(**overrides):
    record = dict(CHILD_SESSION)
    record.update(overrides)
    return record


def _activity(**overrides):
    record = {
        "event_id": "evt-clive-man-executor-20260819-101",
        "sequence": 1,
        "session_id": CHILD_SESSION["session_id"],
        "model": CHILD_SESSION["model"],
    }
    record.update(overrides)
    return record


class RefusalMixin:
    def refusal(self, table, records, session_record_id="recSESSION1234567"):
        """Run the validator expecting a refusal; return its error payload."""
        captured = io.StringIO()
        with contextlib.redirect_stderr(captured):
            with self.assertRaises(SystemExit):
                pen.validate_and_default(table, records, session_record_id)
        return json.loads(captured.getvalue())["error"]

    def refusal_text(self, table, records, **kwargs):
        return json.dumps(self.refusal(table, records, **kwargs))


class ChildSessionTicketTest(RefusalMixin, unittest.TestCase):
    def test_child_session_without_ticket_is_refused(self) -> None:
        text = self.refusal_text("sessions", [_session()])
        self.assertIn("dispatch_ticket", text)
        self.assertIn("first-turn User Message", text)

    def test_child_session_with_ticket_fills_first_turn_user_message(self) -> None:
        rows, tickets = pen.validate_and_default(
            "sessions", [_session(dispatch_ticket=TICKET)], None
        )
        self.assertEqual(len(tickets), 1)
        ticket = tickets[0]
        self.assertIsNotNone(ticket)
        self.assertEqual(ticket[pen.ACTIVITY_MAP["user_message"]], TICKET)
        self.assertEqual(ticket[pen.ACTIVITY_MAP["sequence"]], 0)
        self.assertEqual(ticket[pen.ACTIVITY_MAP["session_id"]],
                         CHILD_SESSION["session_id"])
        self.assertEqual(ticket[pen.ACTIVITY_MAP["model"]], CHILD_SESSION["model"])
        self.assertEqual(ticket[pen.ACTIVITY_MAP["context_referenced"]],
                         pen.TICKET_DEFAULT_CONTEXT)
        self.assertEqual(
            ticket[pen.ACTIVITY_MAP["event_id"]],
            "evt-clive-man-executor-20260819-ticket-x1",
        )
        # Untyped and reply-free: AI keeps the turn types, reviewers keep scores.
        self.assertNotIn(pen.ACTIVITY_MAP["event_type"], ticket)
        self.assertNotIn(pen.ACTIVITY_MAP["reply_digest"], ticket)
        for reviewer_field in pen.REVIEWER_ONLY_IDS:
            self.assertNotIn(reviewer_field, ticket)
        # The Sessions row itself never carries the pen-only ticket keys.
        self.assertNotIn("dispatch_ticket", rows[0])
        self.assertEqual(rows[0][pen.SESSIONS_MAP["session_id"]],
                         CHILD_SESSION["session_id"])

    def test_ticket_overrides_are_honoured(self) -> None:
        _rows, tickets = pen.validate_and_default(
            "sessions",
            [_session(dispatch_ticket=TICKET,
                      dispatch_ticket_event_id="evt-custom-20260819-1",
                      dispatch_ticket_sequence=3,
                      dispatch_ticket_context="skill:clive-man-executor")],
            None,
        )
        ticket = tickets[0]
        self.assertEqual(ticket[pen.ACTIVITY_MAP["event_id"]], "evt-custom-20260819-1")
        self.assertEqual(ticket[pen.ACTIVITY_MAP["sequence"]], 3)
        self.assertEqual(ticket[pen.ACTIVITY_MAP["context_referenced"]],
                         "skill:clive-man-executor")

    def test_root_session_keeps_working_and_refuses_a_ticket(self) -> None:
        root = _session()
        root.pop("parent_session_id")
        rows, tickets = pen.validate_and_default("sessions", [root], None)
        self.assertEqual(tickets, [None])
        # Unchanged pure default: a root session is its own root.
        self.assertEqual(rows[0][pen.SESSIONS_MAP["root_session_id"]],
                         CHILD_SESSION["session_id"])
        root["dispatch_ticket"] = TICKET
        self.assertIn("child sessions only", self.refusal_text("sessions", [root]))

    def test_bad_ticket_options_are_refused(self) -> None:
        self.assertIn(
            "whole number",
            self.refusal_text("sessions", [_session(dispatch_ticket=TICKET,
                                                    dispatch_ticket_sequence="first")]),
        )
        self.assertIn(
            "needs dispatch_ticket",
            self.refusal_text("sessions", [_session(dispatch_ticket_sequence=0)]),
        )

    def test_reviewer_owned_keys_still_refused_alongside_a_ticket(self) -> None:
        text = self.refusal_text("sessions", [_session(dispatch_ticket=TICKET,
                                                       agent_quality=5)])
        self.assertIn("reviewer-owned", text)


class ActivityTicketRowTest(RefusalMixin, unittest.TestCase):
    def test_ticket_row_writes_user_message_and_waives_reply(self) -> None:
        rows, _tickets = pen.validate_and_default(
            "activity", [_activity(sequence=0, dispatch_ticket=TICKET)],
            "recSESSION1234567",
        )
        row = rows[0]
        self.assertEqual(row[pen.ACTIVITY_MAP["user_message"]], TICKET)
        self.assertEqual(row[pen.ACTIVITY_MAP["context_referenced"]],
                         pen.TICKET_DEFAULT_CONTEXT)
        self.assertNotIn(pen.ACTIVITY_MAP["reply_digest"], row)
        self.assertNotIn(pen.ACTIVITY_MAP["event_type"], row)

    def test_ticket_row_must_stay_untyped(self) -> None:
        text = self.refusal_text(
            "activity",
            [_activity(dispatch_ticket=TICKET, event_type="Action", summary="x")],
        )
        self.assertIn("untyped", text)

    def test_ticket_and_user_message_may_not_disagree(self) -> None:
        text = self.refusal_text(
            "activity",
            [_activity(dispatch_ticket=TICKET, user_message="something else",
                       reply_digest="ok", context_referenced="none")],
        )
        self.assertIn("send the brief once", text)

    def test_ordinary_exchange_still_needs_a_reply(self) -> None:
        """No loophole: only a declared ticket row may omit reply_digest."""
        error = self.refusal(
            "activity",
            [_activity(user_message=TICKET, context_referenced="none")],
        )
        missing = error["validation"][0]["missing"]
        self.assertIn("reply_digest", missing)
        self.assertEqual(len(missing), len(set(missing)), msg="missing keys repeat")

    def test_reports_reject_ticket_keys(self) -> None:
        text = self.refusal_text(
            "reports",
            [{"title": "t", "report_type": "Handoff", "agent_slug": "clive-man",
              "headline": "h", "body": "b", "dispatch_ticket": TICKET}],
        )
        self.assertIn("unknown key: dispatch_ticket", text)


class GradingKeyTest(unittest.TestCase):
    """Parent Session ID plus first-turn User Message — not Turn Type "Brief"."""

    def test_pen_never_keys_off_the_brief_turn_type(self) -> None:
        content = LOGGER.read_text(encoding="utf-8")
        # No comparison or membership test against the Brief turn-type choice.
        for pattern in (r"==\s*[\"']Brief[\"']", r"\{\s*[\"']Brief[\"']",
                        r"\(\s*[\"']Brief[\"']", r"in\s*\[\s*[\"']Brief[\"']"):
            self.assertNotRegex(content, pattern)
        self.assertIn("fldTCd93XF8XhsVoZ", content)  # User Turn Type stays AI-owned
        self.assertIn("Parent Session ID + a first-turn User Message", content)

    def test_skill_names_the_marker_and_disowns_brief(self) -> None:
        for path in SKILL_MIRRORS:
            body = path.read_text(encoding="utf-8")
            self.assertIn("Parent Session ID", body, msg=str(path))
            self.assertIn("dispatch_ticket", body, msg=str(path))
            self.assertRegex(
                body,
                re.compile(r"Brief.{0,120}not the agent-to-agent", re.S),
                msg=f"{path} must say Turn Type Brief is not the agent-to-agent marker",
            )


class MirrorParityTest(unittest.TestCase):
    def test_script_mirrors_match_canonical(self) -> None:
        canonical = LOGGER.read_bytes()
        for path in SCRIPT_MIRRORS:
            self.assertEqual(path.read_bytes(), canonical,
                             msg=f"{path} drifted from hyperagent/scripts")

    def test_skill_mirrors_match_each_other(self) -> None:
        first, second = SKILL_MIRRORS
        self.assertEqual(first.read_bytes(), second.read_bytes(),
                         msg="Cursor and Claude skill mirrors drifted")


if __name__ == "__main__":
    unittest.main()
