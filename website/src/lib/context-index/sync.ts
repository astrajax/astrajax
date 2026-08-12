import {
  getContextIndexEmbeddingModel,
  getOpenAiApiKey,
} from "./config";
import { toChunks, type AirtableSyncRecord, type ContextChunk } from "./chunks";
import { getContextIndexSql, toVectorLiteral } from "./db";
import {
  getSourceReadToken,
  sourceKey,
  type ContextIndexSource,
} from "./sources";

const AIRTABLE_API = "https://api.airtable.com/v0";

/**
 * Fetch records modified since `since`. Airtable exposes LAST_MODIFIED_TIME()
 * as a formula — incremental without webhooks.
 * Watermark advances to run start time (not record createdTime) so edits are caught.
 *
 * Paginate until Airtable reports no further `offset`. A hard page cap used to stop
 * after 500 rows and still advance the watermark — permanently skipping the rest
 * until those rows were edited again.
 */
async function fetchChanged(
  source: ContextIndexSource,
  token: string,
  since: Date | null,
): Promise<AirtableSyncRecord[]> {
  const out: AirtableSyncRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (source.viewId) params.set("view", source.viewId);
    for (const field of source.fields) {
      params.append("fields[]", field);
    }
    if (source.approvedField) {
      params.append("fields[]", source.approvedField);
    }
    if (since) {
      params.set(
        "filterByFormula",
        `IS_AFTER(LAST_MODIFIED_TIME(), DATETIME_PARSE("${since.toISOString()}"))`,
      );
    }
    if (offset) params.set("offset", offset);

    const res = await fetch(
      `${AIRTABLE_API}/${source.baseId}/${source.tableId}?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as {
      records: AirtableSyncRecord[];
      offset?: string;
    };
    out.push(...json.records);
    offset = json.offset;
  } while (offset);

  return out;
}

/** Cheap ID-only fetch for the reconcile pass. */
async function fetchAllIds(
  source: ContextIndexSource,
  token: string,
): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (source.viewId) params.set("view", source.viewId);
    params.append("fields[]", source.labelField);
    if (offset) params.set("offset", offset);

    const res = await fetch(
      `${AIRTABLE_API}/${source.baseId}/${source.tableId}?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as { records: { id: string }[]; offset?: string };
    json.records.forEach((r) => ids.add(r.id));
    offset = json.offset;
  } while (offset);

  return ids;
}

async function embed(texts: string[]): Promise<number[][]> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const vectors: number[][] = [];
  const model = getContextIndexEmbeddingModel();

  for (let i = 0; i < texts.length; i += 96) {
    const batch = texts.slice(i, i + 96);
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: batch }),
    });
    if (!res.ok) throw new Error(`Embeddings ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data: { embedding: number[] }[] };
    vectors.push(...json.data.map((d) => d.embedding));
  }

  return vectors;
}

async function upsert(
  source: ContextIndexSource,
  chunks: ContextChunk[],
  vectors: number[][],
): Promise<number> {
  const sql = getContextIndexSql();
  let n = 0;

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const embedding = toVectorLiteral(vectors[i]);
    await sql`
      INSERT INTO context_chunks
        (client_id, airtable_base, airtable_table, record_id, field_path,
         content, embedding, approved_at, source_modified_at, synced_at)
      VALUES
        (${source.clientId}, ${source.baseId}, ${source.tableId}, ${c.recordId},
         ${c.fieldPath}, ${c.content}, ${embedding}::vector,
         ${c.approvedAt}, ${c.modifiedAt}, now())
      ON CONFLICT (client_id, airtable_base, airtable_table, record_id, field_path)
      DO UPDATE SET
        content            = EXCLUDED.content,
        embedding          = EXCLUDED.embedding,
        approved_at        = EXCLUDED.approved_at,
        source_modified_at = EXCLUDED.source_modified_at,
        synced_at          = now()
    `;
    n += 1;
  }
  return n;
}

async function pruneEmptyFields(
  source: ContextIndexSource,
  rec: AirtableSyncRecord,
  kept: string[],
): Promise<void> {
  const sql = getContextIndexSql();
  if (kept.length === 0) {
    await sql`
      DELETE FROM context_chunks
      WHERE client_id = ${source.clientId}
        AND airtable_base = ${source.baseId}
        AND airtable_table = ${source.tableId}
        AND record_id = ${rec.id}
    `;
    return;
  }

  await sql`
    DELETE FROM context_chunks
    WHERE client_id = ${source.clientId}
      AND airtable_base = ${source.baseId}
      AND airtable_table = ${source.tableId}
      AND record_id = ${rec.id}
      AND NOT (field_path = ANY(${kept}))
  `;
}

export async function runIncremental(source: ContextIndexSource) {
  const sql = getContextIndexSql();
  const token = getSourceReadToken(source);
  if (!token) {
    throw new Error(`${source.tokenEnvKey} is not configured.`);
  }

  const key = sourceKey(source);
  const runStartedAt = new Date();
  const [{ id: runId }] = await sql`
    INSERT INTO sync_runs (source_key, mode) VALUES (${key}, 'incremental')
    RETURNING id
  `;

  try {
    const [state] = await sql`
      SELECT watermark FROM sync_state WHERE source_key = ${key}
    `;
    const since = state?.watermark ? new Date(String(state.watermark)) : null;

    const records = await fetchChanged(source, token, since);
    if (records.length === 0) {
      await sql`
        UPDATE sync_state SET last_run_at = now(), last_error = NULL
        WHERE source_key = ${key}
      `;
      await sql`
        UPDATE sync_runs SET finished_at = now() WHERE id = ${runId}
      `;
      return { fetched: 0, upserted: 0 };
    }

    const chunks = records.flatMap((r) => toChunks(source, r));
    let upserted = 0;
    if (chunks.length > 0) {
      const vectors = await embed(chunks.map((c) => c.content));
      upserted = await upsert(source, chunks, vectors);
    }

    // Always prune — including the zero-chunk path where cleared fields must
    // drop stale embeddings before the watermark advances past these rows.
    for (const rec of records) {
      const kept = chunks
        .filter((c) => c.recordId === rec.id)
        .map((c) => c.fieldPath);
      await pruneEmptyFields(source, rec, kept);
    }

    await sql`
      INSERT INTO sync_state (source_key, watermark, last_run_at, last_error)
      VALUES (${key}, ${runStartedAt.toISOString()}, now(), NULL)
      ON CONFLICT (source_key) DO UPDATE SET
        watermark = EXCLUDED.watermark, last_run_at = now(), last_error = NULL
    `;
    await sql`
      UPDATE sync_runs
      SET finished_at = now(), fetched = ${records.length},
          embedded = ${chunks.length}, upserted = ${upserted}
      WHERE id = ${runId}
    `;

    return { fetched: records.length, upserted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`UPDATE sync_runs SET finished_at = now(), error = ${msg} WHERE id = ${runId}`;
    await sql`
      INSERT INTO sync_state (source_key, last_run_at, last_error)
      VALUES (${key}, now(), ${msg})
      ON CONFLICT (source_key) DO UPDATE SET last_run_at = now(), last_error = ${msg}
    `;
    throw err;
  }
}

/**
 * Catches deletions and un-approvals the incremental pass cannot see.
 * Run daily, not every 15 minutes.
 */
export async function runReconcile(source: ContextIndexSource) {
  const sql = getContextIndexSql();
  const token = getSourceReadToken(source);
  if (!token) {
    throw new Error(`${source.tokenEnvKey} is not configured.`);
  }

  const key = sourceKey(source);
  const [{ id: runId }] = await sql`
    INSERT INTO sync_runs (source_key, mode) VALUES (${key}, 'reconcile')
    RETURNING id
  `;

  try {
    const liveIds = Array.from(await fetchAllIds(source, token));

    const deleted =
      liveIds.length === 0
        ? await sql`
            DELETE FROM context_chunks
            WHERE client_id = ${source.clientId}
              AND airtable_base = ${source.baseId}
              AND airtable_table = ${source.tableId}
            RETURNING id
          `
        : await sql`
            DELETE FROM context_chunks
            WHERE client_id = ${source.clientId}
              AND airtable_base = ${source.baseId}
              AND airtable_table = ${source.tableId}
              AND NOT (record_id = ANY(${liveIds}))
            RETURNING id
          `;

    await sql`
      UPDATE sync_runs
      SET finished_at = now(), fetched = ${liveIds.length}, deleted = ${deleted.length}
      WHERE id = ${runId}
    `;
    await sql`
      INSERT INTO sync_state (source_key, last_reconcile, last_run_at, last_error)
      VALUES (${key}, now(), now(), NULL)
      ON CONFLICT (source_key) DO UPDATE SET
        last_reconcile = now(), last_run_at = now(), last_error = NULL
    `;

    return { live: liveIds.length, deleted: deleted.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await sql`UPDATE sync_runs SET finished_at = now(), error = ${msg} WHERE id = ${runId}`;
    throw err;
  }
}
