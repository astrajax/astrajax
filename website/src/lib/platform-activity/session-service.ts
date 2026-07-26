import { randomUUID } from "node:crypto";
import { after } from "next/server";
import {
  getHouseholdBaseId,
  getHouseholdSessionsTableId,
  getHouseholdWriteToken,
  getPlatformIdleMinutes,
  platformActivityEventWritesEnabled,
  platformSessionEnabled,
} from "./config";
import { createAirtableRecord } from "./airtable";
import { createLease, enqueueOutboxItem, mutateLease, readLease } from "./blob-store";
import { createEnvelope, createEventId, toOutboxItem } from "./envelope";
import { HOUSEHOLD_SESSION_FIELDS } from "./ids";
import { codeManifest } from "./manifest";
import { flushPlatformActivityOutbox } from "./worker";
import { createPlatformSessionHandle, verifyPlatformSessionHandle } from "./signing";
import type {
  PlatformActivityEnvelope,
  PlatformSessionHandlePayload,
  PlatformSessionLease,
  PlatformSessionOutcome,
} from "./types";

export type StartPlatformSessionInput = {
  pageUrl?: string;
  parentSessionId?: string;
};

export type StartPlatformSessionResult = {
  enabled: boolean;
  handle?: string;
  publicSessionId?: string;
  sessionRecordId?: string;
};

export async function startPlatformSession(
  input: StartPlatformSessionInput,
): Promise<StartPlatformSessionResult> {
  if (!platformSessionEnabled()) return { enabled: false };

  const token = getHouseholdWriteToken();
  if (!token) throw new Error("HOUSEHOLD_ACTIVITY_WRITE_TOKEN is not configured.");

  const started = new Date().toISOString();
  const stamp = started.slice(0, 16).replace(/[-:]/g, "");
  const publicSessionId = `platform--${stamp}Z--${randomUUID().slice(0, 6)}`;
  const fields = HOUSEHOLD_SESSION_FIELDS;
  const session = await createAirtableRecord({
    baseId: getHouseholdBaseId(),
    tableId: getHouseholdSessionsTableId(),
    token,
    fields: {
      [fields.sessionId]: publicSessionId,
      ...(input.parentSessionId ? { [fields.parentSessionId]: input.parentSessionId } : {}),
      [fields.rootSessionId]: publicSessionId,
      [fields.agentSlug]: "astrajax-platform",
      [fields.agentName]: "AstraJax Platform",
      [fields.runtime]: "AstraJax Platform",
      [fields.trigger]: "Interactive",
      [fields.user]: "Visitor",
      [fields.started]: started,
      [fields.threadUrl]: input.pageUrl?.slice(0, 2000) || "https://astrajax.com",
      [fields.model]: "mixed",
    },
  });

  const payload: PlatformSessionHandlePayload = {
    v: 1,
    publicSessionId,
    sessionRecordId: session.id,
    issuedAt: started,
  };
  const handle = createPlatformSessionHandle(payload);
  const lease: PlatformSessionLease = {
    ...payload,
    parentSessionId: input.parentSessionId,
    handle,
    lastActivityAt: started,
    state: "active",
    nextSequence: 1,
  };
  await createLease(lease);
  return { enabled: true, handle, publicSessionId, sessionRecordId: session.id };
}

export async function reservePlatformSequences(
  handle: string,
  count = 1,
): Promise<{ session: PlatformSessionHandlePayload; sequences: number[] }> {
  const session = verifyPlatformSessionHandle(handle);
  const safeCount = Math.min(Math.max(1, Math.floor(count)), 20);
  const sequences = await mutateLease(session.publicSessionId, (lease) => {
    if (lease.sessionRecordId !== session.sessionRecordId || lease.handle !== handle) {
      throw new Error("Platform session lease does not match this handle.");
    }
    if (lease.state === "closed" || lease.state === "closing") {
      throw new Error("Platform session is closed.");
    }
    const start = lease.nextSequence;
    return {
      lease: {
        ...lease,
        state: "active",
        pausedAt: undefined,
        lastActivityAt: new Date().toISOString(),
        nextSequence: start + safeCount,
      },
      result: Array.from({ length: safeCount }, (_, index) => start + index),
    };
  });
  return { session, sequences };
}

function scheduleOutboxFlush(): void {
  try {
    after(async () => {
      await new Promise((resolve) => setTimeout(resolve, 650));
      await flushPlatformActivityOutbox().catch((error) => {
        console.error("Platform activity background flush failed", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    });
  } catch {
    // Non-request contexts rely on the scheduled worker endpoint.
  }
}

export async function queuePlatformEnvelope(envelope: PlatformActivityEnvelope): Promise<void> {
  if (!platformActivityEventWritesEnabled() && envelope.eventType !== "Session End") return;
  await enqueueOutboxItem(toOutboxItem(envelope));
  scheduleOutboxFlush();
}

export async function pausePlatformSession(handle: string): Promise<void> {
  const session = verifyPlatformSessionHandle(handle);
  await mutateLease(session.publicSessionId, (lease) => {
    if (lease.state === "closed" || lease.state === "closing") {
      return { lease, result: undefined };
    }
    const now = new Date().toISOString();
    return {
      lease: { ...lease, state: "paused", pausedAt: now, lastActivityAt: now },
      result: undefined,
    };
  });
}

export async function reopenPlatformSession(handle: string): Promise<"active" | "reopened" | "timed_out"> {
  const session = verifyPlatformSessionHandle(handle);
  const lease = await readLease(session.publicSessionId);
  if (!lease || lease.sessionRecordId !== session.sessionRecordId) {
    throw new Error("Platform session lease not found.");
  }

  const idleMs = Date.now() - new Date(lease.lastActivityAt).getTime();
  if (idleMs > getPlatformIdleMinutes() * 60_000) {
    await closePlatformSession(handle, "timed_out");
    return "timed_out";
  }
  if (lease.state === "active") {
    await mutateLease(session.publicSessionId, (current) => ({
      lease: { ...current, lastActivityAt: new Date().toISOString() },
      result: undefined,
    }));
    return "active";
  }

  const { sequences } = await reservePlatformSequences(handle, 1);
  const envelope = createEnvelope({
    session,
    sequence: sequences[0],
    eventId: createEventId(session.publicSessionId, "reopened", lease.lastActivityAt),
    eventType: "Action",
    summary: "Platform session reopened",
    model: "none",
    manifest: codeManifest({
      source: "platform-session",
      promptVersion: "session-lease-v1",
    }),
    outcome: "reopened",
    detail: { previousLastActivityAt: lease.lastActivityAt },
  });
  await queuePlatformEnvelope(envelope);
  return "reopened";
}

export async function closePlatformSession(
  handle: string,
  outcome: PlatformSessionOutcome,
): Promise<boolean> {
  const session = verifyPlatformSessionHandle(handle);
  const closeClaim = await mutateLease(session.publicSessionId, (lease) => {
    if (lease.state === "closed") {
      return {
        lease,
        result: null as { sequence: number; outcome: PlatformSessionOutcome } | null,
      };
    }
    if (lease.state === "closing") {
      return {
        lease,
        result: {
          sequence: Math.max(1, lease.nextSequence - 1),
          outcome: lease.outcome ?? outcome,
        },
      };
    }
    const sequence = lease.nextSequence;
    return {
      lease: {
        ...lease,
        state: "closing",
        outcome,
        lastActivityAt: new Date().toISOString(),
        nextSequence: sequence + 1,
      },
      result: { sequence, outcome },
    };
  });

  if (closeClaim === null) return false;
  const resolvedOutcome = closeClaim.outcome;

  const envelope = createEnvelope({
    session,
    sequence: closeClaim.sequence,
    eventId: createEventId(session.publicSessionId, "session-end", resolvedOutcome),
    eventType: "Session End",
    summary: `Platform session ended: ${resolvedOutcome}`,
    model: "none",
    manifest: codeManifest({
      source: "platform-session",
      promptVersion: "session-lease-v1",
    }),
    outcome: resolvedOutcome,
  });

  try {
    await queuePlatformEnvelope(envelope);
  } catch (error) {
    await mutateLease(session.publicSessionId, (lease) => ({
      lease: { ...lease, state: "paused" },
      result: undefined,
    }));
    throw error;
  }

  await mutateLease(session.publicSessionId, (lease) => ({
    lease: {
      ...lease,
      state: "closed",
      closedAt: new Date().toISOString(),
      outcome: resolvedOutcome,
    },
    result: undefined,
  }));
  return true;
}
