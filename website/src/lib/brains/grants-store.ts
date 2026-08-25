import { createHash } from "node:crypto";
import { appendChangeLog } from "./change-log";
import { getDefaultGrantMinutes, getDefaultMaxUses, useMemoryStore } from "./config";
import type { AccessGrant, BrainKeyRequest, PersonaId } from "./types";
import { airtableStore } from "./store/airtable-store";
import type { GrantStore } from "./store/index";
import { memoryStore } from "./store/memory-store";

export function getStore(): GrantStore {
  return useMemoryStore() ? memoryStore : airtableStore;
}

export async function createKeyRequest(input: {
  brainSlug: string;
  persona: PersonaId;
  purpose: string;
  scope: string;
  reason: string;
  sessionId: string;
  requestedExpiryMinutes?: number;
}): Promise<BrainKeyRequest> {
  const minutes = input.requestedExpiryMinutes ?? getDefaultGrantMinutes();
  return getStore().createRequest({
    ...input,
    requestedExpiryMinutes: minutes,
  });
}

export async function getKeyRequest(
  requestId: string,
): Promise<BrainKeyRequest | undefined> {
  return getStore().getRequest(requestId);
}

/**
 * Prefer an active grant for the request; otherwise the earliest-approved row.
 * Revokes duplicate actives so a raced double-mint collapses to one usable key.
 */
async function resolveGrantForRequest(
  store: GrantStore,
  requestId: string,
): Promise<AccessGrant | null> {
  const grants = await store.listGrantsByRequestId(requestId);
  if (grants.length === 0) return null;

  const sorted = [...grants].sort((a, b) => a.approvedAt.localeCompare(b.approvedAt));
  const kept =
    sorted.find((grant) => grant.status === "active") ?? sorted[0] ?? null;
  if (!kept) return null;

  for (const grant of sorted) {
    if (grant.grantId === kept.grantId) continue;
    if (grant.status === "active") {
      await store.setGrantStatus(grant.grantId, "revoked");
    }
  }

  return kept.status === "revoked" ? null : kept;
}

/** Revoke every Active grant minted for a key request (approve↔reject races). */
async function revokeActiveGrantsForRequest(
  store: GrantStore,
  requestId: string,
): Promise<number> {
  const grants = await store.listGrantsByRequestId(requestId);
  let count = 0;
  for (const grant of grants) {
    if (grant.status !== "active") continue;
    await store.setGrantStatus(grant.grantId, "revoked");
    count += 1;
  }
  return count;
}

export async function approveKeyRequest(input: {
  requestId: string;
  approver: string;
  grantMaxUses?: number;
  grantExpiryMinutes?: number;
}): Promise<AccessGrant | null> {
  const store = getStore();
  const req = await store.getRequest(input.requestId);
  if (!req) return null;

  // Idempotent retry: if a prior approve minted a grant but the client never
  // received grantId (e.g. paper-trail write failed), return the existing key.
  if (req.status === "approved") {
    const existing = await resolveGrantForRequest(store, req.requestId);
    if (existing) return existing;
    // Approved with no grant — fall through and mint (crash between claim and create).
  } else if (req.status !== "pending") {
    return null;
  } else {
    // Claim the pending request first so concurrent approves cannot each assume
    // ownership without coordination. Grant create still dedupes below.
    await store.setRequestStatus(req.requestId, "approved");

    const raced = await resolveGrantForRequest(store, req.requestId);
    if (raced) {
      // Reject may have flipped Status after minting a peer grant — fail closed.
      const afterRace = await store.getRequest(req.requestId);
      if (afterRace?.status === "rejected") {
        await revokeActiveGrantsForRequest(store, req.requestId);
        return null;
      }
      return raced;
    }
  }

  // Reject wins Status races: do not mint when the request is no longer approved.
  const claimed = await store.getRequest(req.requestId);
  if (claimed?.status === "rejected") {
    await revokeActiveGrantsForRequest(store, req.requestId);
    return null;
  }
  if (claimed?.status !== "approved") {
    return null;
  }

  const minutes = input.grantExpiryMinutes ?? getDefaultGrantMinutes();
  const maxUses = input.grantMaxUses ?? getDefaultMaxUses();

  let grant: AccessGrant;
  try {
    grant = await store.createGrant({
      requestId: req.requestId,
      brainSlug: req.brainSlug,
      persona: req.persona,
      scope: req.scope,
      sessionId: req.sessionId,
      approvedBy: input.approver,
      grantMaxUses: maxUses,
      grantExpiryMinutes: minutes,
    });
  } catch (error) {
    const peer = await resolveGrantForRequest(store, req.requestId);
    if (peer) {
      const afterPeer = await store.getRequest(req.requestId);
      if (afterPeer?.status === "rejected") {
        await revokeActiveGrantsForRequest(store, req.requestId);
        return null;
      }
      return peer;
    }
    const current = await store.getRequest(req.requestId);
    // Never roll a concurrent reject back to pending.
    if (current?.status !== "rejected") {
      await store.setRequestStatus(req.requestId, "pending");
    } else {
      await revokeActiveGrantsForRequest(store, req.requestId);
    }
    throw error;
  }

  const resolved = (await resolveGrantForRequest(store, req.requestId)) ?? grant;

  // Reject may have landed after createGrant — revoke and refuse rather than
  // hand out a key the request row already marks rejected.
  const finalReq = await store.getRequest(req.requestId);
  if (finalReq?.status === "rejected") {
    await revokeActiveGrantsForRequest(store, req.requestId);
    return null;
  }

  // Paper trail must not orphan a minted grant from the caller — retry would
  // otherwise see "approved" with no grantId in the failed response.
  try {
    await appendChangeLog({
      changeSummary: `Grant issued for ${req.brainSlug}`,
      changeType: "Grant Issued",
      changedBy: input.approver,
      approvedBy: input.approver,
      reason: req.reason,
      affectedRecords: resolved.grantId,
      source: "Brain Key API",
    });
  } catch {
    // Best-effort audit only.
  }

  return resolved;
}

/**
 * Reject a Brain Key request. Pending is the normal path; Approved is allowed
 * so a concurrent/late reject can still kill a raced mint (and as a kill switch).
 * Always revokes Active grants for the request — Status alone is not enough when
 * approve and reject race on the same requestId.
 */
export async function rejectKeyRequest(requestId: string): Promise<boolean> {
  const store = getStore();
  const req = await store.getRequest(requestId);
  if (!req) return false;

  if (req.status === "rejected") {
    await revokeActiveGrantsForRequest(store, requestId);
    return true;
  }
  if (req.status !== "pending" && req.status !== "approved") {
    return false;
  }

  await store.setRequestStatus(requestId, "rejected");
  await revokeActiveGrantsForRequest(store, requestId);

  // Approve may overwrite Status back to approved and mint after our write.
  // Re-assert rejected + revoke until status sticks or we exhaust retries.
  for (let attempt = 0; attempt < 3; attempt++) {
    const after = await store.getRequest(requestId);
    if (!after) return false;
    if (after.status === "rejected") {
      await revokeActiveGrantsForRequest(store, requestId);
      return true;
    }
    if (after.status === "approved") {
      await store.setRequestStatus(requestId, "rejected");
      await revokeActiveGrantsForRequest(store, requestId);
      continue;
    }
    return false;
  }

  await revokeActiveGrantsForRequest(store, requestId);
  return (await store.getRequest(requestId))?.status === "rejected";
}

export async function getGrant(grantId: string): Promise<AccessGrant | undefined> {
  return getStore().getGrant(grantId);
}

export async function consumeGrantUse(grantId: string): Promise<AccessGrant | null> {
  return getStore().incrementGrantUse(grantId);
}

export async function restoreGrantUse(grantId: string): Promise<AccessGrant | null> {
  return getStore().restoreGrantUse(grantId);
}

export async function revokeGrantsForBrain(brainSlug: string): Promise<number> {
  const count = await getStore().revokeGrantsForBrain(brainSlug);
  if (count > 0) {
    // Audit must not undo a completed revoke (e.g. after Trusted promote).
    try {
      await appendChangeLog({
        changeSummary: `Revoked ${count} grant(s) for ${brainSlug}`,
        changeType: "Grant Revoked",
        changedBy: "Brain Key API",
        affectedRecords: brainSlug,
        source: "Brain Key API",
      });
    } catch {
      // Best-effort paper trail only.
    }
  }
  return count;
}

export function hashContent(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export function isMemoryBackend(): boolean {
  return useMemoryStore();
}

/** Reset in-memory store — tests only */
export function resetMemoryStoreForTests(): void {
  memoryStore.resetForTests?.();
}
