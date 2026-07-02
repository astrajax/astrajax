import { airtableSelect } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryReadToken, useMemoryStore } from "../config";
import { getMemoryChangeLogForTests } from "../change-log";
import type { PaperTrailEntry } from "@/lib/curation/types";

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
    sortField: "Created",
    sortDirection: "desc",
  });

  const entries: PaperTrailEntry[] = records.map((record) => ({
    id: record.id,
    action: String(record.fields["Change Summary"] ?? "Change logged"),
    actor: String(record.fields["Changed By"] ?? "System"),
    reason: String(record.fields.Reason ?? record.fields["Change Type"] ?? ""),
    timestamp: record.createdTime ?? new Date().toISOString(),
    destination: "registry-change-log",
    recordId: record.id,
  }));

  return { mode: "airtable", entries };
}
