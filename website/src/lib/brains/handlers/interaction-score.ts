import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { resolveReviewFieldsAfterScore } from "../interaction-upkeep";
import { assertSafeForPersistence } from "../secrets";
import { assertBrainInteractionBelongsToBrain } from "./interaction-brain-guard";
import { scoreMemoryInteraction } from "./interaction-memory";
import { scoreHouseholdInteraction } from "./interaction-household-review";
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
  if (
    body.humanQuality !== undefined &&
    (!Number.isInteger(body.humanQuality) || body.humanQuality < 1 || body.humanQuality > 5)
  ) {
    throw new Error("humanQuality must be an integer from 1 to 5.");
  }
  if (body.source === "brain_interactions" && body.humanQuality !== undefined) {
    throw new Error("Human Quality is available only on Household Activity rows.");
  }

  if (body.reviewNotes?.trim()) {
    assertSafeForPersistence(body.reviewNotes);
  }

  const suspectedContextIssue = Boolean(body.suspectedContextIssue);
  const reviewNotes = body.reviewNotes?.trim();
  const { reviewStatus, contextFlagged } = resolveReviewFieldsAfterScore(
    qualityScore,
    suspectedContextIssue,
  );

  if (body.source === "household_activity") {
    const interaction = await scoreHouseholdInteraction({
      recordId,
      brainSlug,
      qualityScore,
      humanQuality: body.humanQuality,
      reviewer,
      reviewNotes,
      suspectedContextIssue,
      reviewStatus,
      contextFlagged,
    });
    return { interaction, autoProposed: qualityScore <= 2 };
  }
  if (body.source !== "brain_interactions") {
    throw new Error("A valid interaction source is required.");
  }

  if (useMemoryStore()) {
    const interaction = scoreMemoryInteraction(recordId, brainSlug, {
      qualityScore,
      reviewer,
      reviewNotes,
      suspectedContextIssue,
      reviewStatus,
      contextFlagged,
    });
    return { interaction, autoProposed: qualityScore <= 2 };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (!workshopBaseId || !workshopToken || !tableId) {
    throw new Error("Workshop interaction scoring is not configured.");
  }

  // Lookup before PATCH — Airtable often returns only the fields we wrote,
  // which would blank Question/Answer in the review UI (same class as #165).
  const existing = await assertBrainInteractionBelongsToBrain({
    baseId: workshopBaseId,
    tableId,
    token: workshopToken,
    recordId,
    brainSlug,
  });

  const reviewedAt = new Date().toISOString();

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
            "Review Status": reviewStatus,
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
    records?: Array<{ id: string; fields: Record<string, unknown>; createdTime?: string }>;
  };
  const patched = data.records?.[0];
  if (!patched) throw new Error("Interaction not found.");

  const mergedFields = { ...existing.fields, ...(patched.fields ?? {}) };
  const createdAt = patched.createdTime ?? existing.createdTime ?? "";

  const interaction: InteractionSummary = {
    recordId: patched.id,
    source: "brain_interactions",
    stableId: `brain_interactions:${patched.id}`,
    interactionId: String(mergedFields["Interaction ID"] ?? patched.id),
    sessionId: String(mergedFields["Session ID"] ?? ""),
    persona: String(mergedFields.Persona ?? "clive") as InteractionSummary["persona"],
    brainSlug: String(mergedFields["Brain Slug"] ?? brainSlug),
    userMessage: String(mergedFields["User Message"] ?? ""),
    assistantReply: String(mergedFields["Assistant Reply"] ?? ""),
    channel: String(mergedFields.Channel ?? "website"),
    createdAt,
    qualityScore,
    agentQuality: qualityScore,
    reviewer,
    reviewNotes,
    reviewedAt,
    suspectedContextIssue,
    reviewStatus,
    contextFlagged,
    contentComplete: true,
  };

  return { interaction, autoProposed: qualityScore <= 2 };
}
