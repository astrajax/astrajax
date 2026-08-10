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

  /** All grants minted for a key request (any status). */
  listGrantsByRequestId(requestId: string): Promise<AccessGrant[]>;

  incrementGrantUse(grantId: string): Promise<AccessGrant | null>;

  /**
   * Undo one successful consume (Trusted retrieve failed after the use was
   * spent). Restores Active when the grant is not time-expired.
   */
  restoreGrantUse(grantId: string): Promise<AccessGrant | null>;

  setGrantStatus(grantId: string, status: AccessGrantStatus): Promise<boolean>;

  revokeGrantsForBrain(brainSlug: string): Promise<number>;

  resetForTests?(): void;
}
