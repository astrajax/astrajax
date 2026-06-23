// AstraJax / Clive Context OS — Context Intake table field IDs
// Base: appYv601Oq7fKTCj0 · Table: tblJCmPGPUyszgFux

export const BASE_ID = 'appYv601Oq7fKTCj0';
export const CONTEXT_INTAKE_TABLE_ID = 'tblJCmPGPUyszgFux';

export const INTAKE = {
    TITLE: 'fldkjh91h60BhJN1r',
    RAW_SUBMISSION: 'flduZugZuOioMrek8',
    CLEAN_SUMMARY: 'fldxKAYR13WTEM4YY',
    CATEGORY: 'fldYSfK0jPwK4cNKz',
    SUGGESTED_DESTINATION: 'fldAdXBKAqBw62uLE',
    SECONDARY_DESTINATION: 'fld0u7Q7Z5Bzmq6l5',
    CONFIDENCE: 'fldgKCO459aQmB15J',
    STATUS: 'fldyBOcfM1kYzoXTy',
    SUBMITTED_BY: 'fldV99RVwZLPFOAib',
    SOURCE_INTERFACE: 'flddTgzHg9SPALfFt',
    SOURCE_LINK: 'fldyyyyN1FeM7Th5Y',
    SUGGESTED_ACTION: 'fld1uEGF1NLgniofg',
    NEXT_OWNER: 'fldSSBGAB0MbF3C0E',
    REASONING: 'fldKERt6zLJ5M7rPc',
    USER_CONFIRMATION: 'fldbmKaTPteEPEy15',
    CREATED_AT: 'fldYvPUV03RmUsTwI',
    APPROVAL_NOTES: 'fldx9lP9DatxWToB9',
} as const;

export const INTAKE_STATUS = {
    NEW: 'New',
    NEEDS_CLARIFICATION: 'Needs clarification',
    READY_FOR_REVIEW: 'Ready for review',
    POSSIBLE_DUPLICATE: 'Possible duplicate',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PUBLISHED: 'Published',
    DEPLOYED: 'Deployed',
} as const;

export const INTAKE_STATUS_OPTIONS = [
    INTAKE_STATUS.NEW,
    INTAKE_STATUS.NEEDS_CLARIFICATION,
    INTAKE_STATUS.READY_FOR_REVIEW,
    INTAKE_STATUS.POSSIBLE_DUPLICATE,
    INTAKE_STATUS.APPROVED,
    INTAKE_STATUS.REJECTED,
    INTAKE_STATUS.PUBLISHED,
    INTAKE_STATUS.DEPLOYED,
] as const;

export const REVIEW_STATUS_OPTIONS = [
    INTAKE_STATUS.APPROVED,
    INTAKE_STATUS.REJECTED,
    INTAKE_STATUS.NEEDS_CLARIFICATION,
    INTAKE_STATUS.READY_FOR_REVIEW,
] as const;

export const DOWNSTREAM_STATUSES = [
    INTAKE_STATUS.APPROVED,
    INTAKE_STATUS.REJECTED,
    INTAKE_STATUS.PUBLISHED,
    INTAKE_STATUS.DEPLOYED,
] as const;

export const DESTINATION_OPTIONS = [
    'Airtable',
    'Hyperagent',
    'Cursor/GitHub',
    'Notion',
] as const;
