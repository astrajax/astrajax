#!/usr/bin/env python3
"""
Shared constants for Clive's Man Daily Context Review — ROLE: Challenger.
Trimmed subset: only what the Challenger needs. No V1 writer, no fingerprint
mutation, no executor, no Draft/Trusted write config.
"""

import sys

assert sys.version_info >= (3, 9), "Daily Context Review scripts require Python >= 3.9"

# v1.2 contract repair: the Amendment Version "Adapter Version" field is the
# EXECUTOR adapter contract version ONLY. The Challenger's own implementation
# version is recorded in report/evidence, never in that field.
CHALLENGE_IMPLEMENTATION_VERSION = "context-estate-challenge-v1.3"
EXECUTOR_ADAPTER_VERSION = "context-amendment-adapters-v2.0"
# Back-compat alias for code reading ADAPTER_VERSION as "the executor contract".
ADAPTER_VERSION = EXECUTOR_ADAPTER_VERSION
# Supported executor contract versions the Challenger will preserve into V2.
SUPPORTED_EXECUTOR_VERSIONS = {"context-amendment-adapters-v2.0"}
ROLE = "clive-man-challenger"

# Capture Source gate (v1.3): exact live choices; nothing else accepted.
CAPTURE_SOURCE_FIELD = "fld9zhLHPvjnq8lHT"
CAPTURE_SOURCE_CHOICES = {
    "External Context Capture": "sel6OVgDp9lXftz29",
    "User Guided Capture": "selaJPbbEyDNf1Gz8",
    "Chat Session": "sel16ONJz9yPx76hH",
}
# Chat Session CREATE_DRAFT_TRUTH (no target): Ambient thread scan + Activity Intake twins.
CHAT_SESSION_CREATE_ACTORS = {
    "clive-man-ambient-capture",
    "clive-man-activity-intake-cursor",
    "clive-man-activity-intake-hyperagent",
}
# Legacy blank-target backfill may also cite the steward slug.
CHAT_CAPTURE_ACTORS = CHAT_SESSION_CREATE_ACTORS | {"clive-man"}
CHAT_BACKFILL_CLEAR_CAP = 1

BASE_WORKSHOP = "appL2fdnGmhA02WXd"
BASE_REGISTRY = "appbdTVHevH6Bl5ZZ"

T_DRAFT_TRUTH = "tblswvXNYFDqnl6af"
T_AMENDMENT_VERSIONS = "tblsuOKGjSGYv0Vov"
T_EXECUTION_EVENTS = "tblM7gxcsWYijdaM8"
T_REGISTRY_BRAINS = "tblAUtpgSjtKf3BBr"

F = {
    "title": "fld8BVmRBSsVuXD8I", "canonical_text": "fld95ls0LG26rCNx4",
    "brain_slug": "flddfROfNcP1u6gCy", "status": "fldiMCxuBITyZIOXW",
    "record_type": "fldCViiokjEMdp3vb", "source_documents": "fldsspqpNL4vDUU50",
    "supersedes_trusted_truth_id": "fldbWiOWBg5nmNMJv", "created": "fldYcgzaE3FwxziBT",
    "capture_source": "fld9zhLHPvjnq8lHT",
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
    # removed. Event-side amendment_version → fldZeOm6wYcDZWEKz is preserved.
    "v1_report_record_id": "fldQvrUp6UAh5kqKC", "v2_report_record_id": "fld3fOFooui0ATmUv",
}

EE = {
    "amendment_version": "fldZeOm6wYcDZWEKz", "event_type": "fldMvKOBqq5AZTTeq",
    "applied_payload": "fld0I2EEqTnQmpWxd",
}

BR = {
    "brain_slug": "fldXw8rDWqzrIDcGA", "trusted_base_id": "fldwfZ0MRyjvCG9S5",
    "status": "fldlqAv7M40Fw4v9p",
}

REQUIRED_SCHEMA = [
    (BASE_WORKSHOP, T_DRAFT_TRUTH, list(F.values())),
    (BASE_WORKSHOP, T_AMENDMENT_VERSIONS, list(AV.values())),
    (BASE_WORKSHOP, T_EXECUTION_EVENTS, list(EE.values())),
    (BASE_REGISTRY, T_REGISTRY_BRAINS, list(BR.values())),
]

# Challenger writes ONLY V2 Amendment Versions.
V2_STAGE = "V2"
V2_VERDICTS = {"Cleared", "Held", "Rejected"}
CHALLENGER_WRITE_TABLES = {T_AMENDMENT_VERSIONS}

ENV_CHALLENGE_READ = "CONTEXT_CHALLENGE_READ"
ENV_V2_CONTROL_WRITE = "CONTEXT_V2_CONTROL_WRITE"

# D2 (2026-08-17): identical locked projection to the Executor. Excludes the
# Context Amendment Versions backlink (fldAeXTX1uLgkNa5d) that changes every run.
SNAPSHOT_PROJECTION = (
    "fld8BVmRBSsVuXD8I",
    "fld8wdl04NOs8CwpX",
    "fld9zhLHPvjnq8lHT",
    "fldB1vIzRA6NBxEYs",
    "fldCViiokjEMdp3vb",
    "fldD4gLnHeihH7yCd",
    "fldEonKVeEsrbiwkm",
    "fldIm3bUPNLBflyJc",
    "fldYcgzaE3FwxziBT",
    "flddfROfNcP1u6gCy",
    "flde1d1sda9lWwrj9",
    "fldeKn3fxdilUw4YK",
    "fldiMCxuBITyZIOXW",
)


def project_snapshot(record_fields):
    return {k: record_fields[k] for k in SNAPSHOT_PROJECTION if k in record_fields}


def canonical_snapshot(record_fields):
    import json
    return json.dumps(project_snapshot(record_fields), sort_keys=True,
                      separators=(",", ":"), ensure_ascii=False)
