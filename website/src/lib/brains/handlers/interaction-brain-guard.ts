import { airtableSelect } from "../airtable-rest";

/** Refuse Brain Interaction mutations when the record belongs to another brain. */
export async function assertBrainInteractionBelongsToBrain(input: {
  baseId: string;
  tableId: string;
  token: string;
  recordId: string;
  brainSlug: string;
}): Promise<void> {
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
}
