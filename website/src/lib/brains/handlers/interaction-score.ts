import {
  BRAIN_WORKSHOP_INTERACTION_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
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

  await assertBrainInteractionBelongsToBrain({
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
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.qualityScore]: qualityScore,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewer]: reviewer,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewNotes]: reviewNotes ?? "",
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewedAt]: reviewedAt,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.suspectedContextIssue]:
              suspectedContextIssue,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewStatus]: reviewStatus,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.contextFlagged]: contextFlagged,
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
    source: "brain_interactions",
    stableId: `brain_interactions:${record.id}`,
    interactionId: String(record.fields["Interaction ID"] ?? record.id),
    sessionId: String(record.fields["Session ID"] ?? ""),
    persona: String(record.fields.Persona ?? "clive") as InteractionSummary["persona"],
    brainSlug: String(record.fields["Brain Slug"] ?? brainSlug),
    userMessage: String(record.fields["User Message"] ?? ""),
    assistantReply: String(record.fields["Assistant Reply"] ?? ""),
    channel: String(record.fields.Channel ?? "website"),
    createdAt: record.createdTime,
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
