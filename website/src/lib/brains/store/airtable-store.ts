import { randomUUID } from "node:crypto";
import {
  airtableCreate,
  airtableFindOne,
  airtableSelect,
  airtableUpdate,
  escapeAirtableString,
} from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import {
  getRegistryBaseId,
  getRegistryWriteToken,
} from "../config";
import type {
  AccessGrant,
  AccessGrantStatus,
  BrainKeyRequest,
  BrainKeyRequestStatus,
  PersonaId,
} from "../types";
import type { GrantStore } from "./index";

function id(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function toRequestStatus(status: BrainKeyRequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function fromRequestStatus(value: unknown): BrainKeyRequestStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "expired"
  ) {
    return normalized;
  }
  return "pending";
}

function toGrantStatus(status: AccessGrantStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function fromGrantStatus(value: unknown): AccessGrantStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "active" || normalized === "revoked" || normalized === "expired") {
    return normalized;
  }
  return "active";
}

function mapRequestRecord(record: { id: string; fields: Record<string, unknown> }): BrainKeyRequest {
  return {
    requestId: String(record.fields["Request ID"] ?? ""),
    brainSlug: String(record.fields["Brain Slug"] ?? ""),
    persona: String(record.fields["Persona"] ?? "clive").toLowerCase() as PersonaId,
    purpose: String(record.fields["Purpose"] ?? ""),
    scope: String(record.fields["Scope"] ?? ""),
    reason: String(record.fields["Reason"] ?? ""),
    sessionId: String(record.fields["Session ID"] ?? ""),
    status: fromRequestStatus(record.fields["Status"]),
    requestedAt: String(record.fields["Requested At"] ?? nowIso()),
    expiresAt: String(record.fields["Expires At"] ?? nowIso()),
  };
}

function mapGrantRecord(record: { id: string; fields: Record<string, unknown> }): AccessGrant {
  return {
    grantId: String(record.fields["Grant ID"] ?? ""),
    requestId: String(record.fields["Request ID"] ?? ""),
    brainSlug: String(record.fields["Brain Slug"] ?? ""),
    persona: String(record.fields["Persona"] ?? "clive").toLowerCase() as PersonaId,
    scope: String(record.fields["Scope"] ?? ""),
    sessionId: String(record.fields["Session ID"] ?? ""),
    approvedBy: String(record.fields["Approved By"] ?? ""),
    approvedAt: String(record.fields["Approved At"] ?? nowIso()),
    expiresAt: String(record.fields["Expires At"] ?? nowIso()),
    maxUses: Number(record.fields["Max Uses"] ?? 0),
    useCount: Number(record.fields["Use Count"] ?? 0),
    status: fromGrantStatus(record.fields["Status"]),
  };
}

function getRegistryConfig(): { baseId: string; token: string } {
  const baseId = getRegistryBaseId();
  const token = getRegistryWriteToken();
  if (!baseId || !token) {
    throw new Error("Brain Registry is not configured.");
  }
  return { baseId, token };
}

function refreshGrantStatus(grant: AccessGrant): AccessGrant {
  if (grant.status !== "active") return grant;
  if (new Date(grant.expiresAt) < new Date()) {
    return { ...grant, status: "expired" };
  }
  if (grant.useCount >= grant.maxUses) {
    return { ...grant, status: "expired" };
  }
  return grant;
}

export const airtableStore: GrantStore = {
  async createRequest(input) {
    const { baseId, token } = getRegistryConfig();
    const requestId = id("bkr");
    const requestedAt = nowIso();
    const expiresAt = addMinutes(input.requestedExpiryMinutes);

    await airtableCreate(baseId, BRAIN_REGISTRY_TABLES.keyRequests, token, {
      "Request ID": requestId,
      "Brain Slug": input.brainSlug,
      Persona: input.persona,
      Purpose: input.purpose,
      Scope: input.scope,
      Reason: input.reason,
      "Session ID": input.sessionId,
      Status: "Pending",
      "Requested At": requestedAt,
      "Expires At": expiresAt,
    });

    return {
      requestId,
      brainSlug: input.brainSlug,
      persona: input.persona,
      purpose: input.purpose,
      scope: input.scope,
      reason: input.reason,
      sessionId: input.sessionId,
      status: "pending",
      requestedAt,
      expiresAt,
    };
  },

  async getRequest(requestId) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(requestId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.keyRequests,
      token,
      `{Request ID}='${escaped}'`,
    );
    if (!record) return undefined;

    const req = mapRequestRecord(record);
    if (req.status === "pending" && new Date(req.expiresAt) < new Date()) {
      await this.setRequestStatus(requestId, "expired");
      return { ...req, status: "expired" };
    }
    return req;
  },

  async setRequestStatus(requestId, status) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(requestId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.keyRequests,
      token,
      `{Request ID}='${escaped}'`,
    );
    if (!record) return false;

    await airtableUpdate(baseId, BRAIN_REGISTRY_TABLES.keyRequests, token, record.id, {
      Status: toRequestStatus(status),
    });
    return true;
  },

  async createGrant(input) {
    const { baseId, token } = getRegistryConfig();
    const grantId = id("grt");
    const approvedAt = nowIso();
    const expiresAt = addMinutes(input.grantExpiryMinutes);

    await airtableCreate(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, {
      "Grant ID": grantId,
      "Request ID": input.requestId,
      "Brain Slug": input.brainSlug,
      Persona: input.persona,
      Scope: input.scope,
      "Session ID": input.sessionId,
      "Approved By": input.approvedBy,
      "Approved At": approvedAt,
      "Expires At": expiresAt,
      "Max Uses": input.grantMaxUses,
      "Use Count": 0,
      Status: "Active",
    });

    return {
      grantId,
      requestId: input.requestId,
      brainSlug: input.brainSlug,
      persona: input.persona,
      scope: input.scope,
      sessionId: input.sessionId,
      approvedBy: input.approvedBy,
      approvedAt,
      expiresAt,
      maxUses: input.grantMaxUses,
      useCount: 0,
      status: "active",
    };
  },

  async getGrant(grantId) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(grantId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.accessGrants,
      token,
      `{Grant ID}='${escaped}'`,
    );
    if (!record) return undefined;
    return refreshGrantStatus(mapGrantRecord(record));
  },

  async listGrantsByRequestId(requestId) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(requestId);
    const records = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, {
      filterByFormula: `{Request ID}='${escaped}'`,
      maxRecords: 20,
    });
    return records.map((record) => refreshGrantStatus(mapGrantRecord(record)));
  },

  async incrementGrantUse(grantId) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(grantId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.accessGrants,
      token,
      `{Grant ID}='${escaped}'`,
    );
    if (!record) return null;

    const grant = refreshGrantStatus(mapGrantRecord(record));
    if (grant.status !== "active") return null;

    const nextUseCount = grant.useCount + 1;
    const nextStatus =
      nextUseCount >= grant.maxUses || new Date(grant.expiresAt) < new Date()
        ? "Expired"
        : "Active";

    await airtableUpdate(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, record.id, {
      "Use Count": nextUseCount,
      Status: nextStatus,
    });

    return refreshGrantStatus({
      ...grant,
      useCount: nextUseCount,
      status: nextStatus === "Expired" ? "expired" : "active",
    });
  },

  async restoreGrantUse(grantId) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(grantId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.accessGrants,
      token,
      `{Grant ID}='${escaped}'`,
    );
    if (!record) return null;

    const grant = mapGrantRecord(record);
    if (grant.useCount <= 0 || grant.status === "revoked") return null;

    const nextUseCount = grant.useCount - 1;
    const timeExpired = new Date(grant.expiresAt) < new Date();
    const nextStatus = timeExpired
      ? "Expired"
      : nextUseCount < grant.maxUses
        ? "Active"
        : "Expired";

    await airtableUpdate(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, record.id, {
      "Use Count": nextUseCount,
      Status: nextStatus,
    });

    return refreshGrantStatus({
      ...grant,
      useCount: nextUseCount,
      status: nextStatus === "Expired" ? "expired" : "active",
    });
  },

  async setGrantStatus(grantId, status) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(grantId);
    const record = await airtableFindOne(
      baseId,
      BRAIN_REGISTRY_TABLES.accessGrants,
      token,
      `{Grant ID}='${escaped}'`,
    );
    if (!record) return false;

    await airtableUpdate(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, record.id, {
      Status: toGrantStatus(status),
    });
    return true;
  },

  async revokeGrantsForBrain(brainSlug) {
    const { baseId, token } = getRegistryConfig();
    const escaped = escapeAirtableString(brainSlug);
    // Paginate: a single page caps at 100 rows. Promote must revoke every
    // Active grant for the brain, or leftover keys keep reading Trusted truth.
    const records = await airtableSelect(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, {
      filterByFormula: `AND({Brain Slug}='${escaped}', {Status}='Active')`,
      fields: ["Grant ID"],
      paginate: true,
    });

    for (const record of records) {
      await airtableUpdate(baseId, BRAIN_REGISTRY_TABLES.accessGrants, token, record.id, {
        Status: "Revoked",
      });
    }
    return records.length;
  },
};
