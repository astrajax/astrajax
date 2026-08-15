#!/usr/bin/env python3
"""Clive's Man Activity Intake v0.1 — frozen constants (HA + tests)."""

from __future__ import annotations

# Actor / runtime (immutable literals — never alias)
ACTOR_HYPERAGENT = "clive-man-activity-intake-hyperagent"
ACTOR_CURSOR = "clive-man-activity-intake-cursor"
ACTOR_LEGACY_THREAD = "clive-man-ambient-capture"
DEFAULT_RUNTIME_OWNER = "hyperagent"

# Household Activity base (read pen)
HOUSEHOLD_BASE_ID = "appF7jQD4ZKrDC7e1"
SESSIONS_TABLE = "tblUi4nmBKX2u8nFx"
ACTIVITY_TABLE = "tblNxNLyC31KDQbRl"
REPORTS_TABLE = "tblFzWUIPSiIGZPln"  # excluded entirely — phase one

# Brain Workshop (write pen — V1 queue only)
WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd"
AMENDMENT_VERSIONS_TABLE = "tblsuOKGjSGYv0Vov"
DRAFT_TRUTH_TABLE = "tblswvXNYFDqnl6af"  # forbidden direct write
CONTEXT_EVENTS_TABLE = "tblM7gxcsWYijdaM8"
CONTEXT_FINGERPRINTS_TABLE = "tblakbMPiim1K13Ru"

# Checkpoint (shared append-only table — distinct stream key)
CHECKPOINT_TABLE = "tblRbjD0PHtuTWsIL"
CHECKPOINT_APPEND_CRED_ENV = "AMBIENT_CHECKPOINT_APPEND"

# Pens (sealed env names — values never in repo)
READ_CRED_ENV = "HOUSEHOLD_ACTIVITY_READ"
WRITE_CRED_ENV = "AMBIENT_V1_CREATE"

# Stream keys
STREAM_KEY = "household-activity:activity:clive-man-activity-intake:v1"
LEGACY_THREAD_STREAM_KEY = "hyperagent:eligible-threads:clive-man-ambient-capture:v1"

# V1 contract
EXECUTOR_ADAPTER_VERSION = "context-amendment-adapters-v2.0"
V1_STAGE = "V1"
V1_VERDICT = "Proposed"
ACTION_CLASS = "CREATE_DRAFT_TRUTH"
CAPTURE_SOURCE_CHAT = "Chat Session"

# Throughput caps
CAP_FIRST_LIVE = 1
CAP_STEADY = 10
FIRST_LIVE_COMPLETE_ENV = "ACTIVITY_INTAKE_FIRST_LIVE_COMPLETE"

# Household Activity field IDs (website/src/lib/platform-activity/ids.ts)
HA = {
    "session_id": "fldHTqDQeAEqE4JCb",
    "agent_slug": "fldzed2cCR3HyCCOb",
    "agent_name": "fld4jizroZZZVxDtb",
    "runtime": "fldoE8uXllbSMAPPS",
    "trigger": "fldG3t3bCjY8tklgv",
    "started": "fldTOGhUjtylNV4ll",
}
ACT = {
    "summary": "fldoVtBIAKanaafMg",
    "event_id": "fldxIVVOp7VvfVQ5j",
    "sequence": "fldeQ8SjlrZfj3a6M",
    "session_id": "fldz1skahzUvg1vzX",
    "session_link": "fldRD3GFz3PqYTANC",
    # Agent Turn Type (mechanical). Never User Turn Type — that field is AI-owned
    # (fldTCd93XF8XhsVoZ) and is not used for eligibility exclusions.
    "event_type": "fldvskIDzutu4JzQt",
    "timestamp": "fldTl7rXvf7YHgImz",
    "user_message": "fldzSTdm15GQf88Ph",
    "reply_digest": "fldBj92Hu9gDesX6u",
}

# Amendment Versions field IDs (governed specialist maps)
AV = {
    "amendment_version_id": "fldQxEy1xkA6cW4ns",
    "run_id": "fld013GgbDvipHaoO",
    "stage": "fldkuxYpAshlyysTQ",
    "target_base_id": "fldx3zeJFEgsj6NL1",
    "target_table_id": "fld9oG1aeNpaH4DsR",
    "target_record_id": "fldg8BbNU68ahHVHF",
    "action_class": "fldgtnn8eXHmdHSUC",
    "adapter_version": "flda57mh9wmKwZC0g",
    "after_payload": "fldIBr9n66Ek4MvNX",
    "reason": "fldxc0t7emGLkK76x",
    "evidence": "fldBEmZXQuYHKX27x",
    "confidence": "fld2ypDkBf8qo3Qmu",
    "v1_report_record_id": "fldQvrUp6UAh5kqKC",
    "tier": "fldtAci9wgwcihcZb",
    "challenger_verdict": "fldPUsdAy9FXmYeAh",
    "dedupe_key": "fldm9DV7zrjlbiM3D",
    "created_by_agent": "fldSQdzOLrl4tqVQB",
}

# Ambient Checkpoint Versions (shared infra)
CP = {
    "checkpoint_event_id": "fld3ZfUhXoTx6UqLV",
    "stream_key": "fldeZnYJ3291BXPOp",
    "revision": "flddQZdINPYJlXoLy",
    "event_type": "fldtIlV22PQOCx3J9",
    "stream_state": "fldS02GlL0PWoPHJT",
    "previous_event_id": "fldkZnD4t6xQvNDxl",
    "cursor_utc": "fldbYb4TwAZ5sezRX",
    "cursor_token_json": "fldoaDS0ur5bsg8eX",
    "observed_through_utc": "fld8U8bk5ZxKsTWA8",
    "backlog_lower_bound": "fldMA539rrSoxTlIc",
    "backlog_measurement": "fldiN307ABPVVjsTw",
    "disposition_unit_count": "fldu0CzeHS2YPeusV",
    "disposition_manifest_hash": "fldF0zh4nTh15fgCl",
    "run_id": "fldtZflzjl4iTBYhn",
}

CP_EVENT_TYPE = {
    "bootstrap": "selq6zHnw1iZ2uHRc",
    "observation": "selSxMJOmkxErHtjJ",
    "advance": "selZ8sIe3C9ncSMTx",
    "pause": "selXgyebePE3GohSB",
    "resume": "selH9ySAG9S0eQC5t",
    "held": "selzx1mL39bQp7Jqp",
}
CP_STREAM_STATE = {
    "active": "sel1jm5IQM7yWSO71",
    "paused": "selDHrRuXmPdzpcJ4",
    "held": "selp97WbZLcnRTbeD",
}
CP_BACKLOG = {
    "exact": "selpR7TJCstAVrGNr",
    "lower_bound": "seloOZakalWZIOg9q",
    "unknown": "sel6SE2DsQiNTT3hM",
}
CP_EVENT_TYPE_NAME = {v: k for k, v in CP_EVENT_TYPE.items()}
CP_STREAM_STATE_NAME = {v: k for k, v in CP_STREAM_STATE.items()}
CP_BACKLOG_NAME = {v: k for k, v in CP_BACKLOG.items()}

# Exclusion sets (phase-one filter)
EXCLUDED_AGENT_SLUGS = frozenset(
    {
        ACTOR_LEGACY_THREAD,
        ACTOR_CURSOR,
        ACTOR_HYPERAGENT,
    }
)
EXCLUDED_EVENT_TYPES = frozenset({"Session End", "Action", "Completion", "Question"})
READ_ALLOWED_TABLES = frozenset({SESSIONS_TABLE, ACTIVITY_TABLE})
FORBIDDEN_HOUSEHOLD_TABLES = frozenset({REPORTS_TABLE})
FORBIDDEN_WORKSHOP_TABLES = frozenset(
    {DRAFT_TRUTH_TABLE, CONTEXT_EVENTS_TABLE, CONTEXT_FINGERPRINTS_TABLE}
)

ALLOWED_HTTP_METHODS = frozenset({"GET", "POST"})
CRED_ROLE_READ = READ_CRED_ENV
CRED_ROLE_V1_CREATE = WRITE_CRED_ENV
CRED_ROLE_CHECKPOINT_APPEND = CHECKPOINT_APPEND_CRED_ENV

CRED_ROLE_GET_TABLES: dict[str, frozenset[str]] = {
    CRED_ROLE_READ: frozenset({SESSIONS_TABLE, ACTIVITY_TABLE}),
    # Write pen is POST-only (No GET on AMBIENT_V1_CREATE).
    CRED_ROLE_V1_CREATE: frozenset(),
    # Workshop GETs (dedupe + tip) use the checkpoint pen when minted.
    CRED_ROLE_CHECKPOINT_APPEND: frozenset({AMENDMENT_VERSIONS_TABLE, CHECKPOINT_TABLE}),
}
CRED_ROLE_POST_TABLES: dict[str, frozenset[str]] = {
    CRED_ROLE_V1_CREATE: frozenset({AMENDMENT_VERSIONS_TABLE}),
    CRED_ROLE_CHECKPOINT_APPEND: frozenset({CHECKPOINT_TABLE}),
}

# Matches Ambient / executor CREATE_DRAFT_TRUTH allowlist. Sessions provenance
# lives on the candidate + evidence JSON — never in after_payload (executor refuses
# unknown keys such as capture_source_chat_session).
SEMANTIC_AFTER_KEYS = frozenset(
    {
        "title",
        "canonical_text",
        "brain_slug",
        "capture_source",
        "proposed_category",
        "brain_theme",
        "record_type",
        "horizon",
    }
)
REQUIRED_CANDIDATE_KEYS = (
    "title",
    "canonical_text",
    "brain_slug",
    "evidence",
    "confidence",
    "dedupe_key",
    "v1_report_record_id",
    "capture_source_chat_session",
)

CHUNK_SIZE = 10
MAX_429_RETRIES = 3
BACKOFF_SECONDS = (2, 4, 8)
CAP_FAIL = 2
DEFAULT_LEASE_MINUTES = 30
