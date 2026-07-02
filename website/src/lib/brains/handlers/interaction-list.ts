import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { airtableSelect } from "../airtable-rest";
import { getWorkshopBaseId, getWorkshopReadToken, useMemoryStore } from "../config";
import {
  buildActionProposedFormula,
  buildNeedsReviewFormula,
  isFallbackManifest,
  parseManifestRecordIds,
} from "../interaction-upkeep";
import { listMemoryInteractions } from "./interaction-memory";
import type { InteractionListQuery, InteractionSummary, PersonaId } from "../types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

interface AirtableInteractionRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

export async function handleInteractionList(query: InteractionListQuery): Promise<{
  interactions: InteractionSummary[];
  warning?: string;
}> {
  const brainSlug = query.brainSlug?.trim();
  if (!brainSlug) throw new Error("brainSlug is required.");

  const limit = clampLimit(query.limit);
  const shortlist = Boolean(query.shortlist);
  const actionProposed = Boolean(query.actionProposed);

  if (useMemoryStore()) {
    return {
      interactions: listMemoryInteractions(brainSlug, limit, { shortlist, actionProposed }),
    };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopReadToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (!workshopBaseId || !workshopToken || !tableId) {
    return {
      interactions: [],
      warning: "Workshop interaction list is not configured.",
    };
  }

  const formula = actionProposed
    ? buildActionProposedFormula(brainSlug)
    : shortlist
      ? buildNeedsReviewFormula(brainSlug)
      : `{Brain Slug}='${escapeFormulaValue(brainSlug)}'`;

  try {
    const records = await airtableSelect(workshopBaseId, tableId, workshopToken, {
      filterByFormula: formula,
      maxRecords: limit,
    });

    const interactions = records
      .map(mapAirtableRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return { interactions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workshop interaction list failed.";
    if (/403|401|NOT_AUTHORIZED|INVALID_PERMISSIONS/i.test(message)) {
      return {
        interactions: [],
        warning:
          "Could not read Brain Interactions from Workshop (token lacks read access). Flagged conversations will be empty until BRAIN_WORKSHOP_READ_TOKEN is configured.",
      };
    }
    throw error instanceof Error ? error : new Error(message);
  }
}

function mapAirtableRecord(record: AirtableInteractionRecord): InteractionSummary {
  const fields = record.fields;
  const persona = String(fields.Persona ?? "clive");
  const manifestRecordIds = parseManifestRecordIds(fields["Manifest Record IDs"]);
  const grantId = readOptionalString(fields["Grant ID"]);

  return {
    recordId: record.id,
    interactionId: String(fields["Interaction ID"] ?? record.id),
    sessionId: String(fields["Session ID"] ?? ""),
    persona: persona as PersonaId,
    brainSlug: String(fields["Brain Slug"] ?? ""),
    userMessage: String(fields["User Message"] ?? ""),
    assistantReply: String(fields["Assistant Reply"] ?? ""),
    channel: String(fields.Channel ?? "website"),
    createdAt: record.createdTime ?? new Date(0).toISOString(),
    qualityScore: readNumber(fields["Quality Score"]),
    reviewer: readOptionalString(fields.Reviewer),
    reviewNotes: readOptionalString(fields["Review Notes"]),
    reviewedAt: readOptionalString(fields["Reviewed At"]),
    suspectedContextIssue: Boolean(fields["Suspected Context Issue"]),
    reviewStatus: readOptionalString(fields["Review Status"]) as InteractionSummary["reviewStatus"],
    contextFlagged: readOptionalString(fields["Context Flagged"]) as InteractionSummary["contextFlagged"],
    manifestRecordIds,
    grantId,
    isFallbackContext: manifestRecordIds.length > 0 && isFallbackManifest(manifestRecordIds),
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

function escapeFormulaValue(value: string): string {
  return value.replace(/'/g, "\\'");
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}
