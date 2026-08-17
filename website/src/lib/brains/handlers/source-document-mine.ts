import {
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS,
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { airtableSelect, airtableUpdate, escapeAirtableString } from "../airtable-rest";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import {
  createDraftTruthRecord,
  DRAFT_TRUTH_CAPTURE_SOURCE,
  resolveBrainRegistryRecordId,
} from "../draft-truth-write";
import {
  buildSummarisedEligibilityFormula,
  structureProposalsFromSummary,
  type SourceDocumentRow,
  type SourceMineProposal,
} from "../source-document-mining";
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

    for (const proposal of structured) {
      // Mining used to POST its own name-keyed payload here, which is how the
      // 17 Aug rename made file mining fail quietly. It goes through the door now:
      // both registers, live brain link, field IDs, and the source file attached.
      const brainRegistryRecordId = await resolveBrainRegistryRecordId(
        workshopBaseId,
        workshopToken,
        proposal.brainSlug,
      );
      const draft = await createDraftTruthRecord(workshopBaseId, workshopToken, {
        title: proposal.title,
        canonicalTextForAgents: proposal.canonicalText,
        brainSlug: proposal.brainSlug,
        brainRegistryRecordId: brainRegistryRecordId ?? undefined,
        brainTheme: proposal.brainTheme,
        proposedCategory: proposal.proposedCategory,
        captureSource: DRAFT_TRUTH_CAPTURE_SOURCE.external,
        proposedByAgent: PROPOSED_BY_AGENT,
        createdBy: "Agent",
        sourceDocumentRecordIds: [source.recordId],
        tableId: draftTableId,
      });
      createdDraftIds.push(draft.recordId);
      draftRecordIds.push(draft.recordId);
    }

    await airtableUpdate(
      workshopBaseId,
      sourceTableId,
      workshopToken,
      source.recordId,
      {
        [BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.mineStatus]:
          BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.proposed,
        ...(createdDraftIds.length > 0
          ? { [BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.linkedDrafts]: createdDraftIds }
          : {}),
      },
      { returnFieldsByFieldId: true },
    );
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
      BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.title,
      BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.attachmentSummary,
      BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.mineStatus,
      BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS.brainSlug,
    ],
    returnFieldsByFieldId: true,
  });

  return records.map(mapSourceDocumentRecord);
}

/** Read either shape: field IDs from a live read, names from an older fixture. */
function readSourceField(
  fields: Record<string, unknown>,
  key: keyof typeof SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES,
): unknown {
  const byId = fields[BRAIN_WORKSHOP_SOURCE_DOCUMENTS_FIELDS[key]];
  if (byId !== undefined) return byId;
  return fields[SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES[key]];
}

function mapSourceDocumentRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): SourceDocumentRow {
  const fields = record.fields;
  return {
    recordId: record.id,
    documentTitle: String(readSourceField(fields, "title") ?? "Untitled source"),
    summary: String(readSourceField(fields, "attachmentSummary") ?? ""),
    mineStatus: String(
      readSourceField(fields, "mineStatus") ??
        BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.pending,
    ) as SourceDocumentRow["mineStatus"],
    brainSlug: String(readSourceField(fields, "brainSlug") ?? ""),
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
