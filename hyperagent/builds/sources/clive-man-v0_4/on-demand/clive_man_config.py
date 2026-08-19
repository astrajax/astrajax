#!/usr/bin/env python3
"""On-demand Clive's Man workshop constants."""

from __future__ import annotations

BASE_WORKSHOP = "appL2fdnGmhA02WXd"
BASE_REGISTRY = "appbdTVHevH6Bl5ZZ"
T_DRAFT_TRUTH = "tblswvXNYFDqnl6af"
T_BRAIN_INTERACTIONS = "tblNqNSuIJ2akHyA1"
T_AMENDMENT_VERSIONS = "tblsuOKGjSGYv0Vov"
T_REGISTRY_BRAINS = "tblAUtpgSjtKf3BBr"

CRED_READ = "CLIVE_MAN_WORKSHOP_READ"
CRED_WRITE = "CLIVE_MAN_ON_DEMAND_WRITE"

# Draft Brain Truth — field IDs (Canonical Text was renamed to Canonical Text for Agents)
F = {
    "title": "fld8BVmRBSsVuXD8I",
    "canonical_text": "fld95ls0LG26rCNx4",
    "canonical_text_for_humans": "fldbnsCNSXmLXE51y",
    "brain_slug": "flddfROfNcP1u6gCy",
    "brain_registry": "fldB1vIzRA6NBxEYs",
    "status": "fldiMCxuBITyZIOXW",
    "proposed_by_agent": "flde1d1sda9lWwrj9",
    "created_by": "fldEonKVeEsrbiwkm",
    "proposed_category": "fldD4gLnHeihH7yCd",
    "brain_theme": "fld8wdl04NOs8CwpX",
    "record_type": "fldCViiokjEMdp3vb",
    "horizon": "fldEgLQcvc6L4c9p1",
    "source_documents": "fldsspqpNL4vDUU50",
    "context_amendment_versions": "fldAeXTX1uLgkNa5d",
    "related_projects": "fld9wY5ncNSeMxVye",
    "supersedes_trusted_truth_id": "fldbWiOWBg5nmNMJv",
    "capture_source": "fld9zhLHPvjnq8lHT",
}

T_WORKSHOP_BRAIN_REGISTRY = "tblsI93ayQm4hq5bw"
T_PROJECTS = "tbl5jo7EKBxAjjKbf"
PROJECT_LIFECYCLE_ACTIVE = "Active"
F_PROJECT = {
    "project_name": "fldonDAGcLRG2GEzD",
    "lifecycle": "fld4SAa3XCObipxa8",
}

DRAFT_HUMAN_ONLY_FIELDS = frozenset({
    "fldi0T3Kq4psOpLoi",  # Human Reviewed
    "fldDmfyM7wK6k8DKj",  # Human Chosen Brain
    "fldepH6sz70MAl1lJ",  # Human Chosen Category
    "fld8RMUWe9grDx9F6",  # Human Chosen Record Type
    "fldjkIGcHIbw0ucGs",  # Human Chosen Horizon
    "fld9VYQEf4b0PMSJm",  # Readability Rating
    "fldaEEJvOK3YMepwK",  # Capture Quality
    "fld31KoLoNuuYUx6V",  # Context Importance
    "fldV4xwixcBhcpnHv",  # Readability Notes
    "fld7iMmXepwsZ3ieD",  # Capture Quality Notes
    "fld6SLo2yjscSEU5v",  # Builder Notes
    "fldWEGX7L3cGuqxe9",  # Should Have Been Auto-Handled
    "fldqxz6XyOQwCwyCz",  # Follow-up Candidate
})

CAPTURE_SOURCE_CHAT = "Chat Session"
CAPTURE_SOURCE_CHOICES = {
    "External Context Capture",
    "User Guided Capture",
    "Chat Session",
}

# Brain Interactions review fields (allowlisted PATCH only)
BI = {
    "review_status": "fldk0PaNuCRiWJfC2",
    "context_flagged": "flduYD4mnl27MTcRW",
}

BR = {
    "brain_slug": "fldXw8rDWqzrIDcGA",
    "trusted_base_id": "fldwfZ0MRyjvCG9S5",
    "status": "fldlqAv7M40Fw4v9p",
}

LANE_A_SOURCE_CLASSES = {"human", "household_agent"}
FORBIDDEN_ORIGINS = {"ambient", "document", "slack", "email", "thread", "web"}

ALLOWED_DRAFT_STATUSES = {"Draft", "Quarantined"}
FORBIDDEN_DRAFT_STATUSES = {"Approved", "Rejected", "Promoted", "Trusted"}

LANE_A_MAX_CREATES = 3
MAX_429_RETRIES = 3
BACKOFF_SECONDS = (2, 4, 8)

READ_TABLES = {T_DRAFT_TRUTH, T_AMENDMENT_VERSIONS, T_BRAIN_INTERACTIONS, T_PROJECTS}
WRITE_TABLES = {T_DRAFT_TRUTH, T_BRAIN_INTERACTIONS}

BI_ALLOWED_FIELDS = set(BI.values())
DRAFT_ALLOWED_FIELDS = set(F.values())
DRAFT_CREATE_FIELDS = {
    F["title"],
    F["canonical_text"],
    F["canonical_text_for_humans"],
    F["brain_slug"],
    F["brain_registry"],
    F["status"],
    F["capture_source"],
    F["proposed_by_agent"],
    F["created_by"],
    F["proposed_category"],
    F["brain_theme"],
    F["record_type"],
    F["horizon"],
    F["source_documents"],
    F["context_amendment_versions"],
    F["related_projects"],
    F["supersedes_trusted_truth_id"],
}
