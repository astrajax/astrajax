/**
 * Server-only Airtable REST helpers for Brain Key persistence.
 * Never import from client components.
 */

const AIRTABLE_TIMEOUT_MS = 10_000;

/**
 * URL-based attachment attach can take longer: Airtable fetches the file from
 * our signed Blob URL before answering. Isolated from the default 10s budget so
 * ordinary Brain Key calls stay snappy.
 */
export const AIRTABLE_URL_ATTACH_TIMEOUT_MS = 60_000;

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
  timeoutMs: number = AIRTABLE_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
  },
): Promise<AirtableRecord[]> {
  const paginate = options?.paginate === true;
  const params: Record<string, string | number | undefined> = {
    pageSize: paginate ? 100 : (options?.maxRecords ?? 100),
  };
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

/**
 * Airtable's direct `uploadAttachment` (base64 bytes) caps at 5 MB. Prefer
 * {@link airtableAttachFromUrl} for onboarding / large files: Airtable GETs a
 * short-lived URL and copies into attachment storage (up to plan limits).
 */
export const AIRTABLE_ATTACHMENT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Airtable has served this endpoint from both hosts. Try the content host
 * first, fall back once when it answers 404/405 so a host migration does not
 * silently break filing.
 */
const ATTACHMENT_UPLOAD_HOSTS = [
  "https://content.airtable.com",
  "https://api.airtable.com",
] as const;

/**
 * Upload file bytes straight into an attachment cell (≤5 MB).
 * https://airtable.com/developers/web/api/upload-attachment
 *
 * Kept for callers that already hold small base64 payloads. Onboarding Source
 * Pack filing uses {@link airtableAttachFromUrl} instead so large files never
 * stream through Next.js.
 */
export async function airtableUploadAttachment(
  baseId: string,
  recordId: string,
  attachmentFieldIdOrName: string,
  token: string,
  file: { filename: string; contentType: string; base64: string },
): Promise<AirtableRecord> {
  const body = JSON.stringify({
    contentType: file.contentType,
    file: file.base64,
    filename: file.filename,
  });

  let lastError: unknown;
  for (const host of ATTACHMENT_UPLOAD_HOSTS) {
    const url = `${host}/v0/${baseId}/${recordId}/${attachmentFieldIdOrName}/uploadAttachment`;
    try {
      const response = await airtableRequest(url, token, { method: "POST", body });
      return (await response.json()) as AirtableRecord;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const hostMissing = message.includes("error 404") || message.includes("error 405");
      if (!hostMissing) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Airtable attachment upload failed");
}

/**
 * Attach a file Airtable can fetch itself (signed or public URL).
 * Uses a longer timeout so a ~20 MB fetch from Blob can finish.
 * https://airtable.com/developers/web/api/field-model#multipleattachment
 */
export async function airtableAttachFromUrl(
  baseId: string,
  tableId: string,
  recordId: string,
  attachmentFieldIdOrName: string,
  token: string,
  file: { url: string; filename: string },
): Promise<AirtableRecord> {
  const url = `${buildUrl(baseId, tableId)}/${recordId}`;
  const response = await airtableRequest(
    url,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({
        fields: {
          [attachmentFieldIdOrName]: [
            { url: file.url, filename: file.filename },
          ],
        },
      }),
    },
    AIRTABLE_URL_ATTACH_TIMEOUT_MS,
  );
  return (await response.json()) as AirtableRecord;
}

/** Escape a string for use inside an Airtable formula single-quoted literal. */
export function escapeAirtableString(value: string): string {
  return value.replace(/'/g, "''");
}
