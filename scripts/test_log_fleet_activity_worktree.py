#!/usr/bin/env python3
"""Offline tests for log_fleet_activity worktree credential resolution (#171)."""

from __future__ import annotations

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "hyperagent" / "scripts" / "log_fleet_activity.py"


def _load():
    spec = importlib.util.spec_from_file_location("log_fleet_activity", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class LogFleetActivityWorktreeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.mod = _load()

    def test_gitdir_from_pointer_reads_absolute_and_relative_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            pointer = Path(tmp) / ".git"
            absolute = Path(tmp) / "elsewhere" / "gitdir"
            absolute.mkdir(parents=True)
            pointer.write_text(f"gitdir: {absolute}\n", encoding="utf-8")
            self.assertEqual(self.mod._gitdir_from_pointer(str(pointer)), str(absolute))

            relative_target = Path(tmp) / "rel-git"
            relative_target.mkdir()
            pointer.write_text("gitdir: rel-git\n", encoding="utf-8")
            self.assertEqual(
                self.mod._gitdir_from_pointer(str(pointer)),
                os.path.abspath(str(relative_target)),
            )

            pointer.write_text("not-a-pointer\n", encoding="utf-8")
            self.assertIsNone(self.mod._gitdir_from_pointer(str(pointer)))

    def test_primary_checkout_root_via_commondir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            primary = Path(tmp) / "primary"
            worktree = Path(tmp) / "worktree"
            primary.mkdir()
            worktree.mkdir()
            (primary / ".git").mkdir()

            wt_gitdir = primary / ".git" / "worktrees" / "feature"
            wt_gitdir.mkdir(parents=True)
            (wt_gitdir / "commondir").write_text("../..\n", encoding="utf-8")
            (worktree / ".git").write_text(f"gitdir: {wt_gitdir}\n", encoding="utf-8")

            self.assertEqual(
                self.mod._primary_checkout_root(str(worktree)),
                str(primary),
            )
            self.assertIsNone(self.mod._primary_checkout_root(str(primary)))

    def test_primary_checkout_root_via_worktrees_path_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            primary = Path(tmp) / "primary"
            worktree = Path(tmp) / "linked"
            primary.mkdir()
            worktree.mkdir()
            (primary / ".git").mkdir()

            wt_gitdir = primary / ".git" / "worktrees" / "job"
            wt_gitdir.mkdir(parents=True)
            # No usable commondir — fall back to splitting on /worktrees/.
            (wt_gitdir / "commondir").write_text("not-a-git-dir\n", encoding="utf-8")
            (worktree / ".git").write_text(f"gitdir: {wt_gitdir}\n", encoding="utf-8")

            self.assertEqual(
                self.mod._primary_checkout_root(str(worktree)),
                str(primary),
            )

    def test_read_env_file_handles_export_quotes_and_comments(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            env_path = Path(tmp) / ".env"
            env_path.write_text(
                "\n".join(
                    [
                        "# comment",
                        "export FLEET_ACTIVITY_WRITE='pat_from_env'",
                        'OTHER="ignored"',
                        "EMPTY=",
                        "BARE=plain",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )
            values = self.mod._read_env_file(str(env_path))
            self.assertEqual(values["FLEET_ACTIVITY_WRITE"], "pat_from_env")
            self.assertEqual(values["OTHER"], "ignored")
            self.assertEqual(values["BARE"], "plain")
            self.assertNotIn("EMPTY", values)

    def test_resolve_credential_prefers_primary_env_when_worktree_has_none(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            primary = Path(tmp) / "primary"
            worktree = Path(tmp) / "worktree"
            primary.mkdir()
            worktree.mkdir()
            (primary / ".git").mkdir()
            (primary / ".env").write_text(
                "FLEET_ACTIVITY_WRITE=pat_primary_only\n",
                encoding="utf-8",
            )

            wt_gitdir = primary / ".git" / "worktrees" / "coverage"
            wt_gitdir.mkdir(parents=True)
            (wt_gitdir / "commondir").write_text("../..\n", encoding="utf-8")
            (worktree / ".git").write_text(f"gitdir: {wt_gitdir}\n", encoding="utf-8")

            cleared = {key: "" for key in self.mod.CREDENTIAL_KEYS}
            with patch.object(self.mod, "_repo_root", return_value=str(worktree)):
                with patch.dict(os.environ, cleared, clear=False):
                    for key in self.mod.CREDENTIAL_KEYS:
                        os.environ.pop(key, None)
                    token, source = self.mod.resolve_credential()

            self.assertEqual(token, "pat_primary_only")
            self.assertEqual(source, "primary:.env:FLEET_ACTIVITY_WRITE")

    def test_resolve_credential_prefers_process_env_over_files(self) -> None:
        env = {key: "" for key in self.mod.CREDENTIAL_KEYS}
        env["FLEET_ACTIVITY_WRITE"] = "pat_process"
        with patch.dict(os.environ, env, clear=False):
            for key in self.mod.CREDENTIAL_KEYS:
                if key != "FLEET_ACTIVITY_WRITE":
                    os.environ.pop(key, None)
            token, source = self.mod.resolve_credential()
        self.assertEqual(token, "pat_process")
        self.assertEqual(source, "env:FLEET_ACTIVITY_WRITE")


if __name__ == "__main__":
    unittest.main()
