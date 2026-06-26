import {
  isFallbackManifest,
  matchesNeedsReviewShortlist,
} from "../interaction-upkeep";
import type {
  InteractionContextFlagged,
  InteractionLogBody,
  InteractionReviewStatus,
  InteractionSummary,
} from "../types";

interface MemoryInteraction extends InteractionSummary {
  manifestHashes?: string;
}

const memoryInteractions = new Map<string, MemoryInteraction>();

function nextMemoryId(): string {
  return `mem_${Date.now()}_${memoryInteractions.size}`;
}

export function addMemoryInteraction(entry: InteractionLogBody): MemoryInteraction {
  const recordId = nextMemoryId();
  const interactionId = `int_${Date.now()}`;
  const manifestRecordIds = entry.manifest?.recordIds ?? [];
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
    manifestRecordIds,
    grantId: entry.manifest?.grantId,
    isFallbackContext: manifestRecordIds.length > 0 && isFallbackManifest(manifestRecordIds),
    manifestHashes: (entry.manifest?.hashes ?? []).join(", "),
  };
  memoryInteractions.set(recordId, stored);
  return stored;
}

export function listMemoryInteractions(
  brainSlug: string,
  limit: number,
  shortlist = false,
): InteractionSummary[] {
  return [...memoryInteractions.values()]
    .filter((row) => row.brainSlug === brainSlug)
    .filter((row) =>
      shortlist
        ? matchesNeedsReviewShortlist({
            qualityScore: row.qualityScore,
            suspectedContextIssue: row.suspectedContextIssue,
            reviewStatus: row.reviewStatus,
          })
        : true,
    )
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
    reviewStatus: InteractionReviewStatus;
    contextFlagged: InteractionContextFlagged;
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
  row.reviewStatus = patch.reviewStatus;
  row.contextFlagged = patch.contextFlagged;

  return toSummary(row);
}

export function actionMemoryInteraction(
  recordId: string,
  brainSlug: string,
  patch: {
    reviewStatus: InteractionReviewStatus;
    contextFlagged: InteractionContextFlagged;
    reviewer?: string;
  },
): InteractionSummary {
  const row = memoryInteractions.get(recordId);
  if (!row) throw new Error("Interaction not found.");
  if (row.brainSlug !== brainSlug) throw new Error("Brain does not match this interaction.");

  row.reviewStatus = patch.reviewStatus;
  row.contextFlagged = patch.contextFlagged;
  if (patch.reviewer) row.reviewer = patch.reviewer;

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
    reviewStatus: row.reviewStatus,
    contextFlagged: row.contextFlagged,
    manifestRecordIds: row.manifestRecordIds,
    grantId: row.grantId,
    isFallbackContext: row.isFallbackContext,
  };
}

export function clearMemoryInteractionsForTests(): void {
  memoryInteractions.clear();
}
