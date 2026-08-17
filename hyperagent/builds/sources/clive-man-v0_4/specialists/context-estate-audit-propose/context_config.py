#!/usr/bin/env python3
"""
Shared constants for Clive's Man Daily Context Review — ROLE: Context Auditor
(Audit & Propose). Trimmed subset: only what the Auditor needs. No executor,
no V2 writer, no broad write config.
"""

import sys

assert sys.version_info >= (3, 9), "Daily Context Review scripts require Python >= 3.9"

# v2.0 contract repair: the Amendment Version "Adapter Version" field is the
# EXECUTOR adapter contract version ONLY. The Auditor's own implementation version
# is recorded in report/evidence/reason metadata, never in that field.
SKILL_IMPLEMENTATION_VERSION = "context-estate-audit-propose-v2.1"
EXECUTOR_ADAPTER_VERSION = "context-amendment-adapters-v2.0"
# Back-compat alias for any code reading ADAPTER_VERSION as "the executor contract".
ADAPTER_VERSION = EXECUTOR_ADAPTER_VERSION
ROLE = "clive-man-context-auditor"

# Capture Source gate (v2.1): Draft Brain Truth Capture Source singleSelect, the
# first gate for human review. Exact live choices; nothing else is accepted.
CAPTURE_SOURCE_FIELD = "fld9zhLHPvjnq8lHT"
CAPTURE_SOURCE_CHOICES = {
    "External Context Capture": "sel6OVgDp9lXftz29",
    "User Guided Capture": "selaJPbbEyDNf1Gz8",
    "Chat Session": "sel16ONJz9yPx76hH",
}
# Actors allowed to be classified Chat Session from agent provenance (with evidence).
CHAT_CAPTURE_ACTORS = {"clive-man-ambient-capture", "clive-man"}

BASE_WORKSHOP = "appL2fdnGmhA02WXd"
BASE_REGISTRY = "appbdTVHevH6Bl5ZZ"

T_DRAFT_TRUTH = "tblswvXNYFDqnl6af"
T_SOURCE_DOCS = "tblfWdhwbq4QsCjUf"
T_AMENDMENT_VERSIONS = "tblsuOKGjSGYv0Vov"
T_AUDIT_FINGERPRINTS = "tblakbMPiim1K13Ru"
T_REGISTRY_BRAINS = "tblAUtpgSjtKf3BBr"

F = {
    "title": "fld8BVmRBSsVuXD8I", "canonical_text": "fld95ls0LG26rCNx4",
    "brain_slug": "flddfROfNcP1u6gCy", "status": "fldiMCxuBITyZIOXW",
    "proposed_by_agent": "flde1d1sda9lWwrj9", "created_by": "fldEonKVeEsrbiwkm",
    "proposed_category": "fldD4gLnHeihH7yCd", "brain_theme": "fld8wdl04NOs8CwpX",
    "record_type": "fldCViiokjEMdp3vb", "horizon": "fldEgLQcvc6L4c9p1",
    "source_documents": "fldsspqpNL4vDUU50",
    "supersedes_trusted_truth_id": "fldbWiOWBg5nmNMJv",
    "created": "fldYcgzaE3FwxziBT", "capture_source": "fld9zhLHPvjnq8lHT",
}

AV = {
    "amendment_version_id": "fldQxEy1xkA6cW4ns", "run_id": "fld013GgbDvipHaoO",
    "stage": "fldkuxYpAshlyysTQ", "supersedes_version": "fldoL2hAsZF1CWO46",
    "supersedes_version_link": "fldLB8EkaZZxt52Gp",
    "v1_report_url": "fldp3pgFYZwG6TKVG", "v2_report_url": "fldOXHhUOvVZ7eLga",
    "target_base_id": "fldx3zeJFEgsj6NL1", "target_table_id": "fld9oG1aeNpaH4DsR",
    "target_record_id": "fldg8BbNU68ahHVHF", "target_field_id": "fldLYwTyN3gwxEOuB",
    "target_draft": "fldNB2R9bYKdLXjo1", "action_class": "fldgtnn8eXHmdHSUC",
    "adapter_version": "flda57mh9wmKwZC0g", "before_snapshot": "fldCiIBLVP4MKplMz",
    "before_hash": "fldqWAnWmQ0j0WqR1", "after_payload": "fldIBr9n66Ek4MvNX",
    "reason": "fldxc0t7emGLkK76x", "evidence": "fldBEmZXQuYHKX27x",
    "tier": "fldtAci9wgwcihcZb", "challenger_verdict": "fldPUsdAy9FXmYeAh",
    "confidence": "fld2ypDkBf8qo3Qmu", "human_decision_needed": "fldoZDmZPz8iVoqUg",
    "dedupe_key": "fldm9DV7zrjlbiM3D", "created_by_agent": "fldSQdzOLrl4tqVQB",
    # D9b (2026-08-17): dead AV reciprocal execution_events → fldvekhFz1CLBi3sp
    # removed.
    "v1_report_record_id": "fldQvrUp6UAh5kqKC", "v2_report_record_id": "fld3fOFooui0ATmUv",
}

FP = {
    "object_key": "fldv5C1dKIAF4jQNe", "base_id": "fldHKm9766LdGLO3D",
    "table_id": "fldjuC02ve1wkaB8k", "record_id": "fldvLb4fr7OllTHt0",
    "field_id": "fldnBXUS3McLoAosW", "object_type": "fldhNGdyWaquxTmh4",
    "current_hash": "fld0NDYivyEPy8q40", "previous_hash": "fldu9flIRt6MWNpwZ",
    "last_seen": "fldUbuQGBL9rbPVDW", "last_changed": "fldNnv8Y6RvJCOz9z",
    "last_sampled": "fldzevSBAgIkZYDho", "last_run_id": "fldqXLsqMAlO3lfVy",
    "state": "fldkiKK3r0TcAMaTR",
}

BR = {
    "brain_slug": "fldXw8rDWqzrIDcGA", "brain_name": "fldXpuQ9VpksGlrqk",
    "workshop_base_id": "fldNOk4DJUhqbY37l", "trusted_base_id": "fldwfZ0MRyjvCG9S5",
    "status": "fldlqAv7M40Fw4v9p",
}

SD = {
    "title": "fldXZjXfaINi0GsBF", "linked_drafts": "fldm0dA2jtyU0V3Vl",
}

REQUIRED_SCHEMA = [
    (BASE_WORKSHOP, T_DRAFT_TRUTH, list(F.values())),
    (BASE_WORKSHOP, T_AMENDMENT_VERSIONS, list(AV.values())),
    (BASE_WORKSHOP, T_AUDIT_FINGERPRINTS, list(FP.values())),
    (BASE_WORKSHOP, T_SOURCE_DOCS, list(SD.values())),
    (BASE_REGISTRY, T_REGISTRY_BRAINS, list(BR.values())),
]

# Auditor writes ONLY these, ONLY Stage=V1/Proposed.
V1_STAGE = "V1"
V1_VERDICT = "Proposed"
AUDITOR_WRITE_TABLES = {T_AMENDMENT_VERSIONS, T_AUDIT_FINGERPRINTS}

ACTION_CLASSES = {
    "CREATE_DRAFT_TRUTH", "CREATE_AMENDMENT_DRAFT", "FILL_BLANK_DRAFT_METADATA",
    "LINK_SOURCE_DOCUMENT", "QUARANTINE_DRAFT", "CREATE_SUPERSEDING_DRAFT",
    "CREATE_CONTROL_ROW", "APPEND_CHANGE_LOG",
}

# Report detail cap (how many finding details the report shows) — separate from
# the proposal cap. A backlog (findings_total > this) is flagged, NOT a stop.
CAP_FINDING_DETAILS = 25
# Proposal cap: max V1 Amendment Versions created per run. Under overflow all
# proposals are Tier=Amber (non-executable until Challenger V2 clears them).
CAP_V1_AMENDMENTS = 50
STALE_DAYS_DEFAULT = 30

# Deterministic check -> approved typed-action priority map. Lower number =
# higher proposal priority. Findings whose check is absent are NON-actionable
# (reported, never proposed). Only checks mappable to approved typed actions
# with complete evidence/before-hash/payload may be proposed.
CHECK_ACTION_PRIORITY = {
    "workshop_trusted_contradiction": (0, "CREATE_SUPERSEDING_DRAFT"),
    "duplicate_title": (1, "QUARANTINE_DRAFT"),
    "text_duplicate": (1, "QUARANTINE_DRAFT"),
    "orphaned_source_link": (2, "LINK_SOURCE_DOCUMENT"),
    "amendment_missing_supersedes": (3, "FILL_BLANK_DRAFT_METADATA"),
    "blank_brain_slug": (4, "FILL_BLANK_DRAFT_METADATA"),
    "blank_metadata": (4, "FILL_BLANK_DRAFT_METADATA"),
    "capture_source_blank": (3, "FILL_BLANK_DRAFT_METADATA"),
    "no_provenance": (5, "LINK_SOURCE_DOCUMENT"),
    "stale_draft": (6, "QUARANTINE_DRAFT"),
    "unknown_brain_slug": (7, "FILL_BLANK_DRAFT_METADATA"),
}

ENV_READ = "CONTEXT_ESTATE_READ"
ENV_V1_CONTROL_WRITE = "CONTEXT_V1_CONTROL_WRITE"
