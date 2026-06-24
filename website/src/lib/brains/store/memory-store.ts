import { randomUUID } from "node:crypto";
import type {
  AccessGrant,
  AccessGrantStatus,
  BrainKeyRequest,
  BrainKeyRequestStatus,
  PersonaId,
} from "../types";
import type { GrantStore } from "./index";

const requests = new Map<string, BrainKeyRequest>();
const grants = new Map<string, AccessGrant>();

function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function refreshGrantStatus(grant: AccessGrant): void {
  if (grant.status !== "active") return;
  if (new Date(grant.expiresAt) < new Date()) {
    grant.status = "expired";
    grants.set(grant.grantId, grant);
    return;
  }
  if (grant.useCount >= grant.maxUses) {
    grant.status = "expired";
    grants.set(grant.grantId, grant);
  }
}

function expirePendingRequest(req: BrainKeyRequest): BrainKeyRequest {
  if (req.status === "pending" && new Date(req.expiresAt) < new Date()) {
    req.status = "expired";
    requests.set(req.requestId, req);
  }
  return req;
}

export const memoryStore: GrantStore = {
  async createRequest(input) {
    const request: BrainKeyRequest = {
      requestId: id("bkr"),
      brainSlug: input.brainSlug,
      persona: input.persona,
      purpose: input.purpose,
      scope: input.scope,
      reason: input.reason,
      sessionId: input.sessionId,
      status: "pending",
      requestedAt: nowIso(),
      expiresAt: addMinutes(input.requestedExpiryMinutes),
    };
    requests.set(request.requestId, request);
    return request;
  },

  async getRequest(requestId) {
    const req = requests.get(requestId);
    if (!req) return undefined;
    return expirePendingRequest(req);
  },

  async setRequestStatus(requestId, status) {
    const req = await this.getRequest(requestId);
    if (!req) return false;
    req.status = status;
    requests.set(requestId, req);
    return true;
  },

  async createGrant(input) {
    const grant: AccessGrant = {
      grantId: id("grt"),
      requestId: input.requestId,
      brainSlug: input.brainSlug,
      persona: input.persona,
      scope: input.scope,
      sessionId: input.sessionId,
      approvedBy: input.approvedBy,
      approvedAt: nowIso(),
      expiresAt: addMinutes(input.grantExpiryMinutes),
      maxUses: input.grantMaxUses,
      useCount: 0,
      status: "active",
    };
    grants.set(grant.grantId, grant);
    return grant;
  },

  async getGrant(grantId) {
    const grant = grants.get(grantId);
    if (!grant) return undefined;
    refreshGrantStatus(grant);
    return grants.get(grantId);
  },

  async incrementGrantUse(grantId) {
    const grant = await this.getGrant(grantId);
    if (!grant || grant.status !== "active") return null;
    grant.useCount += 1;
    refreshGrantStatus(grant);
    grants.set(grantId, grant);
    return grant;
  },

  async setGrantStatus(grantId, status) {
    const grant = grants.get(grantId);
    if (!grant) return false;
    grant.status = status;
    grants.set(grantId, grant);
    return true;
  },

  async revokeGrantsForBrain(brainSlug) {
    let count = 0;
    for (const [grantId, grant] of grants) {
      if (grant.brainSlug === brainSlug && grant.status === "active") {
        grant.status = "revoked";
        grants.set(grantId, grant);
        count += 1;
      }
    }
    return count;
  },

  resetForTests() {
    requests.clear();
    grants.clear();
  },
};
