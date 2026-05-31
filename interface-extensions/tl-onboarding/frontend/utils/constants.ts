/** TL Onboarding (content) field names */
export const FIELDS = {
    TITLE: 'Title',
    SORT_ORDER: 'Sort Order',
    SECTION: 'Section',
    SUMMARY: 'Summary',
    HTML_BODY: 'HTML Body',
    READ_TIME: 'Read Time Min',
    ESSENTIAL: 'Essential',
    SLIDES_PDF: 'Slides PDF',
    SLIDES_URL: 'Slides URL',
    VIDEO_URL: 'Video URL',
} as const;

/** TL Onboarding Progress (Tara's notes / completion) field names */
export const PROGRESS_FIELDS = {
    LABEL: 'Label',
    MODULE: 'Module',
    COMPLETED: 'Completed',
    TL_NOTES: 'TL Notes',
    QUESTION: 'Question for Matthew',
    QUESTION_STATUS: 'Question Status',
    MATTHEW_REPLY: 'Matthew Reply',
} as const;

export const QUESTION_STATUS = {
    OPEN: 'Open',
    ANSWERED: 'Answered',
} as const;

/** AI Idea Log field names */
export const IDEA_FIELDS = {
    IDEA: 'Idea',
    DETAIL: 'Detail',
    TYPE: 'Type',
    STATUS: 'Status',
    SOURCE: 'Source',
    LOGGED_BY: 'Logged By',
} as const;

export const IDEA_TYPES = [
    'AI could do this',
    'Process improvement',
    'New asset idea',
    'Other',
] as const;

export const SECTION_ORDER = [
    'Start Here',
    'The Business',
    'Your Role',
    'Proof and Claims',
    'Reference',
] as const;

export type SectionName = typeof SECTION_ORDER[number];
