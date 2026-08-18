import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import {
  BRAIN_WORKSHOP_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "../airtable-ids";
import { airtableSelect, escapeAirtableString } from "../airtable-rest";

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

type DraftFields = {
  Title?: string;
  "Canonical Text for Agents"?: string;
  "Canonical Text for Humans"?: string;
  "Proposed Category"?: string;
  "Brain Theme"?: string;
  Status?: string;
  "Proposed By Agent"?: string;
  "Brain Slug"?: string;
};

import { scopeForDraft } from "@/lib/aie-demo/draft-truth-utils";

function mapRecord(record: { id: string; fields: DraftFields }): WorkshopDraftTruth | null {
  const title = record.fields.Title?.trim();
  const canonicalText = record.fields["Canonical Text for Agents"]?.trim();
  if (!title || !canonicalText) return null;

  const proposedCategory = record.fields["Proposed Category"]?.trim() ?? "Definition";
  const brainTheme = record.fields["Brain Theme"]?.trim();

  return {
    recordId: record.id,
    title,
    canonicalText,
    proposedCategory,
    brainTheme,
    status: record.fields.Status?.trim() ?? "Draft",
    proposedByAgent: record.fields["Proposed By Agent"]?.trim(),
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
      maxRecords: 20,
      sortField: "Title",
      sortDirection: "asc",
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
