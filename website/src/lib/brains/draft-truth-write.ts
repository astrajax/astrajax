/**
 * Draft Brain Truth write contract — one door for every capture path.
 *
 * Applied 17 Aug 2026 (`rpt-draft-truth-builder-overlay-20260817`). Every agent
 * that creates a Draft row must link a live brain, write both text registers, and
 * leave Matthew's builder-review overlay untouched.
 *
 * Server-only. Never import from a client component.
 */

import {
  BRAIN_WORKSHOP_BRAIN_REGISTRY_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  DRAFT_TRUTH_HUMAN_ONLY_FIELD_NAMES,
} from "./airtable-ids";
import { airtableFindOne, escapeAirtableString } from "./airtable-rest";

/** Live Capture Source choices — exact names, nothing else is accepted. */
export const DRAFT_TRUTH_CAPTURE_SOURCE = {
  chatSession: "Chat Session",
  userGuided: "User Guided Capture",
  external: "External Context Capture",
} as const;

export type DraftTruthCaptureSource =
  (typeof DRAFT_TRUTH_CAPTURE_SOURCE)[keyof typeof DRAFT_TRUTH_CAPTURE_SOURCE];

/** Statuses an agent may write. Everything else is a human or a drift alarm. */
export const AGENT_WRITABLE_DRAFT_STATUS = ["Draft", "Quarantined"] as const;

export type AgentWritableDraftStatus = (typeof AGENT_WRITABLE_DRAFT_STATUS)[number];

export interface DraftTruthWriteInput {
  title: string;
  /** Complete register — keeps record IDs and precision. */
  canonicalTextForAgents: string;
  /**
   * Plain register of the same claim. Omit only when there is nothing to say
   * differently; the helper then derives it from the agent text.
   */
  canonicalTextForHumans?: string;
  brainSlug: string;
  /** Brain Registry record id. Resolve with `resolveBrainRegistryRecordId`. */
  brainRegistryRecordId?: string;
  proposedCategory?: string;
  recordType?: string;
  horizon?: string;
  brainTheme?: string;
  captureSource: DraftTruthCaptureSource;
  proposedByAgent: string;
  createdBy?: string;
  status?: AgentWritableDraftStatus;
  /** Link when a file is the evidence. */
  sourceDocumentRecordIds?: string[];
  /** Link when the row came from the V1 proposal queue. */
  contextAmendmentVersionRecordIds?: string[];
  supersedesTrustedTruthId?: string;
}

/**
 * Airtable REST keys on field names, and the agent/human text fields were renamed
 * on 17 Aug 2026 — `Canonical Text` no longer exists on this table. Read and write
 * Draft Brain Truth through this map so a future rename is a one-line change.
 */
export const DRAFT_TRUTH_FIELD_NAMES = {
  title: "Title",
  canonicalTextForAgents: "Canonical Text for Agents",
  canonicalTextForHumans: "Canonical Text for Humans",
  brainSlug: "Brain Slug",
  brainRegistry: "Brain Registry",
  brainTheme: "Brain Theme",
  proposedCategory: "Proposed Category",
  recordType: "Record Type",
  horizon: "Horizon",
  status: "Status",
  proposedByAgent: "Proposed By Agent",
  createdBy: "Created By",
  captureSource: "Capture Source",
  sourceDocuments: "Source Documents",
  contextAmendmentVersions: "Context Amendment Versions",
  supersedesTrustedTruthId: "Supersedes Trusted Truth ID",
} as const;

const RECORD_ID_PATTERN = /\b(?:rec|tbl|app|fld|sel|usr|wsp)[A-Za-z0-9]{14}\b/g;

/**
 * Fallback human register: the same sentences with Airtable record IDs and their
 * surrounding brackets removed. Meaning is preserved, so the two registers cannot
 * disagree — an agent that has something genuinely plainer to say passes it in.
 */
export function deriveHumanText(agentText: string): string {
  return agentText
    .replace(/\s*[([]\s*(?:`?(?:rec|tbl|app|fld|sel)[A-Za-z0-9]{14}`?[,;/\s]*)+\)?\]?/g, "")
    .replace(RECORD_ID_PATTERN, "")
    .replace(/`\s*`/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function containsRecordId(text: string): boolean {
  RECORD_ID_PATTERN.lastIndex = 0;
  return RECORD_ID_PATTERN.test(text);
}

/**
 * Build the create payload for one Draft Brain Truth row.
 * Throws rather than writing a row that breaks the capture contract.
 */
export function buildDraftTruthCreateFields(
  input: DraftTruthWriteInput,
): Record<string, unknown> {
  const title = input.title.trim();
  const agentText = input.canonicalTextForAgents.trim();
  if (!title) throw new Error("Draft Brain Truth requires a Title.");
  if (!agentText) throw new Error("Draft Brain Truth requires Canonical Text for Agents.");

  const brainSlug = input.brainSlug.trim();
  if (!brainSlug) throw new Error("Draft Brain Truth requires a brain slug.");

  const status = input.status ?? "Draft";
  if (!(AGENT_WRITABLE_DRAFT_STATUS as readonly string[]).includes(status)) {
    throw new Error(
      `Agents may only write Draft or Quarantined, not ${status}. Promotion is a human gate.`,
    );
  }

  const captureSource = input.captureSource;
  if (
    !(Object.values(DRAFT_TRUTH_CAPTURE_SOURCE) as string[]).includes(captureSource)
  ) {
    throw new Error(`Unknown Capture Source: ${captureSource}`);
  }

  const humanText = (input.canonicalTextForHumans ?? "").trim() || deriveHumanText(agentText);
  if (!humanText) {
    throw new Error("Draft Brain Truth requires Canonical Text for Humans.");
  }

  const proposedByAgent = input.proposedByAgent.trim();
  if (!proposedByAgent) {
    throw new Error("Draft Brain Truth requires an honest Proposed By Agent name.");
  }

  const fields: Record<string, unknown> = {
    [DRAFT_TRUTH_FIELD_NAMES.title]: title,
    [DRAFT_TRUTH_FIELD_NAMES.canonicalTextForAgents]: agentText,
    [DRAFT_TRUTH_FIELD_NAMES.canonicalTextForHumans]: humanText,
    [DRAFT_TRUTH_FIELD_NAMES.brainSlug]: brainSlug,
    [DRAFT_TRUTH_FIELD_NAMES.status]: status,
    [DRAFT_TRUTH_FIELD_NAMES.proposedByAgent]: proposedByAgent,
    [DRAFT_TRUTH_FIELD_NAMES.createdBy]: input.createdBy ?? "Agent",
    [DRAFT_TRUTH_FIELD_NAMES.captureSource]: captureSource,
  };

  if (input.brainRegistryRecordId) {
    fields[DRAFT_TRUTH_FIELD_NAMES.brainRegistry] = [input.brainRegistryRecordId];
  }
  if (input.brainTheme) fields[DRAFT_TRUTH_FIELD_NAMES.brainTheme] = input.brainTheme;
  if (input.proposedCategory) fields[DRAFT_TRUTH_FIELD_NAMES.proposedCategory] = input.proposedCategory;
  if (input.recordType) fields[DRAFT_TRUTH_FIELD_NAMES.recordType] = input.recordType;
  if (input.horizon) fields[DRAFT_TRUTH_FIELD_NAMES.horizon] = input.horizon;
  if (input.supersedesTrustedTruthId) {
    fields[DRAFT_TRUTH_FIELD_NAMES.supersedesTrustedTruthId] = input.supersedesTrustedTruthId;
  }
  if (input.sourceDocumentRecordIds?.length) {
    fields[DRAFT_TRUTH_FIELD_NAMES.sourceDocuments] = input.sourceDocumentRecordIds;
  }
  if (input.contextAmendmentVersionRecordIds?.length) {
    fields[DRAFT_TRUTH_FIELD_NAMES.contextAmendmentVersions] = input.contextAmendmentVersionRecordIds;
  }

  assertNoBuilderReviewFields(fields);
  return fields;
}

/**
 * Matthew's review overlay is the only signal that a human looked at a row.
 * An agent filling it in would make that signal a lie, so refuse the whole write.
 */
export function assertNoBuilderReviewFields(fields: Record<string, unknown>): void {
  const offenders = DRAFT_TRUTH_HUMAN_ONLY_FIELD_NAMES.filter((name) => name in fields);
  if (offenders.length > 0) {
    throw new Error(
      `Agents must not write Matthew's builder-review fields: ${offenders.join(", ")}`,
    );
  }
}

const registryCache = new Map<string, string | null>();

/**
 * Resolve a brain slug to its Workshop Brain Registry record so the draft has a
 * real destination rather than free text. Returns null when no brain matches —
 * callers decide whether that is a refusal or a slug-only fallback.
 */
export async function resolveBrainRegistryRecordId(
  baseId: string,
  token: string,
  brainSlug: string,
): Promise<string | null> {
  const slug = brainSlug.trim();
  if (!slug) return null;
  const cacheKey = `${baseId}:${slug}`;
  const cached = registryCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const record = await airtableFindOne(
    baseId,
    BRAIN_WORKSHOP_TABLES.brainRegistry,
    token,
    `{Brain Slug}='${escapeAirtableString(slug)}'`,
    [BRAIN_WORKSHOP_BRAIN_REGISTRY_FIELDS.brainSlug],
  ).catch(() => null);

  const recordId = record?.id ?? null;
  registryCache.set(cacheKey, recordId);
  return recordId;
}

export function clearBrainRegistryCacheForTests(): void {
  registryCache.clear();
}
