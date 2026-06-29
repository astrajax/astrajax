/**
 * Source Document Mining — V1 helpers (Pam gates).
 * Clive's Man reads Workshop summaries only; never attachments in the agent loop.
 */

import { BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS } from "./airtable-ids";

export const SOURCE_DOCUMENT_MINE_STATUS = BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS;

export type SourceDocumentMineStatus =
  (typeof SOURCE_DOCUMENT_MINE_STATUS)[keyof typeof SOURCE_DOCUMENT_MINE_STATUS];

/** V1 category ceiling — Pam gate 4. */
export const SOURCE_MINE_V1_CATEGORIES = [
  "Definition",
  "Knowledge",
  "Open Questions",
] as const;

export type SourceMineV1Category = (typeof SOURCE_MINE_V1_CATEGORIES)[number];

export interface SourceDocumentRow {
  recordId: string;
  documentTitle: string;
  summary: string;
  mineStatus: SourceDocumentMineStatus;
  brainSlug: string;
  brainTheme?: string;
}

export interface SourceMineProposal {
  title: string;
  canonicalText: string;
  proposedCategory: SourceMineV1Category;
  brainSlug: string;
  brainTheme?: string;
  sourceDocumentRecordId: string;
}

const UNCERTAINTY_PATTERN =
  /\?(?:\s|$)|\b(tbd|todo|unclear|unknown|unsure|not sure|open question|needs decision|we haven't decided|gap)\b/i;

const DEFINITION_PATTERN =
  /\b(is defined as|means|refers to|this (domain|brain|area) is|definition:|what .* is\b)/i;

export function isAllowedMineCategory(category: string): category is SourceMineV1Category {
  return (SOURCE_MINE_V1_CATEGORIES as readonly string[]).includes(category);
}

/** Pam gate 5 — gaps and uncertainty land in Open Questions, not Definition. */
export function resolveMineCategory(text: string, explicit?: string): SourceMineV1Category {
  if (explicit && isAllowedMineCategory(explicit)) {
    if (explicit === "Definition" && looksUncertain(text)) {
      return "Open Questions";
    }
    return explicit;
  }
  if (looksUncertain(text)) return "Open Questions";
  if (DEFINITION_PATTERN.test(text)) return "Definition";
  return "Knowledge";
}

export function looksUncertain(text: string): boolean {
  return UNCERTAINTY_PATTERN.test(text.trim());
}

/** Pam gate 7 — only Summarised rows not yet Proposed or Skipped. */
export function isEligibleForMining(row: Pick<SourceDocumentRow, "mineStatus" | "summary">): boolean {
  if (row.mineStatus !== SOURCE_DOCUMENT_MINE_STATUS.summarised) return false;
  return Boolean(row.summary?.trim());
}

const SECTION_HEADER =
  /^##\s*(Definition|Knowledge|Open Questions)\s*$/gim;

export function structureProposalsFromSummary(
  source: SourceDocumentRow,
): SourceMineProposal[] {
  const summary = source.summary.trim();
  if (!summary) return [];

  const sectioned = parseSectionedSummary(summary);
  if (sectioned.length > 0) {
    return sectioned.map((chunk) => ({
      title: chunk.title,
      canonicalText: chunk.text,
      proposedCategory: resolveMineCategory(chunk.text, chunk.category),
      brainSlug: source.brainSlug,
      brainTheme: source.brainTheme,
      sourceDocumentRecordId: source.recordId,
    }));
  }

  const paragraphs = summary
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [
      buildProposal(source, "Source summary", summary, resolveMineCategory(summary)),
    ];
  }

  return paragraphs.map((paragraph, index) => {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? `Extract ${index + 1}`;
    const title =
      firstLine.length <= 120 ? firstLine : `${firstLine.slice(0, 117).trim()}…`;
    return buildProposal(source, title, paragraph, resolveMineCategory(paragraph));
  });
}

function buildProposal(
  source: SourceDocumentRow,
  title: string,
  canonicalText: string,
  proposedCategory: SourceMineV1Category,
): SourceMineProposal {
  return {
    title,
    canonicalText,
    proposedCategory,
    brainSlug: source.brainSlug,
    brainTheme: source.brainTheme,
    sourceDocumentRecordId: source.recordId,
  };
}

function parseSectionedSummary(
  summary: string,
): Array<{ category: SourceMineV1Category; title: string; text: string }> {
  const matches = [...summary.matchAll(SECTION_HEADER)];
  if (matches.length === 0) return [];

  const chunks: Array<{ category: SourceMineV1Category; title: string; text: string }> = [];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const categoryLabel = match[1] as SourceMineV1Category;
    if (!isAllowedMineCategory(categoryLabel)) continue;

    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? summary.length;
    const body = summary.slice(start, end).trim();
    if (!body) continue;

    const titleLine = body.split("\n")[0]?.trim() ?? categoryLabel;
    chunks.push({
      category: categoryLabel,
      title: titleLine.length <= 120 ? titleLine : `${titleLine.slice(0, 117).trim()}…`,
      text: body,
    });
  }

  return chunks;
}

export function buildSummarisedEligibilityFormula(brainSlug: string): string {
  const slug = brainSlug.replace(/'/g, "''");
  return `AND({Brain Slug}='${slug}',{Mine Status}='${SOURCE_DOCUMENT_MINE_STATUS.summarised}',LEN(TRIM({Attachment Summary}&''))>0)`;
}
