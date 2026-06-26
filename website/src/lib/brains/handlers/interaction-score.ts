import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { assertSafeForPersistence } from "../secrets";
import { scoreMemoryInteraction } from "./interaction-memory";
import type { InteractionScoreBody, InteractionSummary } from "../types";

export async function handleInteractionScore(body: InteractionScoreBody) {
  const recordId = body.recordId?.trim();
  const brainSlug = body.brainSlug?.trim();
  const reviewer = body.reviewer?.trim();

  if (!recordId) throw new Error("recordId is required.");
  if (!brainSlug) throw new Error("brainSlug is required.");
  if (!reviewer) throw new Error("reviewer is required.");

  const qualityScore = body.qualityScore;
  if (!Number.isInteger(qualityScore) || qualityScore < 1 || qualityScore > 5) {
    throw new Error("qualityScore must be an integer from 1 to 5.");
  }

  if (body.reviewNotes?.trim()) {
    assertSafeForPersistence(body.reviewNotes);
  }

  const suspectedContextIssue = Boolean(body.suspectedContextIssue);
  const reviewNotes = body.reviewNotes?.trim();

  if (useMemoryStore()) {
    const interaction = scoreMemoryInteraction(recordId, brainSlug, {
      qualityScore,
      reviewer,
      reviewNotes,
      suspectedContextIssue,
    });
    return { interaction };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (!workshopBaseId || !workshopToken || !tableId) {
    throw new Error("Workshop interaction scoring is not configured.");
  }

  const reviewedAt = new Date().toISOString();
  const contextFlagged = suspectedContextIssue
    ? BRAIN_INTERACTION_CONTEXT_FLAGGED.flaggedForReview
    : BRAIN_INTERACTION_CONTEXT_FLAGGED.none;

  const url = `https://api.airtable.com/v0/${workshopBaseId}/${tableId}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${workshopToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      records: [
        {
          id: recordId,
          fields: {
            "Quality Score": qualityScore,
            Reviewer: reviewer,
            "Review Notes": reviewNotes ?? "",
            "Reviewed At": reviewedAt,
            "Suspected Context Issue": suspectedContextIssue,
            "Review Status": BRAIN_INTERACTION_REVIEW_STATUS.reviewed,
            "Context Flagged": contextFlagged,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Workshop interaction score failed (${response.status})`);
  }

  const data = (await response.json()) as {
    records?: Array<{ id: string; fields: Record<string, unknown>; createdTime: string }>;
  };
  const record = data.records?.[0];
  if (!record) throw new Error("Interaction not found.");

  const interaction: InteractionSummary = {
    recordId: record.id,
    interactionId: String(record.fields["Interaction ID"] ?? record.id),
    sessionId: String(record.fields["Session ID"] ?? ""),
    persona: String(record.fields.Persona ?? "clive") as InteractionSummary["persona"],
    brainSlug: String(record.fields["Brain Slug"] ?? brainSlug),
    userMessage: String(record.fields["User Message"] ?? ""),
    assistantReply: String(record.fields["Assistant Reply"] ?? ""),
    channel: String(record.fields.Channel ?? "website"),
    createdAt: record.createdTime,
    qualityScore,
    reviewer,
    reviewNotes,
    reviewedAt,
    suspectedContextIssue,
    reviewStatus: BRAIN_INTERACTION_REVIEW_STATUS.reviewed,
    contextFlagged,
  };

  return { interaction };
}
