import { airtableSelect, type AirtableRecord } from "../airtable-rest";

/**
 * Refuse Brain Interaction mutations when the record belongs to another brain.
 * Returns the looked-up row so callers can merge it onto Airtable's partial
 * PATCH response (which often returns only the fields that changed).
 */
export async function assertBrainInteractionBelongsToBrain(input: {
  baseId: string;
  tableId: string;
  token: string;
  recordId: string;
  brainSlug: string;
}): Promise<AirtableRecord> {
  const records = await airtableSelect(input.baseId, input.tableId, input.token, {
    filterByFormula: `RECORD_ID()='${input.recordId.replace(/'/g, "\\'")}'`,
    maxRecords: 1,
  });
  const record = records[0];
  if (!record) throw new Error("Interaction not found.");
  const recordBrain = String(record.fields["Brain Slug"] ?? "").trim();
  if (recordBrain !== input.brainSlug) {
    throw new Error("Brain does not match this interaction.");
  }
  return record;
}
