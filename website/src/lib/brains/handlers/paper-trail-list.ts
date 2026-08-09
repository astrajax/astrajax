import { airtableSelect } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryReadToken, useMemoryStore } from "../config";
import { getMemoryChangeLogForTests } from "../change-log";
import type { PaperTrailEntry } from "@/lib/curation/types";

/**
 * KNOWN GAP: brainSlug is accepted but cannot be honoured — the Registry
 * Change Log table has no brain column, so every caller sees the whole
 * Registry trail regardless of the brain they asked for. Filtering needs a
 * "Brain Slug" field added to tbliAMUuKKW4DDRXF first; that is a schema
 * decision, not something to fake here.
 */
export async function handlePaperTrailList(input: {
  brainSlug: string;
  limit?: number;
}): Promise<{ entries: PaperTrailEntry[]; mode: "airtable" | "memory" }> {
  const limit = input.limit ?? 25;

  if (useMemoryStore()) {
    return {
      mode: "memory",
      entries: getMemoryChangeLogForTests().slice(0, limit).map((row, index) => ({
        id: `mem_pt_${index}`,
        action: String(row["Change Summary"] ?? "Change logged"),
        actor: String(row["Changed By"] ?? "System"),
        reason: String(row["Change Type"] ?? ""),
        timestamp: new Date().toISOString(),
        destination: "registry-change-log",
      })),
    };
  }

  const baseId = getRegistryBaseId();
  const token = getRegistryReadToken() ?? process.env.BRAIN_KEY_ADMIN_TOKEN;
  if (!baseId || !token) {
    return { mode: "memory", entries: [] };
  }

  // The Change Log table has no date column, so Airtable cannot sort for us —
  // asking it to sort on "Created" made every live call fail with a 422. Over-
  // fetch instead and order by the record's own createdTime here.
  const records = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    maxRecords: Math.min(limit * 4, 100),
  });

  const entries: PaperTrailEntry[] = records
    .map((record) => ({
      id: record.id,
      action: String(record.fields["Change Summary"] ?? "Change logged"),
      actor: String(record.fields["Changed By"] ?? "System"),
      reason: String(record.fields.Reason ?? record.fields["Change Type"] ?? ""),
      timestamp: record.createdTime ?? new Date().toISOString(),
      destination: "registry-change-log" as const,
      recordId: record.id,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);

  return { mode: "airtable", entries };
}
