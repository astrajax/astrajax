import { airtableSelect, type AirtableRecord } from "../airtable-rest";
import {
  getHouseholdActivityBaseId,
  getHouseholdActivityReadToken,
  getHouseholdActivityTableId,
} from "../config";
import { isFallbackManifest } from "../interaction-upkeep";
import type {
  InteractionListQuery,
  InteractionSummary,
  PersonaId,
} from "../types";

const HOUSEHOLD_FETCH_LIMIT = 100;

function escapeFormulaValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Airtable formula that keeps Turns for one brain before the global fetch cap applies. */
export function buildHouseholdBrainTurnFormula(brainSlug: string): string {
  const escaped = escapeFormulaValue(brainSlug.trim());
  // brainSlug is stored inside Detail JSON by the platform outbox mapper.
  return `AND({Event Type}='Turn', FIND('"brainSlug":"${escaped}"', {Detail}))`;
}

type ActivityDetail = {
  surface?: string;
  persona?: string;
  brainSlug?: string;
  manifest?: { recordIds?: string[] };
  review?: {
    reviewer?: string;
    notes?: string;
    reviewedAt?: string;
    suspectedContextIssue?: boolean;
    contextFlagged?: InteractionSummary["contextFlagged"];
  };
};

function parseDetail(raw: unknown): ActivityDetail {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    return JSON.parse(raw) as ActivityDetail;
  } catch {
    return {};
  }
}

function parseContextRecordIds(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .filter((line) => line.startsWith("record:"))
    .map((line) => line.slice("record:".length).trim())
    .filter(Boolean);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function mapHouseholdRecord(record: AirtableRecord): InteractionSummary {
  const fields = record.fields;
  const detail = parseDetail(fields.Detail);
  const manifestRecordIds =
    detail.manifest?.recordIds ?? parseContextRecordIds(fields["Context Referenced"]);
  const agentQuality = optionalNumber(fields["Agent Quality"]);

  return {
    recordId: record.id,
    source: "household_activity",
    stableId: `household_activity:${record.id}`,
    interactionId: String(fields["Event ID"] ?? record.id),
    sessionId: String(fields["Session ID"] ?? ""),
    persona: (detail.persona ?? "clive") as PersonaId,
    brainSlug: detail.brainSlug ?? "",
    userMessage: String(fields["User Message"] ?? ""),
    assistantReply: String(fields["Reply Digest"] ?? ""),
    channel: detail.surface ?? "website",
    createdAt: String(fields.Timestamp ?? record.createdTime ?? new Date(0).toISOString()),
    qualityScore: agentQuality,
    agentQuality,
    humanQuality: optionalNumber(fields["Human Quality"]),
    reviewer: detail.review?.reviewer,
    reviewNotes: detail.review?.notes,
    reviewedAt: detail.review?.reviewedAt,
    suspectedContextIssue: Boolean(detail.review?.suspectedContextIssue),
    reviewStatus: optionalString(fields["Review Status"]) as InteractionSummary["reviewStatus"],
    contextFlagged: detail.review?.contextFlagged,
    manifestRecordIds,
    isFallbackContext: manifestRecordIds.length > 0 && isFallbackManifest(manifestRecordIds),
    contentComplete: false,
  };
}

export async function listHouseholdInteractions(query: InteractionListQuery): Promise<{
  interactions: InteractionSummary[];
  warning?: string;
}> {
  const brainSlug = query.brainSlug?.trim();
  if (!brainSlug) throw new Error("brainSlug is required.");

  const token = getHouseholdActivityReadToken();
  if (!token) {
    return {
      interactions: [],
      warning: "Household Activity read token is not configured.",
    };
  }

  const records = await airtableSelect(
    getHouseholdActivityBaseId(),
    getHouseholdActivityTableId(),
    token,
    {
      filterByFormula: buildHouseholdBrainTurnFormula(brainSlug),
      maxRecords: HOUSEHOLD_FETCH_LIMIT,
      sortField: "Timestamp",
      sortDirection: "desc",
    },
  );

  const limit = Math.min(Math.max(1, query.limit ?? 25), 50);
  const interactions = records
    .map(mapHouseholdRecord)
    .filter((item) => item.brainSlug === brainSlug)
    .filter((item) => {
      if (query.actionProposed) return item.reviewStatus === "Action proposed";
      if (query.shortlist) {
        return (
          item.reviewStatus !== "No action" &&
          ((item.qualityScore !== undefined && item.qualityScore <= 2) ||
            Boolean(item.suspectedContextIssue))
        );
      }
      return true;
    })
    .slice(0, limit);

  return { interactions };
}
