import { airtableSelect } from "../airtable-rest";
import {
  AMENDMENT_CHALLENGER_VERDICT,
  AMENDMENT_STAGE,
  BRAIN_WORKSHOP_AMENDMENT_FIELD_NAMES,
  BRAIN_WORKSHOP_AMENDMENT_FIELDS,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  HOUSEHOLD_ACTIVITY_DAILY_SUMMARY,
  HOUSEHOLD_ACTIVITY_REPORT_FIELD_NAMES,
  HOUSEHOLD_ACTIVITY_REPORT_FIELDS,
} from "../airtable-ids";
import {
  getHouseholdActivityBaseId,
  getHouseholdActivityReadToken,
  getHouseholdActivityReportsTableId,
  getWorkshopBaseId,
  getWorkshopReadToken,
} from "../config";
import { handleBrainList } from "./brain-list";
import type { BrainShelfEntry } from "@/lib/platform/brains";
import type {
  CaptureSource,
  ReceivingBaySource,
  ReceivingQueueItem,
  ReceivingRecord,
  ReceivingReportLetter,
  ReceivingWallPayload,
} from "@/lib/receiving-wall";
import {
  formatReportPeriod,
  mergeBayMessages,
  weakestBaySource,
} from "@/lib/receiving-wall";

/**
 * Reads the household's pending draft-brain-truth records for the Receiving
 * Wall. Live when the Workshop read token is configured; otherwise returns a
 * seeded, clearly-labelled set so the wall is never blank in development.
 *
 * Wall grouping uses Proposed Category. Capture Source (when present) is
 * provenance for the opened letter; until a row carries that value, capture
 * source is inferred from the proposing agent / created-by fields, and
 * `source: "derived"` tells the UI the tint was inferred rather than read.
 */

type DraftTruthFields = {
  Title?: string;
  "Canonical Text for Agents"?: string;
  "Canonical Text for Humans"?: string;
  "Brain Slug"?: string;
  "System Brain Name"?: unknown;
  "System Brain Slug"?: unknown;
  "Proposed Category"?: string;
  Status?: string;
  "Proposed By Agent"?: string;
  "Created By"?: string;
  /** New single-select, to be added by Matthew. */
  "Capture Source"?: string;
};

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** Map the new single-select (or a legacy label) onto our three sources. */
function normaliseCaptureSource(raw: unknown): CaptureSource | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
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


function firstLookupString(raw: unknown): string | undefined {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return undefined;
}

function readProposedCategory(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}

export function mapDraftTruthToReceivingRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): ReceivingRecord | null {
  const fields = record.fields as DraftTruthFields;
  const title = fields.Title?.trim();
  if (!title) return null;
  // The wall is Matthew's surface, so it reads the human register first.
  const canonicalText =
    fields["Canonical Text for Humans"]?.trim() ||
    fields["Canonical Text for Agents"]?.trim() ||
    "";
  const read = normaliseCaptureSource(fields["Capture Source"]);
  const legacyBrainSlug = fields["Brain Slug"]?.trim() || undefined;
  const systemBrainName = firstLookupString(fields["System Brain Name"]);
  const systemBrainSlug =
    firstLookupString(fields["System Brain Slug"]) || legacyBrainSlug;
  return {
    recordId: record.id,
    title,
    snippet: truncate(canonicalText || title),
    provenance:
      fields["Proposed By Agent"]?.trim() ||
      fields["Created By"]?.trim() ||
      "Clive's Man",
    captureSource: read ?? inferCaptureSource(fields),
    category: readProposedCategory(fields["Proposed Category"]),
    systemBrainName,
    systemBrainSlug,
    brainSlug: legacyBrainSlug,
    status: fields.Status?.trim() || undefined,
    canonicalText,
  };
}

/**
 * Operator-facing honesty lines. Written as `cause — effect` so bays sharing a
 * door merge into one sentence (see `mergeBayMessages`), and in plain English:
 * nothing the operator reads names a credential, a table, or a pipe stage.
 * The engineer detail goes to the server log instead.
 */
const BENCH_UNREADABLE_CAUSE = "The house cannot read the real bench yet";
const BENCH_UNREADABLE_NOW_CAUSE = "The house could not read the bench just now";
const LETTERS_UNREADABLE_CAUSE = "The house cannot read this morning's letters yet";
const LETTERS_UNREADABLE_NOW_CAUSE =
  "The house could not read this morning's letters just now";

function logBayFailure(bay: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`Receiving Wall could not read ${bay}:`, detail);
}

const SEED_RECORDS: ReceivingRecord[] = [
  {
    recordId: "seed-core-goals-long-term",
    title: "Core · Goals (long-term)",
    snippet: "Where AstraJax is headed — the durable aims the work points at.",
    provenance: "Doc Brain Base Builder",
    captureSource: "external",
    category: "Goals & Priorities",
    systemBrainName: "AstraJax Chapter 1",
    systemBrainSlug: "astrajax-chapter-1",
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
    category: "Definition",
    systemBrainName: "AstraJax Chapter 1",
    systemBrainSlug: "astrajax-chapter-1",
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
    category: "Open Questions",
    systemBrainName: "AstraJax Chapter 1",
    systemBrainSlug: "astrajax-chapter-1",
    brainSlug: "astrajax-chapter-1",
    status: "Ready for review",
    canonicalText: "Open questions surfaced from reviewed conversations. Read in full in the sitting.",
  },
];

/** Field list for the wall read. Capture Source is optional until configured. */
export function buildReceivingWallFieldIds(): string[] {
  const fields: string[] = [
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.systemBrainName,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.systemBrainSlug,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
    BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
  ];
  const captureSourceFieldId = process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID?.trim();
  if (captureSourceFieldId) {
    fields.push(captureSourceFieldId);
  }
  return fields;
}

export const RECEIVING_WALL_DRAFT_FILTER = "{Status}='Draft'";

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
      message: `${BENCH_UNREADABLE_CAUSE} — these letters are stand-ins.`,
    };
  }

  try {
    const records = await airtableSelect(baseId, tableId, token, {
      fields: buildReceivingWallFieldIds(),
      filterByFormula: RECEIVING_WALL_DRAFT_FILTER,
      sortField: "Title",
      sortDirection: "asc",
      paginate: true,
    });

    const mapped = records
      .map((record) => mapDraftTruthToReceivingRecord(record))
      .filter((row): row is ReceivingRecord => row !== null);

    if (mapped.length === 0) {
      return {
        records: SEED_RECORDS,
        source: "seed",
        message: "Nothing is waiting on the bench — these letters are stand-ins.",
      };
    }

    // If every row's tint came from inference (the field isn't populated yet),
    // tell the UI the tints are derived, not read.
    const anyExplicit = records.some((r) =>
      normaliseCaptureSource(r.fields["Capture Source"]),
    );

    return { records: mapped, source: anyExplicit ? "live" : "derived" };
  } catch (error) {
    logBayFailure("pending drafts", error);
    return {
      records: SEED_RECORDS,
      source: "seed",
      message: `${BENCH_UNREADABLE_NOW_CAUSE} — these letters are stand-ins.`,
    };
  }
}

/* ------------------------------------------------------------------ *
 * Judgement portal — Held / stuck work and this morning's proposals.
 *
 * The morning pipe writes Context Amendment Versions first; drafts only
 * appear once the Executor has run. Without this read, a held amendment or a
 * 142-row intake burst is invisible on the wall until it becomes a draft.
 *
 * Read-only. The wall never writes to the control plane.
 * ------------------------------------------------------------------ */

/** How many rows each judgement section shows before it says "and more". */
export const RECEIVING_QUEUE_SECTION_LIMIT = 24;

/** Newest-first ceiling for the control-plane read. */
export const RECEIVING_AMENDMENT_MAX_RECORDS = 100;

const AV_NAMES = BRAIN_WORKSHOP_AMENDMENT_FIELD_NAMES;

/** Held, needs-a-human, or an undrafted V1 proposal. Nothing already applied. */
export const RECEIVING_WALL_AMENDMENT_FILTER = [
  "OR(",
  `{${AV_NAMES.challengerVerdict}}='${AMENDMENT_CHALLENGER_VERDICT.held}',`,
  `{${AV_NAMES.humanDecisionNeeded}}=1,`,
  `AND({${AV_NAMES.stage}}='${AMENDMENT_STAGE.v1}',`,
  `{${AV_NAMES.challengerVerdict}}='${AMENDMENT_CHALLENGER_VERDICT.proposed}')`,
  ")",
].join("");

export function buildReceivingWallAmendmentFieldIds(): string[] {
  return [
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.amendmentVersionId,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.stage,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.challengerVerdict,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.humanDecisionNeeded,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.createdByAgent,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.reason,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.actionClass,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.afterPayload,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.beforeSnapshot,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.v1ReportUrl,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.v2ReportUrl,
    BRAIN_WORKSHOP_AMENDMENT_FIELDS.targetDraft,
  ];
}

function readString(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw.trim() || undefined;
  if (typeof raw === "number") return String(raw);
  return undefined;
}

/** Airtable single-selects arrive as a name string; be tolerant of objects. */
function readSelectName(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw.trim() || undefined;
  if (raw && typeof raw === "object" && "name" in raw) {
    const name = (raw as { name?: unknown }).name;
    if (typeof name === "string") return name.trim() || undefined;
  }
  return undefined;
}

function readLinkCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

/**
 * Amendment payloads are canonical JSON keyed either semantically or by Draft
 * Brain Truth field id. Pull the first readable value for a logical key.
 */
function readPayloadValue(
  payload: unknown,
  semanticKey: string,
  fieldId: string,
): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  return readString(record[semanticKey]) ?? readString(record[fieldId]);
}

function parsePayload(raw: unknown): unknown {
  const text = readString(raw);
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function humaniseActionClass(actionClass: string | undefined): string {
  if (!actionClass) return "A piece of the household's work";
  return actionClass
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word, index) => (index === 0 ? `${word[0]?.toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

export function mapAmendmentToQueueItem(record: {
  id: string;
  fields: Record<string, unknown>;
}): ReceivingQueueItem | null {
  const fields = record.fields;
  const stage = readSelectName(fields[AV_NAMES.stage]);
  const verdict = readSelectName(fields[AV_NAMES.challengerVerdict]);
  const humanDecisionNeeded = fields[AV_NAMES.humanDecisionNeeded] === true;
  const actionClass = readSelectName(fields[AV_NAMES.actionClass]);
  const reason = readString(fields[AV_NAMES.reason]);

  const after = parsePayload(fields[AV_NAMES.afterPayload]);
  const before = parsePayload(fields[AV_NAMES.beforeSnapshot]);
  const payloadTitle =
    readPayloadValue(after, "title", BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title) ??
    readPayloadValue(before, "title", BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title);
  const payloadBody =
    readPayloadValue(after, "canonical_text", BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText) ??
    readPayloadValue(before, "canonical_text", BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText);

  const isHeld = verdict === AMENDMENT_CHALLENGER_VERDICT.held || humanDecisionNeeded;
  // Never fall back to the internal row id — an operator reading the bay would
  // see a reference number instead of a sentence.
  const title =
    payloadTitle ?? reason?.split("\n")[0] ?? humaniseActionClass(actionClass);

  const snippet =
    payloadBody ??
    reason ??
    `${humaniseActionClass(actionClass)} — no reason recorded.`;

  return {
    recordId: record.id,
    title: truncate(title, 120),
    snippet: truncate(snippet),
    provenance: readString(fields[AV_NAMES.createdByAgent]) ?? "Morning pipe",
    reason: isHeld && humanDecisionNeeded ? reason ?? "A human must decide." : reason,
    stage,
    verdict,
    reportUrl:
      readString(fields[AV_NAMES.v2ReportUrl]) ??
      readString(fields[AV_NAMES.v1ReportUrl]),
    kind: isHeld ? "held" : "proposal",
  };
}

/** A V1 proposal the Executor has not yet turned into a Draft Brain Truth. */
function isUndraftedProposal(record: {
  fields: Record<string, unknown>;
}): boolean {
  return readLinkCount(record.fields[AV_NAMES.targetDraft]) === 0;
}

const SEED_HELD_ITEMS: ReceivingQueueItem[] = [
  {
    recordId: "seed-held-human-decision",
    title: "Held — a human must decide before anything is rewritten",
    snippet:
      "This is a stand-in, not real held work. When the house can read the bench, anything it stopped will sit here until you decide — it is never quietly rewritten for you.",
    provenance: "Clive's Man",
    reason: "A human must decide before this moves.",
    stage: AMENDMENT_STAGE.v2,
    verdict: AMENDMENT_CHALLENGER_VERDICT.held,
    kind: "held",
  },
];

const SEED_PROPOSAL_ITEMS: ReceivingQueueItem[] = [
  {
    recordId: "seed-proposal-morning-v1",
    title: "Proposed overnight — waiting to become letters",
    snippet:
      "A stand-in for what the household proposed overnight. You can see the queue here; nothing is started or run from this wall.",
    provenance: "Clive's Man",
    stage: AMENDMENT_STAGE.v1,
    verdict: AMENDMENT_CHALLENGER_VERDICT.proposed,
    kind: "proposal",
  },
];

export interface ReceivingWallAmendmentsResult {
  held: ReceivingQueueItem[];
  proposals: ReceivingQueueItem[];
  source: ReceivingBaySource;
  message?: string;
}

function seededAmendments(message: string): ReceivingWallAmendmentsResult {
  return {
    held: SEED_HELD_ITEMS,
    proposals: SEED_PROPOSAL_ITEMS,
    source: "seed",
    message,
  };
}

export async function handleReceivingWallAmendments(): Promise<ReceivingWallAmendmentsResult> {
  const baseId = getWorkshopBaseId();
  const token = getWorkshopReadToken();

  if (!baseId || !token) {
    return seededAmendments(
      `${BENCH_UNREADABLE_CAUSE} — held work and proposals are stand-ins.`,
    );
  }

  try {
    const records = await airtableSelect(
      baseId,
      BRAIN_WORKSHOP_TABLES.contextAmendments,
      token,
      {
        fields: buildReceivingWallAmendmentFieldIds(),
        filterByFormula: RECEIVING_WALL_AMENDMENT_FILTER,
        sortField: AV_NAMES.created,
        sortDirection: "desc",
        maxRecords: RECEIVING_AMENDMENT_MAX_RECORDS,
      },
    );

    const held: ReceivingQueueItem[] = [];
    const proposals: ReceivingQueueItem[] = [];
    for (const record of records) {
      const item = mapAmendmentToQueueItem(record);
      if (!item) continue;
      if (item.kind === "held") {
        held.push(item);
      } else if (isUndraftedProposal(record)) {
        proposals.push(item);
      }
    }

    if (held.length === 0 && proposals.length === 0) {
      return {
        held: [],
        proposals: [],
        source: "live",
        message: "Nothing held and nothing proposed this morning.",
      };
    }

    const heldShown = held.slice(0, RECEIVING_QUEUE_SECTION_LIMIT);
    const proposalsShown = proposals.slice(0, RECEIVING_QUEUE_SECTION_LIMIT);
    const trimmed =
      held.length - heldShown.length + (proposals.length - proposalsShown.length);

    return {
      held: heldShown,
      proposals: proposalsShown,
      source: "live",
      message:
        trimmed > 0
          ? `Showing the most recent — ${trimmed} more waiting behind these.`
          : undefined,
    };
  } catch (error) {
    logBayFailure("held work and proposals", error);
    return seededAmendments(
      `${BENCH_UNREADABLE_NOW_CAUSE} — held work and proposals are stand-ins.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Reports portal — this morning's written write-ups.
 *
 * Household Activity Reports is create-only in the world; the wall only shows
 * the tip. Revisions arrive as new rows via Supersedes, never as silent edits.
 * ------------------------------------------------------------------ */

/** How many letters the reports bay carries. */
export const RECEIVING_REPORTS_LIMIT = 12;

const REPORT_NAMES = HOUSEHOLD_ACTIVITY_REPORT_FIELD_NAMES;

export function buildReceivingWallReportFieldIds(): string[] {
  return [
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.title,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.reportType,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.agentSlug,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.headline,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.body,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.periodStart,
    HOUSEHOLD_ACTIVITY_REPORT_FIELDS.periodEnd,
  ];
}

export function mapReportToLetter(record: {
  id: string;
  fields: Record<string, unknown>;
}): ReceivingReportLetter | null {
  const fields = record.fields;
  const title = readString(fields[REPORT_NAMES.title]);
  if (!title) return null;
  const body = readString(fields[REPORT_NAMES.body]);
  const headline = readString(fields[REPORT_NAMES.headline]);
  return {
    recordId: record.id,
    title,
    reportType: readSelectName(fields[REPORT_NAMES.reportType]) ?? "Report",
    agentSlug: readString(fields[REPORT_NAMES.agentSlug]),
    headline,
    body: body ?? headline ?? "This report has no body yet.",
    period: formatReportPeriod(
      readString(fields[REPORT_NAMES.periodStart]),
      readString(fields[REPORT_NAMES.periodEnd]),
    ),
  };
}

/**
 * The daily change summary is the letter that opens by default, so it leads
 * even when several reports share a Period End.
 */
export function orderReportLetters(
  letters: ReceivingReportLetter[],
): ReceivingReportLetter[] {
  const dailyIndex = letters.findIndex(
    (letter) => letter.agentSlug === HOUSEHOLD_ACTIVITY_DAILY_SUMMARY.agentSlug,
  );
  if (dailyIndex <= 0) return letters;
  const daily = letters[dailyIndex]!;
  return [daily, ...letters.filter((_, index) => index !== dailyIndex)];
}

const SEED_REPORTS: ReceivingReportLetter[] = [
  {
    recordId: "seed-report-daily-change-summary",
    title: "Daily change summary",
    reportType: HOUSEHOLD_ACTIVITY_DAILY_SUMMARY.reportType,
    agentSlug: HOUSEHOLD_ACTIVITY_DAILY_SUMMARY.agentSlug,
    headline: "This morning's written summary is not readable from here yet.",
    body:
      "Every morning the household writes up what changed, alongside its own review notes.\n\nThe house cannot reach those write-ups from this wall yet, so this is a stand-in rather than a real letter. Nothing here has been invented, and nothing real has been hidden: the written summary still exists where the household filed it.",
  },
];

export interface ReceivingWallReportsResult {
  reports: ReceivingReportLetter[];
  source: ReceivingBaySource;
  message?: string;
}

export async function handleReceivingWallReports(): Promise<ReceivingWallReportsResult> {
  const baseId = getHouseholdActivityBaseId();
  const token = getHouseholdActivityReadToken();

  if (!baseId || !token) {
    return {
      reports: SEED_REPORTS,
      source: "seed",
      message: `${LETTERS_UNREADABLE_CAUSE} — this one is a stand-in.`,
    };
  }

  try {
    const records = await airtableSelect(
      baseId,
      getHouseholdActivityReportsTableId(),
      token,
      {
        fields: buildReceivingWallReportFieldIds(),
        sortField: REPORT_NAMES.periodEnd,
        sortDirection: "desc",
        maxRecords: RECEIVING_REPORTS_LIMIT,
      },
    );

    const letters = orderReportLetters(
      records
        .map((record) => mapReportToLetter(record))
        .filter((letter): letter is ReceivingReportLetter => letter !== null),
    );

    if (letters.length === 0) {
      return {
        reports: [],
        source: "live",
        message: "No written reports filed yet.",
      };
    }

    return { reports: letters, source: "live" };
  } catch (error) {
    logBayFailure("this morning's letters", error);
    return {
      reports: SEED_REPORTS,
      source: "seed",
      message: `${LETTERS_UNREADABLE_NOW_CAUSE} — this one is a stand-in.`,
    };
  }
}

/* ------------------------------------------------------------------ *
 * The whole wall — three portals in one operator-only read.
 * ------------------------------------------------------------------ */

export type ReceivingWallPortalsPayload = ReceivingWallPayload & {
  brains: BrainShelfEntry[];
};

export async function handleReceivingWallPortals(): Promise<ReceivingWallPortalsPayload> {
  const [drafts, amendments, reports, brains] = await Promise.all([
    handleReceivingWallRecords(),
    handleReceivingWallAmendments(),
    handleReceivingWallReports(),
    handleBrainList(),
  ]);

  const judgementSource = weakestBaySource([drafts.source, amendments.source]);
  const judgementMessage = mergeBayMessages([drafts.message, amendments.message]);

  return {
    records: drafts.records,
    held: amendments.held,
    proposals: amendments.proposals,
    reports: reports.reports,
    brains: brains.brains,
    // Top-level source/message keep the original single-bay contract honest.
    source: drafts.source,
    message: drafts.message,
    portals: {
      judgement: {
        source: judgementSource,
        message: judgementMessage,
      },
      health: {
        source: brains.source === "live" ? "live" : "seed",
        message: brains.message,
      },
      reports: { source: reports.source, message: reports.message },
    },
  };
}
