// AstraJax Context Items — field IDs from hyperagent/context_architecture_schema_v1.json (v2)

export const BASE_ID = 'appYv601Oq7fKTCj0';
export const CONTEXT_ITEMS_TABLE_ID = 'tblisiZJQmQuBqEef';

export const ITEM = {
    TITLE: 'fldE7w7mFIocLC6FF',
    CANONICAL_TEXT: 'fldfNF4ivqfFbYyRU',
    CATEGORY: 'fldaPVEnAjl5RIhgK',
    OWNER: 'fldvABVoGBgXZI5hA',
    STATUS: 'fldvKLpN2wJs71vGv',
    AUTHORITY: 'fldth9EfnR5xPwk9g',
    FRESHNESS: 'fld2wpNWlETGcLcI1',
    SOURCE_NOTES: 'fldcFcsKdw04GeU8u',
    BOOTSTRAP_SOURCE: 'fldHvczG3AcanVqzH',
    CREATED_AT: 'fldhf8ohn6HyVMB11',
    CREATED_BY: 'fldxCyHOC65IJnzv5',
    PROPOSED_BY_AGENT: 'fldUJgH8IlnPgUHZ6',
    CONFIRMED_BY_HUMAN: 'fldGpfrpxTJQ7qNlu',
    CONFIRMATION_METHOD: 'fldJ7HPf6GSIeJqk0',
    APPROVAL_NOTES: 'fldWSFV681AtG3tiB',
    LAST_REVIEWED: 'fldNVRQiVtzfsEZSg',
} as const;

export const ITEM_STATUS = {
    DRAFT: 'Draft',
    AGENT_PROPOSED: 'Agent proposed',
    PROPOSED: 'Proposed',
    NEEDS_DECISION: 'Needs decision',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PUBLISHED: 'Published',
    DEPRECATED: 'Deprecated',
} as const;

export const REVIEW_STATUSES = [
    ITEM_STATUS.DRAFT,
    ITEM_STATUS.AGENT_PROPOSED,
    ITEM_STATUS.PROPOSED,
    ITEM_STATUS.NEEDS_DECISION,
] as const;

export const HUMAN_APPROVAL_STATUSES = [
    ITEM_STATUS.APPROVED,
    ITEM_STATUS.REJECTED,
    ITEM_STATUS.NEEDS_DECISION,
] as const;

export const CONFIRMATION_METHODS = {
    AIRTABLE_EDIT: 'Airtable edit',
    INTERFACE_BUTTON: 'Interface button',
    APPROVER_SCRIPT: 'approver script',
} as const;
