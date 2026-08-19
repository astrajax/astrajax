#!/usr/bin/env python3
"""Ambient Capture V1 intake constants — shared with tests and generator."""

from __future__ import annotations

ACTOR = "clive-man-ambient-capture"
BASE_ID = "appL2fdnGmhA02WXd"
TABLE_ID = "tblsuOKGjSGYv0Vov"  # Context Amendment Versions only
FORBIDDEN_TABLE = "tblswvXNYFDqnl6af"  # Draft Brain Truth — never direct write
DRAFT_TRUTH_TABLE = FORBIDDEN_TABLE
CONTEXT_EVENTS_TABLE = "tblM7gxcsWYijdaM8"
CONTEXT_FINGERPRINTS_TABLE = "tblakbMPiim1K13Ru"

CHECKPOINT_TABLE = "tblRbjD0PHtuTWsIL"  # Ambient Checkpoint Versions
CHECKPOINT_BOOTSTRAP_RECORD = "recHsDmDx00c636BP"
CHECKPOINT_APPEND_CRED_ENV = "AMBIENT_CHECKPOINT_APPEND"  # not minted
CHECKPOINT = CHECKPOINT_TABLE

CRED_ENV = "AMBIENT_V1_CREATE"
ACTIVITY_CRED_ENV = "FLEET_ACTIVITY_WRITE"

# Activation gates — human-confirmed before first Advance (not minted / not enabled in repo)
INITIAL_SCAN_BOUNDARY_ENV = "AMBIENT_INITIAL_SCAN_BOUNDARY_UTC"
SOURCE_ORDER_VERIFIED_ENV = "AMBIENT_SOURCE_ORDER_VERIFIED"
THREAD_ORDER_FIELDS_ENV = "AMBIENT_THREAD_ORDER_FIELDS"  # e.g. createdAt,threadId

EXECUTOR_ADAPTER_VERSION = "context-amendment-adapters-v2.0"
V1_STAGE = "V1"
V1_VERDICT = "Proposed"
ACTION_CLASS = "CREATE_DRAFT_TRUTH"
CAPTURE_SOURCE_CHAT = "Chat Session"

# Draft Brain Truth field IDs (docs/tests only — not stored in V1 after_payload)
CAPTURE_SOURCE_FIELD = "fld9zhLHPvjnq8lHT"
CAPTURE_SOURCE_CHAT_ID = "sel16ONJz9yPx76hH"
FIELD_STATUS = "fldiMCxuBITyZIOXW"
FIELD_PROPOSED_BY = "flde1d1sda9lWwrj9"

# Amendment Versions field IDs (from governed specialist config)
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

# Ambient Checkpoint Versions — exact maps from website/src/lib/brains/airtable-ids.ts
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

DEFAULT_STREAM_KEY = "hyperagent:eligible-threads:clive-man-ambient-capture:v1"
BOOTSTRAP_EVENT_ID = "acp-genesis-hyperagent-ambient-v1"

# Credential roles — structural write identity (never infer from secret value).
CRED_ROLE_V1_CREATE = CRED_ENV
CRED_ROLE_CHECKPOINT_APPEND = CHECKPOINT_APPEND_CRED_ENV

ALLOWED_HTTP_METHODS = frozenset({"GET", "POST"})
FORBIDDEN_TABLES = frozenset(
    {FORBIDDEN_TABLE, DRAFT_TRUTH_TABLE, CONTEXT_EVENTS_TABLE, CONTEXT_FINGERPRINTS_TABLE}
)
CRED_ROLE_GET_TABLES: dict[str, frozenset[str]] = {
    CRED_ROLE_V1_CREATE: frozenset({TABLE_ID}),
    CRED_ROLE_CHECKPOINT_APPEND: frozenset({TABLE_ID, CHECKPOINT_TABLE}),
}
CRED_ROLE_POST_TABLES: dict[str, frozenset[str]] = {
    CRED_ROLE_V1_CREATE: frozenset({TABLE_ID}),
    CRED_ROLE_CHECKPOINT_APPEND: frozenset({CHECKPOINT_TABLE}),
}

ALLOWED_FIELD_IDS = set(AV.values())
SEMANTIC_AFTER_KEYS = {
    "title",
    "canonical_text",
    "canonical_text_for_agents",
    "canonical_text_for_humans",
    "brain_slug",
    "brain_registry",
    "capture_source",
    "proposed_category",
    "brain_theme",
    "record_type",
    "horizon",
    "source_documents",
    "supersedes_trusted_truth_id",
    "related_projects",
    "context_amendment_versions",
}
REQUIRED_CANDIDATE_KEYS = (
    "title",
    "canonical_text",
    "brain_slug",
    "evidence",
    "confidence",
    "dedupe_key",
    "v1_report_record_id",
)

CHUNK_SIZE = 10
MAX_429_RETRIES = 3
BACKOFF_SECONDS = (2, 4, 8)

CAP_DAILY = {"intake": None, "maintenance": 5}
CAP_FAIL = {"intake": 2, "maintenance": 2}
CHAT_BACKFILL_CLEAR_CAP = 1
