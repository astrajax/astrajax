#!/usr/bin/env python3
"""Discoverable wrapper for household_activity_window --self-test (#156)."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "hyperagent" / "scripts" / "household_activity_window.py"


def _load():
    spec = importlib.util.spec_from_file_location("household_activity_window", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class HouseholdActivityWindowSelfTest(unittest.TestCase):
    def test_self_test_passes(self) -> None:
        mod = _load()
        # _self_test asserts internally and raises on failure.
        mod._self_test()


if __name__ == "__main__":
    unittest.main()
