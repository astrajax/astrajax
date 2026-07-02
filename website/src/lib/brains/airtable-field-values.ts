/** Valid options on Workshop `Created By` single-select fields. */
export const AIRTABLE_CREATED_BY_OPTIONS = ["Matthew", "Agent", "Website", "TL"] as const;

export type AirtableCreatedBy = (typeof AIRTABLE_CREATED_BY_OPTIONS)[number];

/** Map UI / narrative actor labels to Airtable select values. */
export function normalizeCreatedBy(actor?: string | null): AirtableCreatedBy {
  const value = actor?.trim() ?? "";
  if ((AIRTABLE_CREATED_BY_OPTIONS as readonly string[]).includes(value)) {
    return value as AirtableCreatedBy;
  }
  if (/agent|clive|pam|doc|man|minion/i.test(value)) {
    return "Agent";
  }
  if (/website|api|demo seed/i.test(value)) {
    return "Website";
  }
  return "Matthew";
}
