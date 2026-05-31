// AstraJax Emails — field IDs from hyperagent/context_architecture_schema_v1.json

export const BASE_ID = 'appYv601Oq7fKTCj0';
export const EMAILS_TABLE_ID = 'tblq8QM5IegQxurYJ';

export const EMAIL = {
    SUBJECT: 'fldt2IHMqKEBaHUyK',
    FROM: 'fldoeZeXFy5AqzRxp',
    FROM_EMAIL: 'flduFEKQMOgACvxNL',
    RECEIVED_AT: 'fldmwGNMJ3kfUG3Tp',
    GMAIL_MESSAGE_ID: 'fldclF6Th9hK9c9z6',
    GMAIL_LINK: 'fld3ugzGZ7ufkSWar',
    BODY: 'fldd5HhSBLnKnKUTU',
    BODY_EXCERPT: 'fldGhO9Mdq85q1xCd',
    EMAIL_CATEGORY: 'fld3lopLQBvc4UJ6O',
    SCANNER_STATUS: 'fldI24v0I4f9Hmydj',
    AI_SUMMARY: 'fldZGOW3JSgnbenUq',
    AI_STRUCTURED_JSON: 'fldOsHCIvZsLoiYKY',
    INGEST_SOURCE: 'fldVSyTQuexVMvnZB',
    NOTES: 'fldic6BAvDO8WkN9h',
    THREAD_ID: 'fldOuAylDBp4nsQhw',
    TO: 'fldsBZvZDh3mGpe53',
    CC: 'fldRkamebxj6hGWa6',
    HAS_ATTACHMENTS: 'fldaKhnFajikyiqPf',
    ATTACHMENT_NAMES: 'fldJns2z0nesd0e50',
} as const;

export const EMAIL_CATEGORIES = [
    'Hyperagent Release',
    'Platform / SaaS Update',
    'Customer / Sales',
    'Finance / Billing',
    'Newsletter / Marketing',
    'Personal',
    'Internal / Team',
    'Notification / System',
    'Other',
    'Uncategorised',
] as const;

export type EmailCategory = typeof EMAIL_CATEGORIES[number];

export type CategoryTab = 'all' | EmailCategory;

export const CATEGORY_TABS: CategoryTab[] = [
    'all',
    'Uncategorised',
    ...EMAIL_CATEGORIES.filter(category => category !== 'Uncategorised'),
];

export const SCANNER_STATUS = {
    NEW: 'New',
    SYNCED: 'Synced to repo',
    PROMOTED: 'Promoted',
    IGNORED: 'Ignored',
} as const;
