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
    if (raced) return raced;
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
    if (peer) return peer;
    await store.setRequestStatus(req.requestId, "pending");
    throw error;
  }

  const resolved = (await resolveGrantForRequest(store, req.requestId)) ?? grant;

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

export async function rejectKeyRequest(requestId: string): Promise<boolean> {
  const store = getStore();
  const req = await store.getRequest(requestId);
  if (!req || req.status !== "pending") return false;
  return store.setRequestStatus(requestId, "rejected");
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
