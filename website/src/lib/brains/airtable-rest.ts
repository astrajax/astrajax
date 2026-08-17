/**
 * Server-only Airtable REST helpers for Brain Key persistence.
 * Never import from client components.
 *
 * Airtable accepts either field names or field IDs as `fields` keys. Names break
 * the moment a column is renamed — on 17 Aug 2026 `Canonical Text` became
 * `Canonical Text for Agents` and every name-keyed capture write started failing
 * with UNKNOWN_FIELD_NAME. Write payloads in this app are keyed on field IDs;
 * `returnFieldsByFieldId` keeps the response and read paths on IDs too.
 * `filterByFormula` and `sort` are the exception — Airtable only accepts names there.
 */

const AIRTABLE_TIMEOUT_MS = 10_000;

/** Max pages when `paginate: true` (100 records each → 2,000 ceiling). */
export const AIRTABLE_MAX_PAGES = 20;

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
      let detail = response.statusText;
      try {
        const body = (await response.json()) as { error?: { message?: string; type?: string } };
        if (body.error?.message) {
          detail = body.error.message;
        }
      } catch {
        /* non-JSON body */
      }
      throw new Error(`Airtable API error ${response.status}: ${detail}`);
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
    /** Follow Airtable `offset` across pages (page size 100). Default off. */
    paginate?: boolean;
    /** Return cell keys as field IDs so a column rename cannot blank a read. */
    returnFieldsByFieldId?: boolean;
  },
): Promise<AirtableRecord[]> {
  const paginate = options?.paginate === true;
  const params: Record<string, string | number | undefined> = {
    pageSize: paginate ? 100 : (options?.maxRecords ?? 100),
  };
  if (options?.returnFieldsByFieldId) {
    params.returnFieldsByFieldId = "true";
  }
  if (options?.filterByFormula) {
    params.filterByFormula = options.filterByFormula;
  }
  if (!paginate && options?.maxRecords) {
    params.maxRecords = options.maxRecords;
  }
  if (options?.sortField) {
    params["sort[0][field]"] = options.sortField;
    params["sort[0][direction]"] = options.sortDirection ?? "desc";
  }

  const appendFields = (url: URL) => {
    if (!options?.fields) return;
    for (const field of options.fields) {
      url.searchParams.append("fields[]", field);
    }
  };

  if (!paginate) {
    const url = new URL(buildUrl(baseId, tableId));
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.append(key, String(value));
    }
    appendFields(url);
    const response = await airtableRequest(url.toString(), token);
    const data = (await response.json()) as { records?: AirtableRecord[] };
    return data.records ?? [];
  }

  const collected: AirtableRecord[] = [];
  let offset: string | undefined;
  for (let page = 0; page < AIRTABLE_MAX_PAGES; page += 1) {
    const url = new URL(buildUrl(baseId, tableId));
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.append(key, String(value));
    }
    if (offset) url.searchParams.append("offset", offset);
    appendFields(url);

    const response = await airtableRequest(url.toString(), token);
    const data = (await response.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };
    collected.push(...(data.records ?? []));
    if (!data.offset) break;
    offset = data.offset;
  }

  return collected;
}

export type AirtableWriteOptions = {
  /** Return cell keys as field IDs so callers never re-read by name. */
  returnFieldsByFieldId?: boolean;
};

export async function airtableCreate(
  baseId: string,
  tableId: string,
  token: string,
  fields: Record<string, unknown>,
  options?: AirtableWriteOptions,
): Promise<AirtableRecord> {
  const response = await airtableRequest(buildUrl(baseId, tableId), token, {
    method: "POST",
    body: JSON.stringify({
      fields,
      ...(options?.returnFieldsByFieldId ? { returnFieldsByFieldId: true } : {}),
    }),
  });
  return (await response.json()) as AirtableRecord;
}

export async function airtableUpdate(
  baseId: string,
  tableId: string,
  token: string,
  recordId: string,
  fields: Record<string, unknown>,
  options?: AirtableWriteOptions,
): Promise<AirtableRecord> {
  const url = `${buildUrl(baseId, tableId)}/${recordId}`;
  const response = await airtableRequest(url, token, {
    method: "PATCH",
    body: JSON.stringify({
      fields,
      ...(options?.returnFieldsByFieldId ? { returnFieldsByFieldId: true } : {}),
    }),
  });
  return (await response.json()) as AirtableRecord;
}

export async function airtableFindOne(
  baseId: string,
  tableId: string,
  token: string,
  filterByFormula: string,
  fields?: string[],
  options?: { returnFieldsByFieldId?: boolean },
): Promise<AirtableRecord | null> {
  const records = await airtableSelect(baseId, tableId, token, {
    filterByFormula,
    fields,
    maxRecords: 1,
    returnFieldsByFieldId: options?.returnFieldsByFieldId,
  });
  return records[0] ?? null;
}

/** Escape a string for use inside an Airtable formula single-quoted literal. */
export function escapeAirtableString(value: string): string {
  return value.replace(/'/g, "''");
}
