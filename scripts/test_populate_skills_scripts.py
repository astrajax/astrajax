#!/usr/bin/env python3
"""Offline unit tests for Skills script populate helpers (#155)."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "populate-skills-scripts.py"


def _load():
    spec = importlib.util.spec_from_file_location("populate_skills_scripts", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class PopulateSkillsHelpersTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.m = _load()

    def test_slugify_normalises_punctuation(self) -> None:
        self.assertEqual(self.m.slugify("  Clive's Man / Context  "), "clive-s-man-context")

    def test_should_use_attachment_thresholds(self) -> None:
        small = [{"filename": "a.py", "content": "x" * 100}]
        self.assertFalse(self.m.should_use_attachment(small))

        multi = [
            {"filename": "a.py", "content": "tiny"},
            {"filename": "b.py", "content": "tiny"},
        ]
        self.assertTrue(self.m.should_use_attachment(multi))

        oversized = [{"filename": "a.py", "content": "x" * (self.m.SMALL_FILE + 1)}]
        self.assertTrue(self.m.should_use_attachment(oversized))

        self.assertFalse(self.m.should_use_attachment([]))

    def test_ha_json_string_shape(self) -> None:
        payload = self.m.ha_json_string(
            [{"filename": "run.py", "content": "print(1)", "extra": "drop-me"}]
        )
        self.assertEqual(
            json.loads(payload),
            [{"filename": "run.py", "content": "print(1)"}],
        )

    def test_parse_scripts_accepts_string_or_list(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            as_list = root / "list.json"
            as_list.write_text(
                json.dumps({"data": {"scripts": [{"filename": "a.py", "content": "1"}]}}),
                encoding="utf-8",
            )
            as_string = root / "string.json"
            as_string.write_text(
                json.dumps(
                    {
                        "data": {
                            "scripts": json.dumps(
                                [{"filename": "b.py", "content": "2"}]
                            )
                        }
                    }
                ),
                encoding="utf-8",
            )
            empty = root / "empty.json"
            empty.write_text(json.dumps({"data": {}}), encoding="utf-8")

            self.assertEqual(len(self.m.parse_scripts(as_list)), 1)
            self.assertEqual(self.m.parse_scripts(as_string)[0]["filename"], "b.py")
            self.assertEqual(self.m.parse_scripts(empty), [])

    def test_pick_dump_prefers_unnumbered_stem(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            numbered = root / "skill-clive-man (1).json"
            plain = root / "skill-clive-man.json"
            numbered.write_text("{}", encoding="utf-8")
            plain.write_text("{}", encoding="utf-8")
            # Make numbered look newer so preference for plain is intentional.
            numbered.touch()
            dump_index = {"clive-man": [numbered, plain]}
            picked = self.m.pick_dump("clive-man", None, dump_index)
            self.assertEqual(picked, plain)

    def test_complete_attachment_set_lands_on_script_files(self) -> None:
        scripts = [
            {"filename": "a.py", "content": "aaa"},
            {"filename": "b.py", "content": "bbb"},
        ]
        attachments = [
            {"url": "https://example.com/a.py", "filename": "a.py"},
            {"url": "https://example.com/b.py", "filename": "b.py"},
        ]
        fields, bucket = self.m.build_large_skill_fields(
            key="clive-man",
            scripts=scripts,
            attachments=attachments,
            existing_repo="",
            total=6,
        )
        self.assertEqual(bucket, "large_to_script_files")
        self.assertEqual(fields[self.m.FLD_SCRIPT_FILES], attachments)
        self.assertEqual(
            fields[self.m.FLD_REPO_PATH],
            self.m.REPO_PATH_PREFIX + "clive-man/",
        )
        self.assertNotIn(self.m.FLD_SCRIPT, fields)

    def test_partial_attachment_set_falls_back_without_script_files(self) -> None:
        scripts = [
            {"filename": "a.py", "content": "aaa"},
            {"filename": "b.py", "content": "bbb"},
        ]
        # Only one of two uploads succeeded — must not write Script files.
        attachments = [{"url": "https://example.com/a.py", "filename": "a.py"}]
        fields, bucket = self.m.build_large_skill_fields(
            key="clive-man",
            scripts=scripts,
            attachments=attachments,
            existing_repo="docs/initiatives/already-set/",
            total=6,
        )
        self.assertEqual(bucket, "large_repo_path_fallback")
        self.assertNotIn(self.m.FLD_SCRIPT_FILES, fields)
        self.assertNotIn(self.m.FLD_REPO_PATH, fields)
        self.assertIn("2 file(s)", fields[self.m.FLD_SCRIPT])
        self.assertIn(self.m.REPO_PATH_PREFIX + "clive-man/", fields[self.m.FLD_SCRIPT])


if __name__ == "__main__":
    unittest.main()
