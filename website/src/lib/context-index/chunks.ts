import type { ContextIndexSource } from "./sources";

export type AirtableSyncRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

export type ContextChunk = {
  recordId: string;
  fieldPath: string;
  content: string;
  approvedAt: string | null;
  modifiedAt: string;
};

/**
 * Airtable rows are already atomic — one field = one chunk.
 * Prefix non-label fields with the record title so the embedding stands alone.
 */
export function toChunks(
  source: ContextIndexSource,
  rec: AirtableSyncRecord,
): ContextChunk[] {
  const label = String(rec.fields[source.labelField] ?? "").trim();
  const modifiedAt = rec.createdTime;
  const approvedAt = source.approvedField
    ? ((rec.fields[source.approvedField] as string | undefined) ?? null)
    : null;

  return source.fields
    .map((field) => {
      const raw = rec.fields[field];
      if (raw == null) return null;
      const value = Array.isArray(raw) ? raw.join(", ") : String(raw);
      if (!value.trim()) return null;

      return {
        recordId: rec.id,
        fieldPath: field,
        content:
          label && field !== source.labelField
            ? `${label} — ${field}: ${value}`
            : value,
        approvedAt,
        modifiedAt,
      };
    })
    .filter((c): c is ContextChunk => c !== null);
}
