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

# Draft Brain Truth
F = {
    "title": "fld8BVmRBSsVuXD8I",
    "canonical_text": "fld95ls0LG26rCNx4",
    "brain_slug": "flddfROfNcP1u6gCy",
    "status": "fldiMCxuBITyZIOXW",
    "proposed_by_agent": "flde1d1sda9lWwrj9",
    "capture_source": "fld9zhLHPvjnq8lHT",
}

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

READ_TABLES = {T_DRAFT_TRUTH, T_AMENDMENT_VERSIONS, T_BRAIN_INTERACTIONS}
WRITE_TABLES = {T_DRAFT_TRUTH, T_BRAIN_INTERACTIONS}

BI_ALLOWED_FIELDS = set(BI.values())
DRAFT_ALLOWED_FIELDS = set(F.values())
DRAFT_CREATE_FIELDS = {
    F["title"],
    F["canonical_text"],
    F["brain_slug"],
    F["status"],
    F["capture_source"],
    F["proposed_by_agent"],
}
