#!/usr/bin/env python3
"""
Shared constants for Clive's Man Daily Context Review — ROLE: Executor.
Executor-scoped subset: everything the two-pass executor needs (authoritative
V2 loading, preflight, typed mutations, readback, Change Log). No audit/fingerprint
or V1/V2 control-writer config. Credential: CONTEXT_AMENDMENT_EXECUTE only.
"""

ADAPTER_VERSION = "context-amendment-adapters-v2.0"
EXECUTOR_IMPLEMENTATION_VERSION = "context-amendment-execute-v2.1"
ROLE = "clive-man-context-executor"
ACTOR_SCHEDULED = ROLE
ACTOR_INTAKE = "clive-man-ambient-capture"
INTAKE_ACTORS = frozenset(
    {
        "clive-man-ambient-capture",
        "clive-man-activity-intake-cursor",
        "clive-man-activity-intake-hyperagent",
    }
)

BASE_WORKSHOP = "appL2fdnGmhA02WXd"
BASE_REGISTRY = "appbdTVHevH6Bl5ZZ"

T_DRAFT_TRUTH = "tblswvXNYFDqnl6af"
T_AMENDMENT_VERSIONS = "tblsuOKGjSGYv0Vov"

# Capture Source gate (v2.1): Draft Brain Truth Capture Source singleSelect, the
# first gate for human review. Exact live choices; nothing else is accepted.
CAPTURE_SOURCE_FIELD = "fld9zhLHPvjnq8lHT"
CAPTURE_SOURCE_CHOICES = {
    "External Context Capture": "sel6OVgDp9lXftz29",
    "User Guided Capture": "selaJPbbEyDNf1Gz8",
    "Chat Session": "sel16ONJz9yPx76hH",
}
T_EXECUTION_EVENTS = "tblM7gxcsWYijdaM8"
T_REGISTRY_CHANGE_LOG = "tbliAMUuKKW4DDRXF"
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

BLANK_METADATA_ALLOWLIST = {
    "brain_slug": F["brain_slug"], "proposed_category": F["proposed_category"],
    "brain_theme": F["brain_theme"], "record_type": F["record_type"],
    "horizon": F["horizon"], "supersedes_trusted_truth_id": F["supersedes_trusted_truth_id"],
    "capture_source": F["capture_source"],
}
BLANK_METADATA_FORBIDDEN = {
    "title": F["title"], "canonical_text": F["canonical_text"], "status": F["status"],
    "proposed_by_agent": F["proposed_by_agent"], "created_by": F["created_by"],
    "created": F["created"], "source_documents": F["source_documents"],
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
    "execution_events": "fldvekhFz1CLBi3sp",
}

EE = {
    "execution_event_id": "fldMDDPGzyhQZRGTJ", "amendment_version": "fldZeOm6wYcDZWEKz",
    "target_draft": "fldGxAEx9NEzmJgy1", "run_id": "fldXnsZzYKMAx8AML",
    "attempt": "fldJhCsnCOw0PrCxi", "event_type": "fldMvKOBqq5AZTTeq",
    "observed_before_snapshot": "fldBwANWLIjoQSmo7", "observed_before_hash": "fldNoGMMH8ZmtGMRn",
    "applied_payload": "fld0I2EEqTnQmpWxd", "after_readback": "fldsnkjt3YqXKHBJG",
    "after_hash": "fldSWss6x3rfjRDym", "rollback_class": "fldDptryEI2EDJuCm",
    "airtable_action_id": "fld84ZoJ71V7byBor", "revert_handle": "fldbFoKqFaqUpKGQb",
    "error": "fld9Gw1wBmU91Kicb", "executing_agent": "fldY8eXeMrzuHHJ4x",
    "target_url": "fldwSZG3WOrt3ZL7u",
}

CL = {
    "entry_id": "fldbewIQNebtucArP", "change_summary": "flddZRd7rhMRSdnY8",
    "change_type": "flduWUwUUT8Wsxz76", "changed_by": "fldawPlugGn9Ax2JE",
    "approved_by": "fld2BzEfC21r2Ian0", "executing_agent": "fldu2U484EXheO9MR",
    "source": "fldEt487QudivIZLj", "reason": "fldpKHZLSMJm6QpbX",
    "affected_records": "fldMJkDF9mzch7MUU", "status": "fldWHFC3FYigfqy5J",
    "previous_hash": "fldbabZzSgYgQHdWE", "entry_hash": "fldpkmTmM6QqM31jR",
    "notes": "fldnbadnPs6OtTufn",
}

BR = {"brain_slug": "fldXw8rDWqzrIDcGA", "trusted_base_id": "fldwfZ0MRyjvCG9S5",
      "status": "fldlqAv7M40Fw4v9p"}

REQUIRED_SCHEMA = [
    (BASE_WORKSHOP, T_DRAFT_TRUTH, list(F.values())),
    (BASE_WORKSHOP, T_AMENDMENT_VERSIONS, list(AV.values())),
    (BASE_WORKSHOP, T_EXECUTION_EVENTS, list(EE.values())),
    (BASE_REGISTRY, T_REGISTRY_CHANGE_LOG, list(CL.values())),
]

ACTION_CLASSES = {
    "CREATE_DRAFT_TRUTH", "CREATE_AMENDMENT_DRAFT", "FILL_BLANK_DRAFT_METADATA",
    "LINK_SOURCE_DOCUMENT", "QUARANTINE_DRAFT", "CREATE_SUPERSEDING_DRAFT",
    "CREATE_CONTROL_ROW", "APPEND_CHANGE_LOG",
}
EXISTING_RECORD_ACTIONS = {"FILL_BLANK_DRAFT_METADATA", "LINK_SOURCE_DOCUMENT", "QUARANTINE_DRAFT"}
CREATE_ACTIONS = {"CREATE_DRAFT_TRUTH", "CREATE_AMENDMENT_DRAFT", "CREATE_SUPERSEDING_DRAFT"}

WRITE_ALLOWLIST = {
    "CREATE_DRAFT_TRUTH": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "CREATE_AMENDMENT_DRAFT": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "FILL_BLANK_DRAFT_METADATA": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "LINK_SOURCE_DOCUMENT": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "QUARANTINE_DRAFT": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "CREATE_SUPERSEDING_DRAFT": {BASE_WORKSHOP: {T_DRAFT_TRUTH}},
    "CREATE_CONTROL_ROW": {BASE_WORKSHOP: {T_AMENDMENT_VERSIONS, T_EXECUTION_EVENTS}},
    "APPEND_CHANGE_LOG": {BASE_REGISTRY: {T_REGISTRY_CHANGE_LOG}},
}

DRAFT_STATUS = {"Draft", "Quarantined", "Rejected", "Promoted"}
QUARANTINE_ALLOWED_FROM = {"Draft"}

CAP_DAILY_MUTATIONS = {"intake": None, "maintenance": 5}
CAP_FAILURES = {"intake": 2, "maintenance": 2}

TERMINAL_EVENT_TYPES = frozenset({"Applied", "Skipped", "Blocked", "Failed", "Compensated"})

ENV_EXECUTE = "CONTEXT_AMENDMENT_EXECUTE"
