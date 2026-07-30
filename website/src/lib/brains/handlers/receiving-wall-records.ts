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
 * Draft Brain Truth table (Matthew to add it — see PR). We only *request* that
 * field once Matthew has set BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID to its
 * field ID: requesting a not-yet-created field by name makes Airtable answer
 * 422 "Unknown field name". Until then the source is inferred from the
 * proposing agent / created-by fields, and `source: "derived"` tells the UI to
 * note the tint is inferred rather than read.
 */

type DraftTruthFields = {
  Title?: string;
  "Canonical Text"?: string;
  "Brain Slug"?: string;
  "Proposed Category"?: string;
  Status?: string;
  "Proposed By Agent"?: string;
  "Created By"?: string;
  /** New single-select, present only once Matthew creates it. */
  "Capture Source"?: string;
};

/** Fields always present on the table — safe to request by ID. */
const BASE_FIELD_IDS: string[] = [
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
];

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

  // Only request the Capture Source field once Matthew has created it and set
  // its field ID — asking for a not-yet-created field by name 422s the read.
  const captureSourceFieldId = process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID;
  const fieldIds = captureSourceFieldId
    ? [...BASE_FIELD_IDS, captureSourceFieldId]
    : BASE_FIELD_IDS;

  try {
    const records = await airtableSelect(baseId, tableId, token, {
      fields: fieldIds,
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

    // The tint is only truly *read* once the field exists and at least one row
    // carries a recognised value; until then it is inferred.
    const anyExplicit =
      Boolean(captureSourceFieldId) &&
      records.some((r) => normaliseCaptureSource(r.fields["Capture Source"]));

    return { records: mapped, source: anyExplicit ? "live" : "derived" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load the receiving wall.";
    return { records: SEED_RECORDS, source: "seed", message };
  }
}
