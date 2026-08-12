"""Frozen Clive's Man Hyperagent family v0.4 contract constants.

Single source for generator, embedded scripts, and offline tests.
"""

from __future__ import annotations

# Persona gate (fail-closed until Matthew approves in Airtable)
PERSONA_V04_RECORD_ID = "recSKTT8NTTJOmuRu"
PERSONA_V04_VERSION_NAME = "Operational v0.4"
PERSONA_V03_RECORD_ID = "rect04amPJAZrWCi4"

# Workshop control plane
BRAIN_WORKSHOP_BASE = "appL2fdnGmhA02WXd"
CONTEXT_AMENDMENT_VERSIONS_TABLE = "tblsuOKGjSGYv0Vov"
DRAFT_BRAIN_TRUTH_TABLE = "tblswvXNYFDqnl6af"
CONTEXT_EVENTS_TABLE = "tblM7gxcsWYijdaM8"
CONTEXT_FINGERPRINTS_TABLE = "tblakbMPiim1K13Ru"

# Payload field IDs (Ambient V1 CREATE_DRAFT_TRUTH)
FIELD_STATUS = "fldiMCxuBITyZIOXW"
FIELD_PROPOSED_BY_AGENT = "flde1d1sda9lWwrj9"
FIELD_CAPTURE_SOURCE = "fld9zhLHPvjnq8lHT"
CAPTURE_SOURCE_CHAT_SESSION = "sel16ONJz9yPx76hH"

# Actors (immutable literals — never alias)
ACTOR_AMBIENT = "clive-man-ambient-capture"
ACTOR_AUDITOR = "clive-man-context-auditor"
ACTOR_CHALLENGER = "clive-man-context-challenger"
ACTOR_EXECUTOR = "clive-man-context-executor"

# Models (Hyperagent slugs — not Cursor frontmatter pins)
MODEL_HEAD = "openai/gpt-5.6-sol"
MODEL_PROPOSER = "claude-sonnet-5"
MODEL_CHALLENGER_ONDEMAND = "claude-sonnet-5"
MODEL_EXECUTOR_ONDEMAND = "moonshotai/kimi-k3"
MODEL_KIMI_K3 = "moonshotai/kimi-k3"
MODEL_AUDITOR = "openai/gpt-5.6-sol"
MODEL_CHALLENGER_SCHEDULED = "claude-sonnet-5"
MODEL_CONTEXT_EXECUTOR = "moonshotai/kimi-k3"

# Credential env names (values never in repo)
CRED_AMBIENT_V1_CREATE = "AMBIENT_V1_CREATE"
CRED_CLIVE_MAN_WORKSHOP_READ = "CLIVE_MAN_WORKSHOP_READ"
CRED_CLIVE_MAN_ON_DEMAND_WRITE = "CLIVE_MAN_ON_DEMAND_WRITE"

# Caps and policy
CAP_DAILY_MUTATIONS = {"intake": None, "maintenance": 5}
CAP_FAILURES = {"intake": 2, "maintenance": 2}
CHAT_BACKFILL_CLEAR_CAP = 1
CHECKPOINT_SENTINEL = "PENDING_RUTH_CHECKPOINT_STORE"

# Intake discriminator (existing-schema)
INTAKE_DISCRIMINATOR = {
    "stage": "V1",
    "action_class": "CREATE_DRAFT_TRUTH",
    "created_by_agent": ACTOR_AMBIENT,
}

# Export filenames (15 total when approved)
AGENT_EXPORTS = (
    "agent-clive-man-v0_4.json",
    "agent-clive-man-proposer-v0_4.json",
    "agent-clive-man-challenger-v0_4.json",
    "agent-clive-man-executor-v0_4.json",
    "agent-clive-man-ambient-capture-v0_4.json",
    "agent-clive-man-context-auditor-v0_4.json",
    "agent-clive-man-context-challenger-v0_4.json",
    "agent-clive-man-context-executor-v0_4.json",
)

STANDALONE_SKILL_EXPORTS = (
    "skill-clive-man-v0_4.json",
    "skill-clive-man-proposer-v0_4.json",
    "skill-clive-man-challenger-v0_4.json",
    "skill-clive-man-executor-v0_4.json",
    "skill-clive-man-context-auditor-v0_4.json",
    "skill-clive-man-context-challenger-v0_4.json",
    "skill-clive-man-context-executor-v0_4.json",
)

EXPECTED_EXPORT_COUNT = len(AGENT_EXPORTS) + len(STANDALONE_SKILL_EXPORTS)

# Schedules (Europe/London) — Ambient contract only; omitted from import JSON
SCHEDULE_CONTRACT = {
    ACTOR_AMBIENT: {
        "hour": 5,
        "minute": 0,
        "enabled": False,
        "read_only_mode": False,
        "importable": False,
        "reason": "Platform export cannot represent disabled schedule safely; manual UI gate required.",
    },
    ACTOR_AUDITOR: {
        "hour": 6,
        "minute": 0,
        "enabled": True,
        "read_only_mode": False,
        "importable": True,
    },
    ACTOR_CHALLENGER: {
        "hour": 7,
        "minute": 0,
        "enabled": True,
        "read_only_mode": True,
        "importable": True,
    },
    ACTOR_EXECUTOR: {
        "hour": 8,
        "minute": 0,
        "enabled": True,
        "read_only_mode": True,
        "importable": True,
    },
}

LEGACY_SCHEDULE_MARKERS = (
    "LEGACY PAUSED",
    "nested route unsupported",
    "06:30",
    "07:00 Europe/London nested",
)


def daily_rrule(hour: int, minute: int = 0) -> str:
    return f"FREQ=DAILY;BYHOUR={hour};BYMINUTE={minute};BYSECOND=0"


def schedule_invocation(
    name: str,
    hour: int,
    prompt: str,
    *,
    read_only_mode: bool = False,
) -> dict:
    return {
        "name": name,
        "rrule": daily_rrule(hour),
        "timezone": "Europe/London",
        "prompt": prompt,
        "threadNamingHint": None,
        "readOnlyMode": read_only_mode,
    }
