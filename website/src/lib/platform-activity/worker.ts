import {
  getHouseholdReadToken,
  getHouseholdWriteToken,
  getPlatformMaxAttempts,
  getPlatformQueueAgeAlertSeconds,
} from "./config";
import {
  acquireOutboxWorkerLock,
  deadLetterOutboxItem,
  listOutboxBlobs,
  readOutboxItem,
  requeueOutboxItem,
  releaseOutboxWorkerLock,
  removeOutboxItem,
} from "./blob-store";
import {
  createAirtableRecords,
  selectExistingEventIds,
} from "./airtable";
import { mapEnvelopeToActivityFields } from "./record-mapper";
import type { PlatformOutboxItem } from "./types";

const AIRTABLE_REQUEST_SPACING_MS = 260;
const BATCH_SIZE = 10;

type QueueEntry = {
  pathname: string;
  item: PlatformOutboxItem;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function partitionKey(item: PlatformOutboxItem): string {
  return `${item.target.baseId}:${item.target.tableId}`;
}

function retryAt(attempt: number): string {
  const exponential = Math.min(15 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 5_000);
  return new Date(Date.now() + exponential + jitter).toISOString();
}

async function handleFailedBatch(entries: QueueEntry[], error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : "Unknown outbox failure";
  await Promise.all(
    entries.map(async ({ pathname, item }) => {
      const attempt = item.attempt + 1;
      const next = { ...item, attempt, nextAttemptAt: retryAt(attempt) };
      if (attempt >= getPlatformMaxAttempts()) {
        await deadLetterOutboxItem(pathname, next, message);
        console.error("Platform activity event moved to dead letter queue", {
          eventId: item.envelope.eventId,
          attempt,
        });
        return;
      }
      await requeueOutboxItem(pathname, next);
    }),
  );
}

async function flushUnlocked(): Promise<{
  scanned: number;
  written: number;
  deduped: number;
  deferred: number;
  failed: number;
}> {
  const writeToken = getHouseholdWriteToken();
  const readToken = getHouseholdReadToken();
  if (!writeToken || !readToken) {
    throw new Error(
      "Outbox worker requires HOUSEHOLD_ACTIVITY_WRITE_TOKEN and HOUSEHOLD_ACTIVITY_READ_TOKEN.",
    );
  }

  const blobs = await listOutboxBlobs();
  const now = Date.now();
  const entries: QueueEntry[] = [];
  let deferred = 0;

  for (const blob of blobs) {
    const item = await readOutboxItem(blob.pathname);
    if (!item) continue;
    const ageSeconds = (now - new Date(item.queuedAt).getTime()) / 1000;
    if (ageSeconds > getPlatformQueueAgeAlertSeconds()) {
      console.error("Platform activity queue age alert", {
        eventId: item.envelope.eventId,
        ageSeconds: Math.round(ageSeconds),
      });
    }
    if (item.nextAttemptAt && new Date(item.nextAttemptAt).getTime() > now) {
      deferred += 1;
      continue;
    }
    entries.push({ pathname: blob.pathname, item });
  }

  const partitions = new Map<string, QueueEntry[]>();
  for (const entry of entries) {
    const key = partitionKey(entry.item);
    partitions.set(key, [...(partitions.get(key) ?? []), entry]);
  }

  let written = 0;
  let deduped = 0;
  let failed = 0;
  let requestCount = 0;

  for (const partition of partitions.values()) {
    for (let index = 0; index < partition.length; index += BATCH_SIZE) {
      const batch = partition.slice(index, index + BATCH_SIZE);
      const first = batch[0].item;
      try {
        if (requestCount > 0) await sleep(AIRTABLE_REQUEST_SPACING_MS);
        const existing = await selectExistingEventIds({
          baseId: first.target.baseId,
          tableId: first.target.tableId,
          token: readToken,
          eventIds: batch.map(({ item }) => item.envelope.eventId),
        });
        requestCount += 1;

        const missing = batch.filter(({ item }) => !existing.has(item.envelope.eventId));
        if (missing.length > 0) {
          await sleep(AIRTABLE_REQUEST_SPACING_MS);
          await createAirtableRecords({
            baseId: first.target.baseId,
            tableId: first.target.tableId,
            token: writeToken,
            records: missing.map(({ item }) => mapEnvelopeToActivityFields(item.envelope)),
          });
          requestCount += 1;
          written += missing.length;
        }

        deduped += batch.length - missing.length;
        await Promise.all(batch.map(({ pathname }) => removeOutboxItem(pathname)));
      } catch (error) {
        failed += batch.length;
        await handleFailedBatch(batch, error);
      }
    }
  }

  return { scanned: entries.length, written, deduped, deferred, failed };
}

export async function flushPlatformActivityOutbox(): Promise<{
  scanned: number;
  written: number;
  deduped: number;
  deferred: number;
  failed: number;
  locked: boolean;
}> {
  const acquired = await acquireOutboxWorkerLock();
  if (!acquired) {
    return { scanned: 0, written: 0, deduped: 0, deferred: 0, failed: 0, locked: true };
  }
  try {
    return { ...(await flushUnlocked()), locked: false };
  } finally {
    await releaseOutboxWorkerLock();
  }
}
