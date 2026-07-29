const AIRTABLE_API = "https://api.airtable.com/v0";
const AIRTABLE_TIMEOUT_MS = 10_000;

export type AirtableUpdatedRecord = {
  id: string;
  fields?: Record<string, unknown>;
  createdTime?: string;
};

/** Reviewer-only PATCH path. Never pass the serving writer token here. */
export async function updateAirtableReview(input: {
  baseId: string;
  tableId: string;
  recordId: string;
  reviewToken: string;
  fields: Record<string, unknown>;
}): Promise<AirtableUpdatedRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${AIRTABLE_API}/${input.baseId}/${input.tableId}/${input.recordId}?typecast=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${input.reviewToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: input.fields }),
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(`Household Activity review update failed (${response.status}).`);
    }
    return (await response.json()) as AirtableUpdatedRecord;
  } finally {
    clearTimeout(timeout);
  }
}
