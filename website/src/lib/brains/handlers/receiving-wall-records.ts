import { airtableSelect } from "../airtable-rest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopReadToken } from "../config";
import type { CaptureSource, ReceivingRecord } from "@/lib/receiving-wall";

/**
 * Reads the household's pending draft-brain-truth records for the Receiving
 * Wall. Live when the Workshop read token is configured; otherwise returns a
 * seeded, clearly-labelled set so the wall is never blank in development.
 *
 * Source tinting is driven by the new `Capture Source` single-select on the
 * Draft Brain Truth table (Matthew to add it — see PR). Until a row carries
 * that value, its capture source is inferred from the proposing agent /
 * created-by fields, and `source: "derived"` tells the UI to note the tint is
 * inferred rather than read.
 */

type DraftTruthFields = {
  Title?: string;
  "Canonical Text"?: string;
  "Brain Slug"?: string;
  "Proposed Category"?: string;
  Status?: string;
  "Proposed By Agent"?: string;
  "Created By"?: string;
  /** New single-select, to be added by Matthew. */
  "Capture Source"?: string;
};

const DRAFT_TRUTH_FIELDS_BY_NAME: Record<keyof DraftTruthFields, string> = {
  Title: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
  "Canonical Text": BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
  "Brain Slug": BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
  "Proposed Category": BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
  Status: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
  "Proposed By Agent": BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
  "Created By": BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
  "Capture Source":
    process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID ?? "Capture Source",
};

const WALL_CAP = 10;

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** Map the new single-select (or a legacy label) onto our three sources. */
function normaliseCaptureSource(raw: string | undefined): CaptureSource | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value.includes("external") || value.includes("sentinel")) return "external";
  if (value.includes("user") || value.includes("guided") || value.includes("manual"))
    return "user-guided";
  if (value.includes("chat") || value.includes("session") || value.includes("interaction"))
    return "chat";
  return null;
}

/** Infer a source from provenance when the field isn't set yet. */
function inferCaptureSource(fields: DraftTruthFields): CaptureSource {
  const proposer = `${fields["Proposed By Agent"] ?? ""} ${fields["Created By"] ?? ""}`.toLowerCase();
  if (proposer.includes("sentinel") || proposer.includes("scanner") || proposer.includes("intake"))
    return "external";
  if (proposer.includes("interaction") || proposer.includes("chat") || proposer.includes("clive"))
    return "chat";
  // Default: a human-driven submission.
  return "user-guided";
}

function mapRecord(record: {
  id: string;
  fields: DraftTruthFields;
}): ReceivingRecord | null {
  const title = record.fields.Title?.trim();
  if (!title) return null;
  const canonicalText = record.fields["Canonical Text"]?.trim() ?? "";
  const read = normaliseCaptureSource(record.fields["Capture Source"]);
  return {
    recordId: record.id,
    title,
    snippet: truncate(canonicalText || title),
    provenance:
      record.fields["Proposed By Agent"]?.trim() ||
      record.fields["Created By"]?.trim() ||
      "Clive's Man",
    captureSource: read ?? inferCaptureSource(record.fields),
    brainSlug: record.fields["Brain Slug"]?.trim() || undefined,
    status: record.fields.Status?.trim() || undefined,
    canonicalText,
  };
}

const SEED_RECORDS: ReceivingRecord[] = [
  {
    recordId: "seed-core-goals-long-term",
    title: "Core · Goals (long-term)",
    snippet: "Where AstraJax is headed — the durable aims the work points at.",
    provenance: "Doc Brain Base Builder",
    captureSource: "external",
    brainSlug: "astrajax-chapter-1",
    status: "Ready for review",
    canonicalText:
      "AstraJax's long-term goals, as currently understood by the household. Read in full in the sitting.",
  },
  {
    recordId: "seed-core-definition",
    title: "Core · Definition",
    snippet: "What AstraJax is, stated plainly enough to govern against.",
    provenance: "User submission",
    captureSource: "user-guided",
    brainSlug: "astrajax-chapter-1",
    status: "Ready for review",
    canonicalText: "The working definition of AstraJax. Read in full in the sitting.",
  },
  {
    recordId: "seed-core-open-questions",
    title: "Core · Open Questions",
    snippet: "Unresolved ambiguity a human still needs to decide.",
    provenance: "Chat session review",
    captureSource: "chat",
    brainSlug: "astrajax-chapter-1",
    status: "Ready for review",
    canonicalText: "Open questions surfaced from reviewed conversations. Read in full in the sitting.",
  },
];

export async function handleReceivingWallRecords(): Promise<{
  records: ReceivingRecord[];
  source: "live" | "derived" | "seed";
  message?: string;
}> {
  const baseId = getWorkshopBaseId();
  const token = getWorkshopReadToken();
  const tableId = BRAIN_WORKSHOP_TABLES.draftBrainTruth;

  if (!baseId || !token) {
    return {
      records: SEED_RECORDS,
      source: "seed",
      message: "Workshop read token not configured — showing seeded records.",
    };
  }

  try {
    const records = await airtableSelect(baseId, tableId, token, {
      fields: Object.values(DRAFT_TRUTH_FIELDS_BY_NAME),
      maxRecords: WALL_CAP,
    });

    const mapped = records
      .map(mapRecord)
      .filter((row): row is ReceivingRecord => row !== null);

    if (mapped.length === 0) {
      return {
        records: SEED_RECORDS,
        source: "seed",
        message: "No pending draft truths on the bench — showing seeded records.",
      };
    }

    // If every row's tint came from inference (the field isn't populated yet),
    // tell the UI the tints are derived, not read.
    const anyExplicit = records.some((r) =>
      normaliseCaptureSource(r.fields["Capture Source"]),
    );

    return { records: mapped, source: anyExplicit ? "live" : "derived" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the receiving wall.";
    return { records: SEED_RECORDS, source: "seed", message };
  }
}
