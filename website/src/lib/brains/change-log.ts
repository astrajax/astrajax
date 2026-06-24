import { createHash, randomUUID } from "node:crypto";
import { airtableCreate, airtableSelect } from "./airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "./airtable-ids";
import { getRegistryBaseId, getRegistryWriteToken, useMemoryStore } from "./config";

function hashContent(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export interface ChangeLogEntryInput {
  changeSummary: string;
  changeType: string;
  changedBy: string;
  approvedBy?: string;
  executingAgent?: string;
  source?: string;
  reason?: string;
  affectedRecords?: string;
  notes?: string;
}

/** In-memory change log entries — tests only */
const memoryChangeLog: Array<Record<string, string>> = [];

function canonicalEntryJson(entry: ChangeLogEntryInput): string {
  return JSON.stringify({
    changeSummary: entry.changeSummary,
    changeType: entry.changeType,
    changedBy: entry.changedBy,
    approvedBy: entry.approvedBy ?? "",
    executingAgent: entry.executingAgent ?? "",
    source: entry.source ?? "",
    reason: entry.reason ?? "",
    affectedRecords: entry.affectedRecords ?? "",
    notes: entry.notes ?? "",
  });
}

function entryId(): string {
  return `cle_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function appendChangeLog(entry: ChangeLogEntryInput): Promise<void> {
  if (useMemoryStore()) {
    return;
  }

  const baseId = getRegistryBaseId();
  const token = getRegistryWriteToken();
  if (!baseId || !token) {
    throw new Error("Brain Registry is not configured.");
  }

  const latest = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    maxRecords: 100,
    fields: ["Entry Hash"],
  });

  const sorted = [...latest].sort((a, b) => {
    const aTime = a.createdTime ? Date.parse(a.createdTime) : 0;
    const bTime = b.createdTime ? Date.parse(b.createdTime) : 0;
    return bTime - aTime;
  });

  const previousHash = String(sorted[0]?.fields["Entry Hash"] ?? "");
  const entryHash = hashContent(previousHash + canonicalEntryJson(entry));

  await airtableCreate(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    "Entry ID": entryId(),
    "Change Summary": entry.changeSummary,
    "Change Type": entry.changeType,
    "Changed By": entry.changedBy,
    "Approved By": entry.approvedBy ?? "",
    "Executing Agent": entry.executingAgent ?? "",
    Source: entry.source ?? "Brain Key API",
    Reason: entry.reason ?? "",
    "Affected Records": entry.affectedRecords ?? "",
    Status: "Recorded",
    "Previous Hash": previousHash,
    "Entry Hash": entryHash,
    Notes: entry.notes ?? "",
  });
}

/** Test helper — records what would have been written in memory mode tests */
export function appendChangeLogForTests(entry: ChangeLogEntryInput): void {
  const previousHash =
    memoryChangeLog.length > 0
      ? String(memoryChangeLog[memoryChangeLog.length - 1]["Entry Hash"] ?? "")
      : "";
  const entryHash = hashContent(previousHash + canonicalEntryJson(entry));
  memoryChangeLog.push({
    "Change Summary": entry.changeSummary,
    "Change Type": entry.changeType,
    "Changed By": entry.changedBy,
    "Previous Hash": previousHash,
    "Entry Hash": entryHash,
  });
}

export function getMemoryChangeLogForTests(): Array<Record<string, string>> {
  return [...memoryChangeLog];
}

export function clearMemoryChangeLogForTests(): void {
  memoryChangeLog.length = 0;
}
