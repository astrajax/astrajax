import {
  SOURCE_DOCUMENT_MINE_STATUS,
  structureProposalsFromSummary,
  type SourceDocumentMineStatus,
  type SourceDocumentRow,
  type SourceMineProposal,
} from "../source-document-mining";
import type { SourceDocumentMineResult } from "../types";

interface MemorySourceDocument extends SourceDocumentRow {
  attachmentPresent?: boolean;
}

const memorySourceDocuments = new Map<string, MemorySourceDocument>();
const memoryDrafts: Array<{
  recordId: string;
  fields: Record<string, unknown>;
}> = [];

function nextMemoryId(prefix: string): string {
  return `${prefix}_${Date.now()}_${memorySourceDocuments.size + memoryDrafts.length}`;
}

export function clearMemorySourceDocumentsForTests(): void {
  memorySourceDocuments.clear();
  memoryDrafts.length = 0;
}

export function seedMemorySourceDocument(row: Omit<SourceDocumentRow, "recordId"> & {
  recordId?: string;
  attachmentPresent?: boolean;
}): SourceDocumentRow {
  const recordId = row.recordId ?? nextMemoryId("srcdoc");
  const stored: MemorySourceDocument = {
    recordId,
    documentTitle: row.documentTitle,
    summary: row.summary,
    mineStatus: row.mineStatus,
    brainSlug: row.brainSlug,
    brainTheme: row.brainTheme,
    attachmentPresent: row.attachmentPresent,
  };
  memorySourceDocuments.set(recordId, stored);
  return stored;
}

export function listMemoryEligibleSourceDocuments(brainSlug: string, limit: number): SourceDocumentRow[] {
  return [...memorySourceDocuments.values()]
    .filter((row) => row.brainSlug === brainSlug)
    .filter((row) => row.mineStatus === SOURCE_DOCUMENT_MINE_STATUS.summarised && row.summary.trim())
    .slice(0, limit);
}

export function mineMemorySourceDocuments(
  brainSlug: string,
  limit: number,
  dryRun: boolean,
): SourceDocumentMineResult {
  const eligible = listMemoryEligibleSourceDocuments(brainSlug, limit);
  const proposals: SourceMineProposal[] = [];
  const minedSourceDocumentIds: string[] = [];
  const draftRecordIds: string[] = [];

  for (const source of eligible) {
    const structured = structureProposalsFromSummary(source);
    proposals.push(...structured);

    if (dryRun) continue;

    for (const proposal of structured) {
      const draftId = nextMemoryId("draft");
      memoryDrafts.push({
        recordId: draftId,
        fields: {
          Title: proposal.title,
          "Canonical Text": proposal.canonicalText,
          "Brain Slug": proposal.brainSlug,
          "Brain Theme": proposal.brainTheme ?? "",
          "Proposed Category": proposal.proposedCategory,
          Status: "Draft",
          "Proposed By Agent": "clive-man",
          "Created By": "Agent",
          "Source Document Record ID": proposal.sourceDocumentRecordId,
        },
      });
      draftRecordIds.push(draftId);
    }

    const stored = memorySourceDocuments.get(source.recordId);
    if (stored) {
      stored.mineStatus = SOURCE_DOCUMENT_MINE_STATUS.proposed;
    }
    minedSourceDocumentIds.push(source.recordId);
  }

  return {
    mode: "memory",
    brainSlug,
    dryRun,
    eligibleCount: eligible.length,
    proposals,
    draftRecordIds,
    minedSourceDocumentIds,
  };
}

export function setMemorySourceDocumentStatus(
  recordId: string,
  mineStatus: SourceDocumentMineStatus,
): void {
  const row = memorySourceDocuments.get(recordId);
  if (row) row.mineStatus = mineStatus;
}
