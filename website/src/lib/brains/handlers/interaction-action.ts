import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
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

  // Lookup before PATCH — Airtable often returns only the fields we wrote,
  // which would blank Question/Answer in the review UI (same class as #165).
  const existing = await assertBrainInteractionBelongsToBrain({
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
            "Review Status": fields.reviewStatus,
            "Context Flagged": fields.contextFlagged,
            ...(actor ? { Reviewer: actor } : {}),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Workshop interaction action failed (${response.status})`);
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
    qualityScore:
      typeof mergedFields["Quality Score"] === "number"
        ? mergedFields["Quality Score"]
        : undefined,
    reviewer:
      actor ??
      (typeof mergedFields.Reviewer === "string" ? mergedFields.Reviewer : undefined),
    reviewNotes:
      typeof mergedFields["Review Notes"] === "string"
        ? mergedFields["Review Notes"]
        : undefined,
    reviewedAt:
      typeof mergedFields["Reviewed At"] === "string"
        ? mergedFields["Reviewed At"]
        : undefined,
    suspectedContextIssue: Boolean(mergedFields["Suspected Context Issue"]),
    reviewStatus: fields.reviewStatus,
    contextFlagged: fields.contextFlagged,
    contentComplete: true,
  };

  return { interaction };
}
