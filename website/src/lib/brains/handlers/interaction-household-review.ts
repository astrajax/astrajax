import { airtableSelect, type AirtableRecord } from "../airtable-rest";
import {
  getHouseholdActivityBaseId,
  getHouseholdActivityReadToken,
  getHouseholdActivityReviewToken,
  getHouseholdActivityTableId,
} from "../config";
import { HOUSEHOLD_ACTIVITY_FIELDS } from "@/lib/platform-activity/ids";
import { updateAirtableReview } from "@/lib/platform-activity/airtable-review";
import { mapHouseholdRecord } from "./interaction-household";
import type {
  InteractionContextFlagged,
  InteractionReviewStatus,
  InteractionSummary,
} from "../types";

function parseDetail(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string") return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function loadHouseholdInteraction(recordId: string): Promise<AirtableRecord> {
  const token = getHouseholdActivityReadToken();
  if (!token) throw new Error("HOUSEHOLD_ACTIVITY_READ_TOKEN is not configured.");
  const records = await airtableSelect(
    getHouseholdActivityBaseId(),
    getHouseholdActivityTableId(),
    token,
    { filterByFormula: `RECORD_ID()='${recordId.replace(/'/g, "\\'")}'`, maxRecords: 1 },
  );
  const record = records[0];
  if (!record || record.fields["Event Type"] !== "Turn") {
    throw new Error("Household interaction not found.");
  }
  return record;
}

async function updateHouseholdInteraction(input: {
  record: AirtableRecord;
  reviewStatus: InteractionReviewStatus;
  contextFlagged: InteractionContextFlagged;
  reviewer?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  suspectedContextIssue?: boolean;
  agentQuality?: number;
  humanQuality?: number;
}): Promise<InteractionSummary> {
  const token = getHouseholdActivityReviewToken();
  if (!token) throw new Error("HOUSEHOLD_ACTIVITY_REVIEW_TOKEN is not configured.");

  const detail = parseDetail(input.record.fields.Detail);
  const updated = await updateAirtableReview({
    baseId: getHouseholdActivityBaseId(),
    tableId: getHouseholdActivityTableId(),
    recordId: input.record.id,
    reviewToken: token,
    fields: {
      ...(input.agentQuality !== undefined
        ? { [HOUSEHOLD_ACTIVITY_FIELDS.agentQuality]: input.agentQuality }
        : {}),
      ...(input.humanQuality !== undefined
        ? { [HOUSEHOLD_ACTIVITY_FIELDS.humanQuality]: input.humanQuality }
        : {}),
      [HOUSEHOLD_ACTIVITY_FIELDS.reviewStatus]: input.reviewStatus,
      [HOUSEHOLD_ACTIVITY_FIELDS.detail]: JSON.stringify({
        ...detail,
        review: {
          reviewer: input.reviewer,
          notes: input.reviewNotes,
          reviewedAt: input.reviewedAt,
          suspectedContextIssue: Boolean(input.suspectedContextIssue),
          contextFlagged: input.contextFlagged,
        },
      }),
    },
  });
  return mapHouseholdRecord({
    id: updated.id,
    fields: { ...input.record.fields, ...(updated.fields ?? {}) },
    createdTime: updated.createdTime ?? input.record.createdTime,
  });
}

export async function scoreHouseholdInteraction(input: {
  recordId: string;
  brainSlug: string;
  qualityScore: number;
  humanQuality?: number;
  reviewer: string;
  reviewNotes?: string;
  suspectedContextIssue: boolean;
  reviewStatus: InteractionReviewStatus;
  contextFlagged: InteractionContextFlagged;
}): Promise<InteractionSummary> {
  const record = await loadHouseholdInteraction(input.recordId);
  const mapped = mapHouseholdRecord(record);
  if (mapped.brainSlug !== input.brainSlug) {
    throw new Error("Brain does not match this Household interaction.");
  }
  return updateHouseholdInteraction({
    record,
    agentQuality: input.qualityScore,
    humanQuality: input.humanQuality,
    reviewer: input.reviewer,
    reviewNotes: input.reviewNotes,
    reviewedAt: new Date().toISOString(),
    suspectedContextIssue: input.suspectedContextIssue,
    reviewStatus: input.reviewStatus,
    contextFlagged: input.contextFlagged,
  });
}

export async function actionHouseholdInteraction(input: {
  recordId: string;
  brainSlug: string;
  reviewer?: string;
  reviewStatus: InteractionReviewStatus;
  contextFlagged: InteractionContextFlagged;
}): Promise<InteractionSummary> {
  const record = await loadHouseholdInteraction(input.recordId);
  const mapped = mapHouseholdRecord(record);
  if (mapped.brainSlug !== input.brainSlug) {
    throw new Error("Brain does not match this Household interaction.");
  }
  return updateHouseholdInteraction({
    record,
    reviewer: input.reviewer,
    reviewNotes: mapped.reviewNotes,
    reviewedAt: mapped.reviewedAt,
    suspectedContextIssue: mapped.suspectedContextIssue,
    reviewStatus: input.reviewStatus,
    contextFlagged: input.contextFlagged,
  });
}
