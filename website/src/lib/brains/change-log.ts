import { createHash, randomUUID } from "node:crypto";
import { airtableCreate, airtableSelect } from "./airtable-rest";
import {
  BRAIN_REGISTRY_CHANGE_LOG_FIELDS,
  BRAIN_REGISTRY_TABLES,
} from "./airtable-ids";
import { getRegistryBaseId, getRegistryWriteToken, useMemoryStore } from "./config";

/**
 * Change Log sort field. Airtable `createdTime` column on tbliAMUuKKW4DDRXF
 * (fldBlc1nSqMIYVxg1). Auto-populated — do not write it on create.
 * Formulas and sort still require the display name.
 */
export const CHANGE_LOG_CREATED_FIELD = "Created";

const F = BRAIN_REGISTRY_CHANGE_LOG_FIELDS;

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

  // Tip = single newest row by Created. Avoids forking the hash chain when
  // the table grows past one unsorted page of 100.
  const tip = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    maxRecords: 1,
    fields: [F.entryHash],
    sortField: CHANGE_LOG_CREATED_FIELD,
    sortDirection: "desc",
    returnFieldsByFieldId: true,
  });

  const previousHash = String(tip[0]?.fields[F.entryHash] ?? tip[0]?.fields["Entry Hash"] ?? "");
  const entryHash = hashContent(previousHash + canonicalEntryJson(entry));

  await airtableCreate(baseId, BRAIN_REGISTRY_TABLES.changeLog, token, {
    [F.entryId]: entryId(),
    [F.changeSummary]: entry.changeSummary,
    [F.changeType]: entry.changeType,
    [F.changedBy]: entry.changedBy,
    [F.approvedBy]: entry.approvedBy ?? "",
    [F.executingAgent]: entry.executingAgent ?? "",
    [F.source]: entry.source ?? "Brain Key API",
    [F.reason]: entry.reason ?? "",
    [F.affectedRecords]: entry.affectedRecords ?? "",
    [F.status]: "Recorded",
    [F.previousHash]: previousHash,
    [F.entryHash]: entryHash,
    [F.notes]: entry.notes ?? "",
  });
}

/** Test helper — records what would have been written in memory mode tests */
export function appendChangeLogForTests(entry: ChangeLogEntryInput): void {
  const previousHash =
    memoryChangeLog.length > 0
      ? String(memoryChangeLog[memoryChangeLog.length - 1].entryHash ?? "")
      : "";
  const entryHash = hashContent(previousHash + canonicalEntryJson(entry));
  memoryChangeLog.push({
    changeSummary: entry.changeSummary,
    changeType: entry.changeType,
    changedBy: entry.changedBy,
    previousHash,
    entryHash,
  });
}

export function getMemoryChangeLogForTests(): Array<Record<string, string>> {
  return [...memoryChangeLog];
}

export function clearMemoryChangeLogForTests(): void {
  memoryChangeLog.length = 0;
}
