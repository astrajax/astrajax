import {
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS,
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { airtableCreate, airtableSelect, airtableUpdate, escapeAirtableString } from "../airtable-rest";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import {
  buildSummarisedEligibilityFormula,
  structureProposalsFromSummary,
  type SourceDocumentRow,
  type SourceMineProposal,
} from "../source-document-mining";
import {
  buildDraftTruthCreateFields,
  DRAFT_TRUTH_CAPTURE_SOURCE,
  resolveBrainRegistryRecordId,
} from "../draft-truth-write";
import type { SourceDocumentMineBody, SourceDocumentMineResult } from "../types";
import { mineMemorySourceDocuments } from "./source-document-memory";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const PROPOSED_BY_AGENT = "clive-man";

export const SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES = {
  title: "Title",
  attachmentSummary: "Attachment Summary",
  mineStatus: "Mine Status",
  brainSlug: "Brain Slug",
  linkedDrafts: "Linked Drafts",
} as const;

export async function handleSourceDocumentMine(
  body: SourceDocumentMineBody,
): Promise<SourceDocumentMineResult> {
  const brainSlug = body.brainSlug?.trim();
  if (!brainSlug) throw new Error("brainSlug is required.");

  const limit = clampLimit(body.limit);
  const dryRun = Boolean(body.dryRun);

  if (useMemoryStore()) {
    return mineMemorySourceDocuments(brainSlug, limit, dryRun);
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const sourceTableId =
    process.env.BRAIN_WORKSHOP_SOURCE_DOCUMENTS_TABLE_ID ??
    BRAIN_WORKSHOP_TABLES.sourceDocuments;
  const draftTableId =
    process.env.BRAIN_WORKSHOP_DRAFT_TRUTH_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.draftBrainTruth;

  if (!workshopBaseId || !workshopToken || !sourceTableId || !draftTableId) {
    throw new Error("Workshop source document mining is not configured.");
  }

  const eligible = await listEligibleSourceDocuments(
    workshopBaseId,
    sourceTableId,
    workshopToken,
    brainSlug,
    limit,
  );

  const proposals: SourceMineProposal[] = [];
  const draftRecordIds: string[] = [];
  const minedSourceDocumentIds: string[] = [];

  for (const source of eligible) {
    const structured = structureProposalsFromSummary(source);
    proposals.push(...structured);

    if (dryRun) continue;

    const createdDraftIds: string[] = [];

    const brainRegistryRecordId = await resolveBrainRegistryRecordId(
      workshopBaseId,
      workshopToken,
      source.brainSlug || brainSlug,
    );
    if (!brainRegistryRecordId) {
      throw new Error(
        `No Workshop Brain Registry row for brain slug "${source.brainSlug || brainSlug}". A slug alone is not a destination.`,
      );
    }

    for (const proposal of structured) {
      const draft = await airtableCreate(
        workshopBaseId,
        draftTableId,
        workshopToken,
        buildDraftTruthCreateFields({
          title: proposal.title,
          canonicalTextForAgents: proposal.canonicalText,
          brainSlug: proposal.brainSlug || brainSlug,
          brainRegistryRecordId,
          brainTheme: proposal.brainTheme,
          proposedCategory: proposal.proposedCategory,
          recordType:
            proposal.proposedCategory === "Open Questions" ? "Open Question" : "Truth Claim",
          // A file is the evidence, so the draft carries the document link itself.
          captureSource: DRAFT_TRUTH_CAPTURE_SOURCE.external,
          proposedByAgent: PROPOSED_BY_AGENT,
          sourceDocumentRecordIds: [proposal.sourceDocumentRecordId],
        }),
      );
      createdDraftIds.push(draft.id);
      draftRecordIds.push(draft.id);
    }

    await airtableUpdate(workshopBaseId, sourceTableId, workshopToken, source.recordId, {
      "Mine Status": BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.proposed,
      ...(createdDraftIds.length > 0
        ? { [SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.linkedDrafts]: createdDraftIds }
        : {}),
    });
    minedSourceDocumentIds.push(source.recordId);
  }

  return {
    mode: "airtable",
    brainSlug,
    dryRun,
    eligibleCount: eligible.length,
    proposals,
    draftRecordIds,
    minedSourceDocumentIds,
  };
}

async function listEligibleSourceDocuments(
  baseId: string,
  tableId: string,
  token: string,
  brainSlug: string,
  limit: number,
): Promise<SourceDocumentRow[]> {
  const formula = buildSummarisedEligibilityFormula(brainSlug);
  const records = await airtableSelect(baseId, tableId, token, {
    filterByFormula: formula,
    maxRecords: limit,
    fields: [
      SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.title,
      SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.attachmentSummary,
      SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.mineStatus,
      SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.brainSlug,
    ],
  });

  return records.map(mapSourceDocumentRecord);
}

function mapSourceDocumentRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): SourceDocumentRow {
  const fields = record.fields;
  return {
    recordId: record.id,
    documentTitle: String(fields[SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.title] ?? "Untitled source"),
    summary: String(fields[SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.attachmentSummary] ?? ""),
    mineStatus: String(
      fields[SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.mineStatus] ??
        BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.pending,
    ) as SourceDocumentRow["mineStatus"],
    brainSlug: String(fields[SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES.brainSlug] ?? ""),
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), MAX_LIMIT);
}

/** Field ID map reference for Doc handoffs and MCP alignment. */
export const SOURCE_DOCUMENT_FIELD_IDS = BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS;

export function escapeBrainSlugForFormula(brainSlug: string): string {
  return escapeAirtableString(brainSlug);
}
