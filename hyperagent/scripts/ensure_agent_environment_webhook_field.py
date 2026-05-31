#!/usr/bin/env python3
"""Ensure Agent Environments has Hyperagent Webhook URL field.

Run once so Workbench automations can read the webhook URL from the agent row
instead of hardcoding it in every automation input variable.

Requires AIRTABLE_WRITE_TOKEN in repo-root .env (write scope on base appYv601Oq7fKTCj0).
"""

from __future__ import annotations

import json
import sys
import time

from context_architecture_common import meta_request_json

AGENTS_TABLE = "Agent Environments"
FIELD_NAME = "Hyperagent Webhook URL"


def main() -> None:
    data = meta_request_json("GET", "tables")
    table = next((t for t in data.get("tables", []) if t.get("name") == AGENTS_TABLE), None)
    if not table:
        raise SystemExit(f"Table not found: {AGENTS_TABLE}")

    if any(f.get("name") == FIELD_NAME for f in table.get("fields", [])):
        print(json.dumps({"success": True, "created": False, "message": f"{FIELD_NAME} already exists"}))
        return

    meta_request_json(
        "POST",
        f"tables/{table['id']}/fields",
        {"name": FIELD_NAME, "type": "url"},
    )
    time.sleep(0.3)
    print(
        json.dumps(
            {
                "success": True,
                "created": True,
                "field": FIELD_NAME,
                "next": "Paste each agent's /receive URL on its Agent Environments row.",
            }
        )
    )


if __name__ == "__main__":
    main()
