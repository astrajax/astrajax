/**
 * Server-only Airtable REST helpers for Brain Key persistence.
 * Never import from client components.
 */

const AIRTABLE_TIMEOUT_MS = 10_000;

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

function buildUrl(
  baseId: string,
  tableId: string,
  params?: Record<string, string | number | undefined>,
): string {
  const url = new URL(`https://api.airtable.com/v0/${baseId}/${tableId}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      url.searchParams.append(key, String(value));
    }
  }
  return url.toString();
}

async function airtableRequest(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Airtable API error ${response.status}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function airtableSelect(
  baseId: string,
  tableId: string,
  token: string,
  options?: {
    filterByFormula?: string;
    fields?: string[];
    maxRecords?: number;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  },
): Promise<AirtableRecord[]> {
  const params: Record<string, string | number | undefined> = {
    pageSize: options?.maxRecords ?? 100,
  };
  if (options?.filterByFormula) {
    params.filterByFormula = options.filterByFormula;
  }
  if (options?.maxRecords) {
    params.maxRecords = options.maxRecords;
  }
  if (options?.sortField) {
    params["sort[0][field]"] = options.sortField;
    params["sort[0][direction]"] = options.sortDirection ?? "desc";
  }

  const url = new URL(buildUrl(baseId, tableId));
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.append(key, String(value));
  }
  if (options?.fields) {
    for (const field of options.fields) {
      url.searchParams.append("fields[]", field);
    }
  }

  const response = await airtableRequest(url.toString(), token);
  const data = (await response.json()) as { records?: AirtableRecord[] };
  return data.records ?? [];
}

export async function airtableCreate(
  baseId: string,
  tableId: string,
  token: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const response = await airtableRequest(buildUrl(baseId, tableId), token, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return (await response.json()) as AirtableRecord;
}

export async function airtableUpdate(
  baseId: string,
  tableId: string,
  token: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  const url = `${buildUrl(baseId, tableId)}/${recordId}`;
  const response = await airtableRequest(url, token, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  return (await response.json()) as AirtableRecord;
}

export async function airtableFindOne(
  baseId: string,
  tableId: string,
  token: string,
  filterByFormula: string,
  fields?: string[],
): Promise<AirtableRecord | null> {
  const records = await airtableSelect(baseId, tableId, token, {
    filterByFormula,
    fields,
    maxRecords: 1,
  });
  return records[0] ?? null;
}

/** Escape a string for use inside an Airtable formula single-quoted literal. */
export function escapeAirtableString(value: string): string {
  return value.replace(/'/g, "''");
}
