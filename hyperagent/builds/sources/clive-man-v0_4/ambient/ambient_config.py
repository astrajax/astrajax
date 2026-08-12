#!/usr/bin/env python3
"""Ambient Capture V1 intake constants — shared with tests and generator."""

from __future__ import annotations

ACTOR = "clive-man-ambient-capture"
BASE_ID = "appL2fdnGmhA02WXd"
TABLE_ID = "tblsuOKGjSGYv0Vov"  # Context Amendment Versions only
FORBIDDEN_TABLE = "tblswvXNYFDqnl6af"  # Draft Brain Truth — never direct write
DRAFT_TRUTH_TABLE = FORBIDDEN_TABLE
CHECKPOINT = "PENDING_RUTH_CHECKPOINT_STORE"
CRED_ENV = "AMBIENT_V1_CREATE"
ACTIVITY_CRED_ENV = "FLEET_ACTIVITY_WRITE"

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

ALLOWED_FIELD_IDS = set(AV.values())
SEMANTIC_AFTER_KEYS = {
    "title",
    "canonical_text",
    "brain_slug",
    "capture_source",
    "proposed_category",
    "brain_theme",
    "record_type",
    "horizon",
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
