"""On-demand Clive's Man skill script/credential builders for Hyperagent export."""

from __future__ import annotations

import json
from pathlib import Path

from _clive_man_v0_4_contract import (
    BRAIN_WORKSHOP_BASE,
    CRED_CLIVE_MAN_ON_DEMAND_WRITE,
    CRED_CLIVE_MAN_WORKSHOP_READ,
    DRAFT_BRAIN_TRUTH_TABLE,
)

ON_DEMAND_ROOT = Path(__file__).resolve().parent / "sources" / "clive-man-v0_4" / "on-demand"


def _script_entries(*filenames: str) -> str:
    entries = []
    for filename in filenames:
        content = (ON_DEMAND_ROOT / filename).read_text(encoding="utf-8")
        entries.append(
            {
                "filename": filename,
                "content": content,
                "description": f"On-demand governed script {filename} (clive-man-v0_4).",
            }
        )
    return json.dumps(entries)


def read_credential_schema() -> str:
    schema = [
        {
            "name": CRED_CLIVE_MAN_WORKSHOP_READ,
            "label": CRED_CLIVE_MAN_WORKSHOP_READ,
            "required": True,
            "type": "password",
            "hint": (
                f"Read-only Airtable PAT for on-demand Proposer/Challenger evidence reads. "
                f"Scopes: data.records:read + schema.bases:read. "
                f"Grant read to Brain Workshop {BRAIN_WORKSHOP_BASE}, Registry Brains table, "
                f"and active Trusted bases discovered via Registry (GET-only allowlist enforced "
                f"by clive_man_workshop_read.py). Injected as env {CRED_CLIVE_MAN_WORKSHOP_READ}."
            ),
        }
    ]
    return json.dumps(schema)


def executor_credential_schema() -> str:
    schema = [
        {
            "name": CRED_CLIVE_MAN_ON_DEMAND_WRITE,
            "label": CRED_CLIVE_MAN_ON_DEMAND_WRITE,
            "required": True,
            "type": "password",
            "hint": (
                f"Typed on-demand Executor PAT for Option 3 Lane A/B. "
                f"Scopes: data.records:read + data.records:write at base resource "
                f"scope on Brain Workshop {BRAIN_WORKSHOP_BASE} (script enforces table/field "
                f"allowlist: Draft Brain Truth {DRAFT_BRAIN_TRUTH_TABLE} Draft/Quarantined "
                f"create/patch + Brain Interactions review fields). No Trusted, Registry "
                f"schema, delete, or scheduled execute authority. "
                f"Injected as env {CRED_CLIVE_MAN_ON_DEMAND_WRITE}."
            ),
        }
    ]
    return json.dumps(schema)


def read_scripts_json() -> str:
    return _script_entries("clive_man_config.py", "lane_a_allowlist.py", "clive_man_workshop_read.py")


def executor_scripts_json() -> str:
    return _script_entries("clive_man_config.py", "lane_a_allowlist.py", "clive_man_on_demand_executor.py")
