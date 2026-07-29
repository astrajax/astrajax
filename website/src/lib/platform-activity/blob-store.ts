import {
  BlobPreconditionFailedError,
  del,
  get,
  head,
  list,
  put,
} from "@vercel/blob";
import {
  getPlatformDeadLetterPrefix,
  getPlatformLeasePrefix,
  getPlatformOutboxPrefix,
  getPlatformWorkerLockPath,
} from "./config";
import type { PlatformOutboxItem, PlatformSessionLease } from "./types";

const PRIVATE_ACCESS = "private" as const;

function leasePath(publicSessionId: string): string {
  return `${getPlatformLeasePrefix()}${publicSessionId}.json`;
}

function queuePath(item: PlatformOutboxItem): string {
  return `${getPlatformOutboxPrefix()}${item.envelope.eventId}.json`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: PRIVATE_ACCESS, useCache: false });
  if (!result) return null;
  return (await new Response(result.stream).json()) as T;
}

export async function createLease(lease: PlatformSessionLease): Promise<void> {
  await put(leasePath(lease.publicSessionId), JSON.stringify(lease), {
    access: PRIVATE_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
  });
}

export async function readLease(publicSessionId: string): Promise<PlatformSessionLease | null> {
  return readJson<PlatformSessionLease>(leasePath(publicSessionId));
}

export async function mutateLease<T>(
  publicSessionId: string,
  mutation: (lease: PlatformSessionLease) => { lease: PlatformSessionLease; result: T },
): Promise<T> {
  const pathname = leasePath(publicSessionId);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const metadata = await head(pathname);
    const current = await readJson<PlatformSessionLease>(pathname);
    if (!current) throw new Error("Platform session lease not found.");
    const next = mutation(current);
    try {
      await put(pathname, JSON.stringify(next.lease), {
        access: PRIVATE_ACCESS,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        ifMatch: metadata.etag,
      });
      return next.result;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      throw error;
    }
  }

  throw new Error("Platform session lease was busy; retry the request.");
}

export async function enqueueOutboxItem(item: PlatformOutboxItem): Promise<string> {
  const pathname = queuePath(item);
  await put(pathname, JSON.stringify(item), {
    access: PRIVATE_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return pathname;
}

export async function readOutboxItem(pathname: string): Promise<PlatformOutboxItem | null> {
  return readJson<PlatformOutboxItem>(pathname);
}

export async function removeOutboxItem(pathname: string): Promise<void> {
  await del(pathname);
}

export async function requeueOutboxItem(
  pathname: string,
  item: PlatformOutboxItem,
): Promise<void> {
  await put(pathname, JSON.stringify(item), {
    access: PRIVATE_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function deadLetterOutboxItem(
  pathname: string,
  item: PlatformOutboxItem,
  error: string,
): Promise<void> {
  const name = pathname.slice(pathname.lastIndexOf("/") + 1);
  await put(
    `${getPlatformDeadLetterPrefix()}${name}`,
    JSON.stringify({ ...item, deadLetteredAt: new Date().toISOString(), error }),
    {
      access: PRIVATE_ACCESS,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    },
  );
  await removeOutboxItem(pathname);
}

export async function acquireOutboxWorkerLock(): Promise<boolean> {
  const pathname = getPlatformWorkerLockPath();
  const existing = await readJson<{ acquiredAt: string }>(pathname);
  if (existing) {
    const ageMs = Date.now() - new Date(existing.acquiredAt).getTime();
    if (ageMs < 60_000) return false;
    await del(pathname);
  }
  try {
    await put(pathname, JSON.stringify({ acquiredAt: new Date().toISOString() }), {
      access: PRIVATE_ACCESS,
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseOutboxWorkerLock(): Promise<void> {
  await del(getPlatformWorkerLockPath()).catch(() => undefined);
}

type ListedBlob = Awaited<ReturnType<typeof list>>["blobs"][number];

async function listAll(prefix: string): Promise<ListedBlob[]> {
  const blobs: ListedBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export function listLeaseBlobs() {
  return listAll(getPlatformLeasePrefix());
}

export function listOutboxBlobs() {
  return listAll(getPlatformOutboxPrefix());
}
