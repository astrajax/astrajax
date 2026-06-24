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

export async function approveKeyRequest(input: {
  requestId: string;
  approver: string;
  grantMaxUses?: number;
  grantExpiryMinutes?: number;
}): Promise<AccessGrant | null> {
  const store = getStore();
  const req = await store.getRequest(input.requestId);
  if (!req || req.status !== "pending") return null;

  await store.setRequestStatus(req.requestId, "approved");

  const minutes = input.grantExpiryMinutes ?? getDefaultGrantMinutes();
  const maxUses = input.grantMaxUses ?? getDefaultMaxUses();

  const grant = await store.createGrant({
    requestId: req.requestId,
    brainSlug: req.brainSlug,
    persona: req.persona,
    scope: req.scope,
    sessionId: req.sessionId,
    approvedBy: input.approver,
    grantMaxUses: maxUses,
    grantExpiryMinutes: minutes,
  });

  await appendChangeLog({
    changeSummary: `Grant issued for ${req.brainSlug}`,
    changeType: "Grant Issued",
    changedBy: input.approver,
    approvedBy: input.approver,
    reason: req.reason,
    affectedRecords: grant.grantId,
    source: "Brain Key API",
  });

  return grant;
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

export async function revokeGrantsForBrain(brainSlug: string): Promise<number> {
  const count = await getStore().revokeGrantsForBrain(brainSlug);
  if (count > 0) {
    await appendChangeLog({
      changeSummary: `Revoked ${count} grant(s) for ${brainSlug}`,
      changeType: "Grant Revoked",
      changedBy: "Brain Key API",
      affectedRecords: brainSlug,
      source: "Brain Key API",
    });
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
