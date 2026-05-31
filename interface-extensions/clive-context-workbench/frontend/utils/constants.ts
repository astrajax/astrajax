// Shared field IDs — hyperagent/context_architecture_schema_v1.json (v2)

export const BASE_ID = 'appYv601Oq7fKTCj0';

export const ITEM = {
    TITLE: 'fldE7w7mFIocLC6FF',
    CANONICAL_TEXT: 'fldfNF4ivqfFbYyRU',
    CATEGORY: 'fldaPVEnAjl5RIhgK',
    APPLIES_TO: 'fldHw0tI9Rqm2NeBs',
    OWNER: 'fldvABVoGBgXZI5hA',
    STATUS: 'fldvKLpN2wJs71vGv',
    AUTHORITY: 'fldth9EfnR5xPwk9g',
    FRESHNESS: 'fld2wpNWlETGcLcI1',
    CONFIRMED_BY_HUMAN: 'fldGpfrpxTJQ7qNlu',
    CONTEXT_PACK: 'fldVw8pNXb1KRyQGl',
    LAST_REVIEWED: 'fldNVRQiVtzfsEZSg',
    CREATED_AT: 'fldhf8ohn6HyVMB11',
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

export const IN_REVIEW_STATUSES = [
    ITEM_STATUS.DRAFT,
    ITEM_STATUS.AGENT_PROPOSED,
    ITEM_STATUS.PROPOSED,
    ITEM_STATUS.NEEDS_DECISION,
] as const;

export const PACK = {
    PACK_NAME: 'fld15pwGYHLUZjhsx',
    PURPOSE: 'fldZVzbGhqAUzktNJ',
    STATUS: 'fldLTmw16KFprDQzB',
    OWNER: 'fldRlXVlGNuV8OYV7',
} as const;

export const AGENT = {
    AGENT_NAME: 'fldiDxDjULFuxlJOC',
    PLATFORM: 'fldtb6Hv1tYp3iZef',
    PURPOSE: 'fld8FJXZMj7o0ezvw',
    RUNTIME_ENVIRONMENT: 'fld6Cww3ljcIDTirs',
    SKILLS: 'fld50ljJncRAkuP2R',
    TOOL_PERMISSIONS: 'fldAwu95lGqrhefh6',
    OWNER: 'fldxObEc7Yf7zvkwz',
    STATUS: 'fldqfklTjIpnM5QRh',
    LAST_CONFIG_REVIEW: 'fldSaUX5jB0awhaHy',
    NOTES: 'fldwfb4hFRXsZt0jV',
    CONTEXT_PACKS: 'fldWdmG7zIxvlecuW',
    REPO_PATH: 'fldA506VDgrNLemgU',
    CREATED_AT: 'fldRPt33q7Wi5oFwx',
} as const;

export const CHANGE_LOG = {
    CHANGE_SUMMARY: 'fldl5WNeChHpii0DW',
    CHANGE_TYPE: 'fldmxLfk4ZZhfUsZJ',
    DESTINATION: 'fldeXsyxe2DXx1oVN',
    CHANGED_BY: 'fldDaoPWCk6snOyc4',
    APPROVED_BY: 'fldvJD1yOa5b7mRuY',
    PUBLISHED_PATH: 'fldAW8sFm5jUpLWGH',
    COMMIT_SHA: 'fldkxG7bg4GIww5c5',
    STATUS: 'fldcCQ9woZ15QM4my',
    NOTES: 'fldscoE5ryX94ehRv',
    CREATED_AT: 'fld8q0yIcfJbJc775',
    PREV_HASH: 'fldxHr1jbsdMrcymL',
    ENTRY_HASH: 'fldFFO9GMZ1LJ30B3',
} as const;

/** GitHub repo for link-out (repo path field is relative to this). */
export const GITHUB_REPO = 'mphopkinson92/AstraJax';
export const GITHUB_DEFAULT_BRANCH = 'main';
