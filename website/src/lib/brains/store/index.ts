import type {
  AccessGrant,
  AccessGrantStatus,
  BrainKeyRequest,
  BrainKeyRequestStatus,
  PersonaId,
} from "../types";

export interface GrantStore {
  createRequest(input: {
    brainSlug: string;
    persona: PersonaId;
    purpose: string;
    scope: string;
    reason: string;
    sessionId: string;
    requestedExpiryMinutes: number;
  }): Promise<BrainKeyRequest>;

  getRequest(requestId: string): Promise<BrainKeyRequest | undefined>;

  setRequestStatus(
    requestId: string,
    status: BrainKeyRequestStatus,
  ): Promise<boolean>;

  createGrant(input: {
    requestId: string;
    brainSlug: string;
    persona: PersonaId;
    scope: string;
    sessionId: string;
    approvedBy: string;
    grantMaxUses: number;
    grantExpiryMinutes: number;
  }): Promise<AccessGrant>;

  getGrant(grantId: string): Promise<AccessGrant | undefined>;

  incrementGrantUse(grantId: string): Promise<AccessGrant | null>;

  setGrantStatus(grantId: string, status: AccessGrantStatus): Promise<boolean>;

  revokeGrantsForBrain(brainSlug: string): Promise<number>;

  resetForTests?(): void;
}
