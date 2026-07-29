const AIRTABLE_API = "https://api.airtable.com/v0";
const AIRTABLE_TIMEOUT_MS = 10_000;

export type AirtableCreatedRecord = {
  id: string;
  fields?: Record<string, unknown>;
  createdTime?: string;
};

async function request(
  baseId: string,
  tableId: string,
  token: string,
  init: RequestInit,
  suffix = "",
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${AIRTABLE_API}/${baseId}/${tableId}${suffix}${suffix.includes("?") ? "&" : "?"}typecast=true`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...init.headers,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok && response.status !== 429) {
      const detail = await response.text().catch(() => response.statusText);
      throw new Error(`Household Activity write failed (${response.status}): ${detail.slice(0, 240)}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createAirtableRecord(input: {
  baseId: string;
  tableId: string;
  token: string;
  fields: Record<string, unknown>;
}): Promise<AirtableCreatedRecord> {
  const response = await request(input.baseId, input.tableId, input.token, {
    method: "POST",
    body: JSON.stringify({ fields: input.fields }),
  });
  if (response.status === 429) throw new Error("HOUSEHOLD_RATE_LIMITED");
  const data = (await response.json()) as AirtableCreatedRecord;
  if (!data.id) throw new Error("Household Activity create returned no record id.");
  return data;
}

export async function createAirtableRecords(input: {
  baseId: string;
  tableId: string;
  token: string;
  records: Array<Record<string, unknown>>;
}): Promise<{ records: AirtableCreatedRecord[] }> {
  const response = await request(input.baseId, input.tableId, input.token, {
    method: "POST",
    body: JSON.stringify({ records: input.records.map((fields) => ({ fields })) }),
  });
  if (response.status === 429) throw new Error("HOUSEHOLD_RATE_LIMITED");
  return (await response.json()) as { records: AirtableCreatedRecord[] };
}

function escapeFormula(value: string): string {
  return value.replace(/'/g, "\\'");
}

export async function selectExistingEventIds(input: {
  baseId: string;
  tableId: string;
  token: string;
  eventIds: string[];
}): Promise<Set<string>> {
  if (input.eventIds.length === 0) return new Set();
  const formula = `OR(${input.eventIds
    .map((eventId) => `{Event ID}='${escapeFormula(eventId)}'`)
    .join(",")})`;
  const url = new URL(`${AIRTABLE_API}/${input.baseId}/${input.tableId}`);
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("pageSize", String(input.eventIds.length));
  url.searchParams.append("fields[]", "Event ID");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${input.token}` },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Household Activity dedupe read failed (${response.status}).`);
    }
    const data = (await response.json()) as {
      records?: Array<{ fields?: Record<string, unknown> }>;
    };
    return new Set(
      (data.records ?? [])
        .map((record) => record.fields?.["Event ID"])
        .filter((value): value is string => typeof value === "string"),
    );
  } finally {
    clearTimeout(timeout);
  }
}

