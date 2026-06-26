import type {
  InteractionContextFlagged,
  InteractionLogBody,
  InteractionReviewStatus,
  InteractionSummary,
} from "../types";

interface MemoryInteraction extends InteractionSummary {
  manifestRecordIds?: string;
  manifestHashes?: string;
  grantId?: string;
}

const memoryInteractions = new Map<string, MemoryInteraction>();

function nextMemoryId(): string {
  return `mem_${Date.now()}_${memoryInteractions.size}`;
}

export function addMemoryInteraction(entry: InteractionLogBody): MemoryInteraction {
  const recordId = nextMemoryId();
  const interactionId = `int_${Date.now()}`;
  const stored: MemoryInteraction = {
    recordId,
    interactionId,
    sessionId: entry.sessionId,
    persona: entry.persona,
    brainSlug: entry.brainSlug,
    userMessage: entry.userMessage,
    assistantReply: entry.assistantReply,
    channel: entry.channel ?? "website",
    createdAt: new Date().toISOString(),
    reviewStatus: "New",
    contextFlagged: "None",
    manifestRecordIds: (entry.manifest?.recordIds ?? []).join(", "),
    manifestHashes: (entry.manifest?.hashes ?? []).join(", "),
    grantId: entry.manifest?.grantId,
  };
  memoryInteractions.set(recordId, stored);
  return stored;
}

export function listMemoryInteractions(brainSlug: string, limit: number): InteractionSummary[] {
  return [...memoryInteractions.values()]
    .filter((row) => row.brainSlug === brainSlug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toSummary);
}

export function scoreMemoryInteraction(
  recordId: string,
  brainSlug: string,
  patch: {
    qualityScore: number;
    reviewer: string;
    reviewNotes?: string;
    suspectedContextIssue?: boolean;
  },
): InteractionSummary {
  const row = memoryInteractions.get(recordId);
  if (!row) throw new Error("Interaction not found.");
  if (row.brainSlug !== brainSlug) throw new Error("Brain does not match this interaction.");

  row.qualityScore = patch.qualityScore;
  row.reviewer = patch.reviewer;
  row.reviewNotes = patch.reviewNotes?.trim() || undefined;
  row.reviewedAt = new Date().toISOString();
  row.suspectedContextIssue = Boolean(patch.suspectedContextIssue);
  row.reviewStatus = "Reviewed";
  row.contextFlagged = patch.suspectedContextIssue ? "Flagged for review" : "None";

  return toSummary(row);
}

function toSummary(row: MemoryInteraction): InteractionSummary {
  return {
    recordId: row.recordId,
    interactionId: row.interactionId,
    sessionId: row.sessionId,
    persona: row.persona,
    brainSlug: row.brainSlug,
    userMessage: row.userMessage,
    assistantReply: row.assistantReply,
    channel: row.channel,
    createdAt: row.createdAt,
    qualityScore: row.qualityScore,
    reviewer: row.reviewer,
    reviewNotes: row.reviewNotes,
    reviewedAt: row.reviewedAt,
    suspectedContextIssue: row.suspectedContextIssue,
    reviewStatus: row.reviewStatus as InteractionReviewStatus | undefined,
    contextFlagged: row.contextFlagged as InteractionContextFlagged | undefined,
  };
}

export function clearMemoryInteractionsForTests(): void {
  memoryInteractions.clear();
}
