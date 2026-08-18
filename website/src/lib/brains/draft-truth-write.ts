/**
 * Draft Brain Truth write contract — one door for every capture path.
 *
 * Applied 17 Aug 2026 (`rpt-draft-truth-builder-overlay-20260817`). Every agent
 * that creates a Draft row must link a live brain, write both text registers, and
 * leave Matthew's builder-review overlay untouched.
 *
 * Airtable REST writes key on **field IDs** so a rename cannot break capture again.
 *
 * Server-only. Never import from a client component.
 */

import {
  BRAIN_WORKSHOP_BRAIN_REGISTRY_FIELDS,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_PROJECT_LIFECYCLE,
  BRAIN_WORKSHOP_PROJECTS_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  DRAFT_TRUTH_HUMAN_ONLY_FIELD_NAMES,
  DRAFT_TRUTH_HUMAN_ONLY_FIELDS,
} from "./airtable-ids";
import { airtableFindOne, airtableSelect, escapeAirtableString } from "./airtable-rest";

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
  /** Brain Registry record id. Required on create — resolve with `resolveBrainRegistryRecordId`. */
  brainRegistryRecordId: string;
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
  /**
   * Live Projects record IDs already chosen by Clive's Man the HEAD in the brief.
   * Cheap proposer/challenger/executor copy or write these IDs only — they do not
   * choose. Blank is legal.
   */
  relatedProjectRecordIds?: string[];
  supersedesTrustedTruthId?: string;
}

/**
 * Field-ID keys for Draft Brain Truth creates. Prefer this over display names so
 * a rename (like Canonical Text → Canonical Text for Agents) cannot break capture.
 */
export const DRAFT_TRUTH_FIELD_IDS = {
  title: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
  canonicalTextForAgents: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
  canonicalTextForHumans: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalTextForHumans,
  brainSlug: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
  brainRegistry: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainRegistry,
  brainTheme: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainTheme,
  proposedCategory: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
  recordType: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.recordType,
  horizon: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.horizon,
  status: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
  proposedByAgent: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
  createdBy: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
  captureSource: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.captureSource,
  sourceDocuments: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.sourceDocuments,
  contextAmendmentVersions: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.contextAmendmentVersions,
  relatedProjects: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.relatedProjects,
  supersedesTrustedTruthId: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.supersedesTrustedTruthId,
} as const;

/**
 * @deprecated Display names only — do not use for Airtable REST writes.
 * Kept for memory-store / promote eligibility helpers that still key UI snapshots by name.
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
  relatedProjects: "Related Projects",
  supersedesTrustedTruthId: "Supersedes Trusted Truth ID",
} as const;

const LIVE_RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

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
 * Keys are Airtable field IDs.
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

  const brainRegistryRecordId = input.brainRegistryRecordId.trim();
  if (!LIVE_RECORD_ID.test(brainRegistryRecordId)) {
    throw new Error(
      "Draft Brain Truth requires a live Brain Registry link. A Brain Slug alone is not a destination.",
    );
  }

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
    [DRAFT_TRUTH_FIELD_IDS.title]: title,
    [DRAFT_TRUTH_FIELD_IDS.canonicalTextForAgents]: agentText,
    [DRAFT_TRUTH_FIELD_IDS.canonicalTextForHumans]: humanText,
    [DRAFT_TRUTH_FIELD_IDS.brainSlug]: brainSlug,
    [DRAFT_TRUTH_FIELD_IDS.brainRegistry]: [brainRegistryRecordId],
    [DRAFT_TRUTH_FIELD_IDS.status]: status,
    [DRAFT_TRUTH_FIELD_IDS.proposedByAgent]: proposedByAgent,
    [DRAFT_TRUTH_FIELD_IDS.createdBy]: input.createdBy ?? "Agent",
    [DRAFT_TRUTH_FIELD_IDS.captureSource]: captureSource,
  };

  if (input.brainTheme) fields[DRAFT_TRUTH_FIELD_IDS.brainTheme] = input.brainTheme;
  if (input.proposedCategory) fields[DRAFT_TRUTH_FIELD_IDS.proposedCategory] = input.proposedCategory;
  if (input.recordType) fields[DRAFT_TRUTH_FIELD_IDS.recordType] = input.recordType;
  if (input.horizon) fields[DRAFT_TRUTH_FIELD_IDS.horizon] = input.horizon;
  if (input.supersedesTrustedTruthId) {
    fields[DRAFT_TRUTH_FIELD_IDS.supersedesTrustedTruthId] = input.supersedesTrustedTruthId;
  }
  if (input.sourceDocumentRecordIds?.length) {
    fields[DRAFT_TRUTH_FIELD_IDS.sourceDocuments] = input.sourceDocumentRecordIds;
  }
  if (input.contextAmendmentVersionRecordIds?.length) {
    fields[DRAFT_TRUTH_FIELD_IDS.contextAmendmentVersions] =
      input.contextAmendmentVersionRecordIds;
  }
  const relatedProjectIds = uniqueLiveRecordIds(input.relatedProjectRecordIds);
  if (relatedProjectIds.length) {
    fields[DRAFT_TRUTH_FIELD_IDS.relatedProjects] = relatedProjectIds;
  }

  assertNoBuilderReviewFields(fields);
  return fields;
}

function uniqueLiveRecordIds(ids: string[] | undefined): string[] {
  if (!ids?.length) return [];
  const unique: string[] = [];
  for (const raw of ids) {
    const id = raw.trim();
    if (!id) continue;
    if (!LIVE_RECORD_ID.test(id)) {
      throw new Error(
        `Related Projects accepts live record IDs only, not ${id}. ` +
          "Clive's Man the HEAD puts IDs (or none) in the brief; cheap hands copy or write those IDs only.",
      );
    }
    if (!unique.includes(id)) unique.push(id);
  }
  return unique;
}

/**
 * Matthew's review overlay is the only signal that a human looked at a row.
 * An agent filling it in would make that signal a lie, so refuse the whole write.
 */
export function assertNoBuilderReviewFields(fields: Record<string, unknown>): void {
  const offenders = [
    ...DRAFT_TRUTH_HUMAN_ONLY_FIELDS.filter((id) => id in fields),
    ...DRAFT_TRUTH_HUMAN_ONLY_FIELD_NAMES.filter((name) => name in fields),
  ];
  if (offenders.length > 0) {
    throw new Error(
      `Agents must not write Matthew's builder-review fields: ${[...new Set(offenders)].join(", ")}`,
    );
  }
}

const registryCache = new Map<string, string | null>();

/**
 * Resolve a brain slug to its Workshop Brain Registry record so the draft has a
 * real destination rather than free text. Returns null when no brain matches —
 * callers must refuse create rather than write a slug-only row.
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

export type ActiveProject = {
  recordId: string;
  projectName: string;
};

const activeProjectsCache = new Map<string, ActiveProject[]>();

/**
 * Live Active Projects roster for Clive's Man the HEAD (Sol) when deciding a
 * project link. Not for proposer/executor judgement. Blank is legal on a claim.
 * Inventing a project or creating a Projects row is forbidden.
 */
export async function listActiveProjects(
  baseId: string,
  token: string,
): Promise<ActiveProject[]> {
  const cached = activeProjectsCache.get(baseId);
  if (cached) return cached;

  const records = await airtableSelect(baseId, BRAIN_WORKSHOP_TABLES.projects, token, {
    filterByFormula: `{Lifecycle}='${BRAIN_WORKSHOP_PROJECT_LIFECYCLE.active.name}'`,
    fields: [
      BRAIN_WORKSHOP_PROJECTS_FIELDS.projectName,
      BRAIN_WORKSHOP_PROJECTS_FIELDS.lifecycle,
    ],
    paginate: true,
  }).catch(() => []);

  const rows: ActiveProject[] = [];
  for (const record of records) {
    const projectName = String(
      record.fields[BRAIN_WORKSHOP_PROJECTS_FIELDS.projectName] ??
        record.fields["Project Name"] ??
        "",
    ).trim();
    if (!record.id || !LIVE_RECORD_ID.test(record.id)) continue;
    rows.push({ recordId: record.id, projectName });
  }

  activeProjectsCache.set(baseId, rows);
  return rows;
}

/**
 * Confirm a record ID is on the live Active Projects list. Does not match
 * names or claim text. Returns null when the ID is blank, missing, paused,
 * or closed — callers leave Related Projects blank.
 * Used by the HEAD (or challenger veto), not by cheap executors to invent links.
 */
export async function resolveProjectRecordId(
  baseId: string,
  token: string,
  projectRecordId: string,
): Promise<string | null> {
  const id = projectRecordId.trim();
  if (!LIVE_RECORD_ID.test(id)) return null;
  const active = await listActiveProjects(baseId, token);
  return active.some((project) => project.recordId === id) ? id : null;
}

export function clearProjectCacheForTests(): void {
  activeProjectsCache.clear();
}
