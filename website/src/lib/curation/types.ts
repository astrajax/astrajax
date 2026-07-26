import type { ContextDestination } from "./destinations";
import type { ChatMessage } from "@/lib/clive/types";
import type { InteractionRecordSource } from "@/lib/brains/types";

export type CurationChatMessage = ChatMessage;

export type TrustedTruthRow = {
  recordId: string;
  title: string;
  canonicalText: string;
  category?: string;
  scope?: string;
};

export type DocketDraft = {
  recordId: string;
  title: string;
  canonicalText: string;
  status: string;
  proposedCategory?: string;
};

export type DocketInteraction = {
  recordId: string;
  source: InteractionRecordSource;
  stableId: string;
  userMessage: string;
  assistantReply: string;
  reviewStatus?: string;
  contextFlagged?: string;
  qualityScore?: number;
};

export type DocketSourceDocument = {
  recordId: string;
  title: string;
  mineStatus?: string;
};

export type CurationDocket = {
  brainSlug: string;
  mode: "airtable" | "memory";
  drafts: DocketDraft[];
  flaggedInteractions: DocketInteraction[];
  pendingSourceDocuments: DocketSourceDocument[];
  trustedTruths: TrustedTruthRow[];
};

export type CurationProposal = {
  id: string;
  toolName: string;
  title: string;
  summary: string;
  destination: ContextDestination;
  brainSlug: string;
  payload: Record<string, unknown>;
  status: "pending" | "confirmed" | "failed";
  recordId?: string;
  error?: string;
};

export type CurationChatRequest = {
  brainSlug: string;
  sessionId: string;
  message: string;
  history: CurationChatMessage[];
  actor?: string;
  platformHandle?: string | null;
  turnId?: string;
};

export type CurationChatResponse = {
  reply: string;
  proposals: CurationProposal[];
  groundingManifest?: string;
  knowledgeSource: "airtable" | "fallback";
};

export type PaperTrailEntry = {
  id: string;
  action: string;
  actor: string;
  reason: string;
  timestamp: string;
  destination?: ContextDestination;
  recordId?: string;
};
