import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
  BRAIN_WORKSHOP_INTERACTION_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { assertBrainInteractionBelongsToBrain } from "./interaction-brain-guard";
import { actionMemoryInteraction } from "./interaction-memory";
import { actionHouseholdInteraction } from "./interaction-household-review";
import type { InteractionActionBody, InteractionSummary } from "../types";

export async function handleInteractionAction(body: InteractionActionBody) {
  const recordId = body.recordId?.trim();
  const brainSlug = body.brainSlug?.trim();
  const action = body.action;

  if (!recordId) throw new Error("recordId is required.");
  if (!brainSlug) throw new Error("brainSlug is required.");
  if (action !== "propose" && action !== "dismiss") {
    throw new Error('action must be "propose" or "dismiss".');
  }

  const fields =
    action === "dismiss"
      ? {
          reviewStatus: BRAIN_INTERACTION_REVIEW_STATUS.noAction,
          contextFlagged: BRAIN_INTERACTION_CONTEXT_FLAGGED.none,
        }
      : {
          reviewStatus: BRAIN_INTERACTION_REVIEW_STATUS.actionProposed,
          contextFlagged: body.quarantine
            ? BRAIN_INTERACTION_CONTEXT_FLAGGED.quarantineProposed
            : BRAIN_INTERACTION_CONTEXT_FLAGGED.flaggedForReview,
        };

  const actor = body.actor?.trim();

  if (body.source === "household_activity") {
    return {
      interaction: await actionHouseholdInteraction({
        recordId,
        brainSlug,
        reviewer: actor,
        reviewStatus: fields.reviewStatus,
        contextFlagged: fields.contextFlagged,
      }),
    };
  }
  if (body.source !== "brain_interactions") {
    throw new Error("A valid interaction source is required.");
  }

  if (useMemoryStore()) {
    const interaction = actionMemoryInteraction(recordId, brainSlug, {
      ...fields,
      reviewer: actor,
    });
    return { interaction };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (!workshopBaseId || !workshopToken || !tableId) {
    throw new Error("Workshop interaction action is not configured.");
  }

  await assertBrainInteractionBelongsToBrain({
    baseId: workshopBaseId,
    tableId,
    token: workshopToken,
    recordId,
    brainSlug,
  });

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
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewStatus]: fields.reviewStatus,
            [BRAIN_WORKSHOP_INTERACTION_FIELDS.contextFlagged]: fields.contextFlagged,
            ...(actor
              ? { [BRAIN_WORKSHOP_INTERACTION_FIELDS.reviewer]: actor }
              : {}),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Workshop interaction action failed (${response.status})`);
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
    qualityScore:
      typeof record.fields["Quality Score"] === "number"
        ? record.fields["Quality Score"]
        : undefined,
    reviewer:
      actor ??
      (typeof record.fields.Reviewer === "string" ? record.fields.Reviewer : undefined),
    reviewNotes:
      typeof record.fields["Review Notes"] === "string"
        ? record.fields["Review Notes"]
        : undefined,
    reviewedAt:
      typeof record.fields["Reviewed At"] === "string"
        ? record.fields["Reviewed At"]
        : undefined,
    suspectedContextIssue: Boolean(record.fields["Suspected Context Issue"]),
    reviewStatus: fields.reviewStatus,
    contextFlagged: fields.contextFlagged,
    contentComplete: true,
  };

  return { interaction };
}
