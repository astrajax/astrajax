#!/usr/bin/env python3
"""Offline unit tests for agent JSON attach slug resolution (#155 / bb6cdc6).

Locks the regressions:
- member slugs that legitimately end in a role suffix still attach as members
- unknown clive-man-* filenames do not invent minion rows
- alias normalisation maps Downloads filenames to Household Register slugs
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "attach-agent-json-exports.py"


def _load():
    spec = importlib.util.spec_from_file_location("attach_agent_json_exports", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class FilenameStemTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_strips_agent_prefix_and_download_copy_suffix(self) -> None:
        path = Path("/tmp/Downloads/agent-clive-man-proposer (2).json")
        self.assertEqual(self.m.filename_stem(path), "clive-man-proposer")

    def test_strips_updated_suffix(self) -> None:
        path = Path("/tmp/agent-pam-updated.json")
        self.assertEqual(self.m.filename_stem(path), "pam")


class NormalizeFileSlugTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_maps_clive_s_man_alias(self) -> None:
        self.assertEqual(self.m.normalize_file_slug("clive-s-man"), "clive-man")
        self.assertEqual(
            self.m.normalize_file_slug("clive-s-man-proposer"),
            "clive-man-proposer",
        )

    def test_maps_doc_workshop_aliases(self) -> None:
        self.assertEqual(
            self.m.normalize_file_slug("doc-s-workshop-executor"),
            "doc-workshop-executor",
        )

    def test_strips_version_suffix(self) -> None:
        self.assertEqual(
            self.m.normalize_file_slug("external-context-scanner-v0-1"),
            "external-context-scanner",
        )


class ClassifyAndResolveTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def _agent(self, name: str) -> dict:
        return {"type": "agent", "data": {"name": name}, "exportedAt": "2026-08-13T00:00:00Z"}

    def test_head_member_resolves(self) -> None:
        path = Path("/tmp/agent-clive.json")
        self.assertEqual(
            self.m.resolve_agent(path, self._agent("Clive Wigglesworth")),
            ("member", "clive"),
        )

    def test_known_minion_resolves(self) -> None:
        path = Path("/tmp/agent-clive-man-proposer.json")
        self.assertEqual(
            self.m.resolve_agent(path, self._agent("Clive's Man Proposer")),
            ("minion", "clive-man-proposer"),
        )

    def test_member_with_role_suffix_slug_still_attaches_as_member(self) -> None:
        """investing-lane-trade-executor is a head Member, not a minion dump."""
        path = Path("/tmp/agent-investing-lane-trade-executor.json")
        self.assertEqual(
            self.m.resolve_agent(path, self._agent("Investing Lane Trade Executor")),
            ("member", "investing-lane-trade-executor"),
        )

    def test_unknown_clive_man_suffix_does_not_invent_minion(self) -> None:
        path = Path("/tmp/agent-clive-man-activity-intake-hyperagent.json")
        self.assertIsNone(
            self.m.resolve_agent(path, self._agent("Clive's Man Activity Intake"))
        )

    def test_minion_role_dump_does_not_attach_to_head_member(self) -> None:
        # Filename looks like a minion of clive-man, but if only the head matched
        # via json name, still prefer not to attach a proposer dump to the head.
        path = Path("/tmp/agent-clive-man-proposer.json")
        # Force a payload whose name alone would slug to the head.
        hit = self.m.resolve_agent(path, self._agent("Clive's Man"))
        self.assertEqual(hit, ("minion", "clive-man-proposer"))

    def test_clive_man_head_wins_over_legacy_minion_row(self) -> None:
        path = Path("/tmp/agent-clive-man.json")
        self.assertEqual(
            self.m.resolve_agent(path, self._agent("Clive's Man")),
            ("member", "clive-man"),
        )

    def test_non_agent_payload_skipped(self) -> None:
        path = Path("/tmp/agent-clive.json")
        self.assertIsNone(self.m.resolve_agent(path, {"type": "skill", "data": {}}))


if __name__ == "__main__":
    unittest.main()
