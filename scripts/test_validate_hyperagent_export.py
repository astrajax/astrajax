#!/usr/bin/env python3
"""Offline unit tests for HyperAgent export validation (credentialSchema encoding)."""

from __future__ import annotations

import importlib.util
import io
import json
import unittest
from pathlib import Path
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "hyperagent" / "scripts" / "validate_hyperagent_export.py"


def _load():
    spec = importlib.util.spec_from_file_location("validate_hyperagent_export", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _minimal_embedded_skill(**overrides):
    skill = {
        "name": "Test Skill",
        "description": "desc",
        "icon": None,
        "documentation": "",
        "tags": [],
        "whenToUse": "",
        "authType": "none",
        "credentialSchema": json.dumps([{"name": "TOKEN", "type": "secret"}]),
        "skillMdBody": "# Test",
        "scripts": "[]",
        "references": "[]",
        "isPinned": False,
    }
    skill.update(overrides)
    return skill


def _minimal_agent(skills):
    return {
        "version": 1,
        "type": "agent",
        "data": {
            "autoSaveMemories": False,
            "autoSaveSkills": False,
            "autoSaveAgents": False,
            "autoSavePrompts": False,
            "toolSettings": "{}",
            "allowedIntegrations": "[]",
            "skillScope": "selected",
            "skillLoadMode": "preload",
            "skills": skills,
        },
    }


class CredentialSchemaEncodingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_accepts_json_encoded_string_schema(self) -> None:
        export = _minimal_agent([_minimal_embedded_skill()])
        self.m.validate_export(export)

    def test_accepts_null_schema(self) -> None:
        export = _minimal_agent([_minimal_embedded_skill(credentialSchema=None)])
        self.m.validate_export(export)

    def test_rejects_object_schema(self) -> None:
        """Regression: HA import requires a JSON string, not a raw object/array."""
        export = _minimal_agent(
            [_minimal_embedded_skill(credentialSchema=[{"name": "TOKEN"}])]
        )
        with self.assertRaises(SystemExit) as ctx:
            with patch("sys.stderr", new=io.StringIO()):
                self.m.validate_export(export)
        self.assertEqual(ctx.exception.code, 1)

    def test_rejects_invalid_json_string(self) -> None:
        export = _minimal_agent(
            [_minimal_embedded_skill(credentialSchema="{not-json")]
        )
        with self.assertRaises(SystemExit):
            with patch("sys.stderr", new=io.StringIO()):
                self.m.validate_export(export)


if __name__ == "__main__":
    unittest.main()
