import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
} from "./airtable-ids";
import type { InteractionContextFlagged, InteractionReviewStatus } from "./types";

/** Placeholder IDs from FALLBACK_TRUSTED_SNIPPETS — not real Trusted Brain rows. */
const FALLBACK_RECORD_ID_PREFIX = "fallback-";

export function isFallbackRecordId(recordId: string): boolean {
  return recordId.trim().startsWith(FALLBACK_RECORD_ID_PREFIX);
}

export function parseManifestRecordIds(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isFallbackManifest(recordIds: string[]): boolean {
  if (recordIds.length === 0) return false;
  return recordIds.every(isFallbackRecordId);
}

export function hasGrantBackedManifest(recordIds: string[], grantId?: string): boolean {
  if (!grantId?.trim()) return false;
  if (recordIds.length === 0) return false;
  return !isFallbackManifest(recordIds);
}

export interface ScoreReviewFields {
  reviewStatus: InteractionReviewStatus;
  contextFlagged: InteractionContextFlagged;
}

/**
 * Low scores (1–2) auto-propose context review in Workshop only — never Trusted writes.
 * Suspected context on higher scores flags for shortlist but stays Reviewed until acted on.
 */
export function resolveReviewFieldsAfterScore(
  qualityScore: number,
  suspectedContextIssue: boolean,
): ScoreReviewFields {
  if (qualityScore <= 2) {
    const contextFlagged =
      qualityScore === 1 && suspectedContextIssue
        ? BRAIN_INTERACTION_CONTEXT_FLAGGED.quarantineProposed
        : BRAIN_INTERACTION_CONTEXT_FLAGGED.flaggedForReview;
    return {
      reviewStatus: BRAIN_INTERACTION_REVIEW_STATUS.actionProposed,
      contextFlagged,
    };
  }

  return {
    reviewStatus: BRAIN_INTERACTION_REVIEW_STATUS.reviewed,
    contextFlagged: suspectedContextIssue
      ? BRAIN_INTERACTION_CONTEXT_FLAGGED.flaggedForReview
      : BRAIN_INTERACTION_CONTEXT_FLAGGED.none,
  };
}

export function matchesNeedsReviewShortlist(input: {
  qualityScore?: number;
  suspectedContextIssue?: boolean;
  reviewStatus?: InteractionReviewStatus;
}): boolean {
  if (input.reviewStatus === BRAIN_INTERACTION_REVIEW_STATUS.noAction) return false;

  const lowScore =
    typeof input.qualityScore === "number" &&
    Number.isFinite(input.qualityScore) &&
    input.qualityScore <= 2;
  const contextFlagged = Boolean(input.suspectedContextIssue);

  return lowScore || contextFlagged;
}

export function buildNeedsReviewFormula(brainSlug: string): string {
  const slug = escapeFormulaValue(brainSlug);
  return (
    `AND(` +
    `{Brain Slug}='${slug}',` +
    `OR({Quality Score}<=2,{Suspected Context Issue}),` +
    `{Review Status}!='${BRAIN_INTERACTION_REVIEW_STATUS.noAction}'` +
    `)`
  );
}

function escapeFormulaValue(value: string): string {
  return value.replace(/'/g, "\\'");
}
