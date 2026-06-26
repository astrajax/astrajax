export type PersonaId = "clive" | "pam" | "doc";

export type BrainKeyRequestStatus = "pending" | "approved" | "rejected" | "expired";

export type AccessGrantStatus = "active" | "revoked" | "expired";

export type BrainKeyUiState =
  | "locked"
  | "key_requested"
  | "pam_challenge"
  | "awaiting_approval"
  | "unlocked"
  | "expired"
  | "promotion_pending";

export interface BrainKeyRequest {
  requestId: string;
  brainSlug: string;
  persona: PersonaId;
  purpose: string;
  scope: string;
  reason: string;
  sessionId: string;
  status: BrainKeyRequestStatus;
  requestedAt: string;
  expiresAt: string;
}

export interface AccessGrant {
  grantId: string;
  requestId: string;
  brainSlug: string;
  persona: PersonaId;
  scope: string;
  sessionId: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  status: AccessGrantStatus;
}

export interface ContextSnippet {
  recordId: string;
  title: string;
  text: string;
  contentHash: string;
}

export interface RetrievalManifest {
  recordIds: string[];
  hashes: string[];
  grantId: string;
  retrievedAt: string;
}

export interface KeyRequestBody {
  brainSlug: string;
  persona: PersonaId;
  purpose: string;
  scope: string;
  reason: string;
  sessionId: string;
  requestedExpiryMinutes?: number;
}

export interface KeyApproveBody {
  requestId: string;
  decision: "approved" | "rejected";
  approver: string;
  grantMaxUses?: number;
  grantExpiryMinutes?: number;
  notes?: string;
}

export interface TruthRetrieveBody {
  grantId: string;
  sessionId: string;
  persona: PersonaId;
  brainSlug: string;
  scope: string;
}

export interface InteractionLogBody {
  sessionId: string;
  persona: PersonaId;
  brainSlug: string;
  userMessage: string;
  assistantReply: string;
  manifest?: Partial<RetrievalManifest>;
  channel?: "website" | "booth" | "admin" | "test";
}

export type InteractionReviewStatus =
  | "New"
  | "Reviewed"
  | "Action proposed"
  | "No action";

export type InteractionContextFlagged =
  | "None"
  | "Flagged for review"
  | "Quarantine proposed"
  | "Resolved";

export interface InteractionSummary {
  recordId: string;
  interactionId: string;
  sessionId: string;
  persona: PersonaId;
  brainSlug: string;
  userMessage: string;
  assistantReply: string;
  channel: string;
  createdAt: string;
  qualityScore?: number;
  reviewer?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  suspectedContextIssue?: boolean;
  reviewStatus?: InteractionReviewStatus;
  contextFlagged?: InteractionContextFlagged;
}

export interface InteractionListQuery {
  brainSlug: string;
  limit?: number;
}

export interface InteractionScoreBody {
  recordId: string;
  brainSlug: string;
  qualityScore: number;
  reviewer: string;
  reviewNotes?: string;
  suspectedContextIssue?: boolean;
}

export interface DocPromoteItem {
  draftRecordId: string;
  category: string;
  scope: string;
}

export interface DocPromoteBody {
  approvalDecisionId: string;
  brainSlug: string;
  promotions: DocPromoteItem[];
  approver: string;
  reason: string;
}
