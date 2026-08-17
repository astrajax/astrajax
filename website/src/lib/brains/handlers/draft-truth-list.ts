import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "../airtable-ids";
import { airtableSelect, escapeAirtableString } from "../airtable-rest";
import { readDraftTruthText } from "../draft-truth-write";
import { scopeForDraft } from "@/lib/aie-demo/draft-truth-utils";

export type WorkshopDraftTruth = {
  recordId: string;
  title: string;
  canonicalText: string;
  proposedCategory: string;
  brainTheme?: string;
  status: string;
  proposedByAgent?: string;
  scope: string;
  source: "workshop" | "fallback";
};

function mapRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): WorkshopDraftTruth | null {
  const title = readDraftTruthText(record.fields, "title");
  const canonicalText =
    readDraftTruthText(record.fields, "canonicalTextForAgents") ||
    readDraftTruthText(record.fields, "canonicalTextForHumans");
  if (!title || !canonicalText) return null;

  const proposedCategory =
    readDraftTruthText(record.fields, "proposedCategory") || "Definition";
  const brainTheme = readDraftTruthText(record.fields, "brainTheme") || undefined;

  return {
    recordId: record.id,
    title,
    canonicalText,
    proposedCategory,
    brainTheme,
    status: readDraftTruthText(record.fields, "status") || "Draft",
    proposedByAgent: readDraftTruthText(record.fields, "proposedByAgent") || undefined,
    scope: scopeForDraft({ brainTheme, proposedCategory }),
    source: "workshop",
  };
}

export async function handleDraftTruthList(brainSlug: string): Promise<{
  mode: "airtable" | "fallback";
  drafts: WorkshopDraftTruth[];
  message?: string;
}> {
  const slug = brainSlug.trim() || CHAPTER1_BRAIN_SLUG;
  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_DRAFT_TRUTH_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.draftBrainTruth;
  const f = BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS;

  if (!workshopBaseId || !workshopToken) {
    return {
      mode: "fallback",
      drafts: [],
      message:
        "Workshop Airtable is not wired (BRAIN_WORKSHOP_WRITE_TOKEN). Draft truths will load from your session.",
    };
  }

  try {
    const records = await airtableSelect(workshopBaseId, tableId, workshopToken, {
      filterByFormula: `AND({Brain Slug}='${escapeAirtableString(slug)}', {Status}='Draft')`,
      fields: [
        f.title,
        f.canonicalTextForAgents,
        f.canonicalTextForHumans,
        f.proposedCategory,
        f.brainTheme,
        f.status,
        f.proposedByAgent,
        f.brainSlug,
      ],
      maxRecords: 20,
      sortField: "Title",
      sortDirection: "asc",
      returnFieldsByFieldId: true,
    });

    const drafts = records
      .map(mapRecord)
      .filter((draft): draft is WorkshopDraftTruth => draft !== null);

    if (drafts.length === 0) {
      return {
        mode: "fallback",
        drafts: [],
        message: "No Draft rows in Workshop for this brain yet — showing session drafts.",
      };
    }

    return { mode: "airtable", drafts };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load Workshop draft truths.";
    return {
      mode: "fallback",
      drafts: [],
      message,
    };
  }
}
