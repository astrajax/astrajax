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
  | "Unreviewed"
  | "New"
  | "Reviewed"
  | "Action proposed"
  | "No action";

export type InteractionContextFlagged =
  | "None"
  | "Flagged for review"
  | "Quarantine proposed"
  | "Resolved";

export type InteractionRecordSource = "brain_interactions" | "household_activity";

export interface InteractionSummary {
  recordId: string;
  source: InteractionRecordSource;
  stableId: string;
  interactionId: string;
  sessionId: string;
  persona: PersonaId;
  brainSlug: string;
  userMessage: string;
  assistantReply: string;
  channel: string;
  createdAt: string;
  /** Backward-compatible alias for Agent Quality. */
  qualityScore?: number;
  agentQuality?: number;
  humanQuality?: number;
  reviewer?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  suspectedContextIssue?: boolean;
  reviewStatus?: InteractionReviewStatus;
  contextFlagged?: InteractionContextFlagged;
  manifestRecordIds?: string[];
  grantId?: string;
  isFallbackContext?: boolean;
  contentComplete?: boolean;
}

export interface InteractionListQuery {
  brainSlug: string;
  limit?: number;
  /** When true, return only low-score or context-flagged items needing attention. */
  shortlist?: boolean;
  /** When true, return only Clive's Man upkeep proposals awaiting triage. */
  actionProposed?: boolean;
}

export type InteractionUpkeepAction = "propose" | "dismiss";

export interface InteractionActionBody {
  recordId: string;
  source: InteractionRecordSource;
  brainSlug: string;
  action: InteractionUpkeepAction;
  actor?: string;
  /** When proposing, use Quarantine proposed instead of Flagged for review. */
  quarantine?: boolean;
}

export interface InteractionScoreBody {
  recordId: string;
  source: InteractionRecordSource;
  brainSlug: string;
  /** Agent-answer quality; maps to legacy Quality Score or Household Agent Quality. */
  qualityScore: number;
  /** Human-prompt quality; Household Activity only. */
  humanQuality?: number;
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

export interface SourceDocumentMineBody {
  brainSlug: string;
  /** When true, return structured proposals without writing Draft Brain Truth or updating Mine Status. */
  dryRun?: boolean;
  limit?: number;
  actor?: string;
}

export interface SourceDocumentMineResult {
  mode: "memory" | "airtable";
  brainSlug: string;
  dryRun: boolean;
  eligibleCount: number;
  proposals: Array<{
    title: string;
    canonicalText: string;
    proposedCategory: "Definition" | "Knowledge" | "Open Questions";
    brainSlug: string;
    brainTheme?: string;
    sourceDocumentRecordId: string;
  }>;
  draftRecordIds: string[];
  minedSourceDocumentIds: string[];
}
