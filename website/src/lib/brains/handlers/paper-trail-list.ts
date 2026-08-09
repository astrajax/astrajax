import { airtableSelect } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryReadToken, useMemoryStore } from "../config";
import { CHANGE_LOG_CREATED_FIELD, getMemoryChangeLogForTests } from "../change-log";
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

  const records = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    maxRecords: limit,
    sortField: CHANGE_LOG_CREATED_FIELD,
    sortDirection: "desc",
  });

  const entries: PaperTrailEntry[] = records.map((record) => ({
    id: record.id,
    action: String(record.fields["Change Summary"] ?? "Change logged"),
    actor: String(record.fields["Changed By"] ?? "System"),
    reason: String(record.fields.Reason ?? record.fields["Change Type"] ?? ""),
    timestamp:
      String(record.fields[CHANGE_LOG_CREATED_FIELD] ?? "") ||
      record.createdTime ||
      new Date().toISOString(),
    destination: "registry-change-log" as const,
    recordId: record.id,
  }));

  return { mode: "airtable", entries };
}
