#!/usr/bin/env python3
"""Removed in Context Architecture V2. Use approve_context_item.py with AIRTABLE_APPROVER_TOKEN."""

from __future__ import annotations

import json
import sys


def main() -> None:
    print(
        json.dumps(
            {
                "success": False,
                "error": (
                    "update_context_item_status.py was removed in V2. "
                    "Human approval must use docs/context/human-approval-path.md "
                    "and hyperagent/scripts/approve_context_item.py with AIRTABLE_APPROVER_TOKEN."
                ),
            }
        )
    )
    sys.exit(1)


if __name__ == "__main__":
    main()
