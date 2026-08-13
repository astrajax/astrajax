/**
 * Operator portals v1 — idle doors + zoomed bay shapes for the Receiving Wall.
 *
 * Kate-owned UI types and seeds. When Doc’s extended API lands on
 * `/api/brains/receiving-wall`, prefer those fields; until then the wall never
 * goes blank. Working tints (Nocturne Orchard) — Kathryn owns final taste.
 */

import {
  isReceivingRecordActioned,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import {
  BRAINS_SHELF,
  healthBandLabel,
  type BrainShelfEntry,
} from "@/lib/platform/brains";

export type OperatorPortalId = "judgement" | "health" | "reports";

/** Queue rows that are not yet Draft Brain Truth (Held / V1 proposals). */
export type PortalQueueItem = {
  recordId: string;
  title: string;
  snippet: string;
  provenance: string;
  reason?: string;
  stage?: string;
  verdict?: string;
  reportUrl?: string;
  kind: "held" | "proposal";
};

/** Household Activity Reports — tip of the paper trail. */
export type PortalReportLetter = {
  recordId: string;
  title: string;
  reportType: string;
  agentSlug?: string;
  headline?: string;
  body: string;
  period?: string;
};

export type OperatorPortalDoor = {
  id: OperatorPortalId;
  label: string;
  blurb: string;
  /** Working tint — Nocturne Orchard family; not final art direction. */
  tint: string;
  countWord: string;
};

/**
 * Working plaque tints for the three idle doors.
 * judgement = Burnt Apricot (human warmth), health = Sage Signal,
 * reports = Parchment Dim. Marked working until Kathryn’s eye.
 */
export const OPERATOR_PORTAL_DOORS: readonly OperatorPortalDoor[] = [
  {
    id: "judgement",
    label: "Judgement",
    blurb: "Drafts that need a human, Held work, and this morning’s proposals.",
    tint: "#d77545",
    countWord: "waiting",
  },
  {
    id: "health",
    label: "Brain health",
    blurb: "How the household brains are — shrine states, not a table.",
    tint: "#9aa77a",
    countWord: "brains",
  },
  {
    id: "reports",
    label: "This morning",
    blurb: "Written reports — daily change summary and sibling write-ups.",
    tint: "#e7d1ad",
    countWord: "letters",
  },
] as const;

export function portalDoor(id: OperatorPortalId): OperatorPortalDoor {
  return OPERATOR_PORTAL_DOORS.find((door) => door.id === id) ?? OPERATOR_PORTAL_DOORS[0]!;
}

export function isOperatorPortalId(value: string | null): value is OperatorPortalId {
  return value === "judgement" || value === "health" || value === "reports";
}

/** Seed Held / stuck amendment versions — honest stand-in until Doc’s read lands. */
export const SEED_HELD_ITEMS: PortalQueueItem[] = [
  {
    recordId: "seed-held-auditor-overflow",
    title: "Auditor overflow — Context Amendment held",
    snippet:
      "Challenger held this amendment: the Auditor burst needs a human before any rewrite.",
    provenance: "Context Challenger",
    reason: "Human Decision Needed — do not silently rewrite V1.",
    stage: "V2",
    verdict: "Held",
    kind: "held",
  },
];

/** Seed this-morning V1 proposals not yet drafted. */
export const SEED_PROPOSAL_ITEMS: PortalQueueItem[] = [
  {
    recordId: "seed-proposal-intake-v1",
    title: "Intake V1 — morning pipe proposals",
    snippet: "Recent V1 Proposed rows from Intake, still waiting to become drafts.",
    provenance: "Clive Intake",
    stage: "V1",
    verdict: "Proposed",
    kind: "proposal",
  },
  {
    recordId: "seed-proposal-auditor-v1",
    title: "Auditor V1 — findings awaiting draft",
    snippet: "Auditor proposed amendments that have not yet been written as Draft Brain Truth.",
    provenance: "Context Auditor",
    stage: "V1",
    verdict: "Proposed",
    kind: "proposal",
    reportUrl: "airtable://Household Activity Reports/recSmDfozEz98ZTH2",
  },
];

/**
 * Canonical shape: Household Activity Reports `recSmDfozEz98ZTH2`
 * (Daily change summary — 13 Aug 2026). Seed body is operator-facing.
 */
export const SEED_REPORTS: PortalReportLetter[] = [
  {
    recordId: "recSmDfozEz98ZTH2",
    title: "Daily change summary — 13 Aug 2026",
    reportType: "Handoff",
    agentSlug: "summarize-changes-daily",
    headline: "What moved overnight — and what still needs your eye.",
    body:
      "Overnight the household filed Activity and Reports as usual. The morning pipe wrote Context Amendment Versions first; drafts land on the wall when the Executor finishes.\n\nOpen Judgement for anything that still needs a human. Brain health is next door. This letter is the tip of the Reports table — revisions arrive as new rows, never silent edits.",
    period: "13 Aug 2026",
  },
  {
    recordId: "seed-report-auditor-v1",
    title: "Context Auditor V1 — morning findings",
    reportType: "Auditor V1",
    agentSlug: "context-auditor",
    headline: "Auditor wrote up what it found; work items sit in Judgement.",
    body:
      "This is the written V1 report body. The judgement portal shows the work items; this bay holds the write-up. Tip of the Reports table — superseding rows replace, they do not rewrite.",
    period: "13 Aug 2026",
  },
  {
    recordId: "seed-report-challenger-v2",
    title: "Context Challenger V2 — held items explained",
    reportType: "Challenger V2",
    agentSlug: "context-challenger",
    headline: "Why Challenger held work for a human.",
    body:
      "Challenger’s V2 write-up when present. Held verdicts stay Held until a human decides — no silent rewrite of V1 from this wall.",
    period: "13 Aug 2026",
  },
];

export type OperatorWallPayload = {
  records: ReceivingRecord[];
  held: PortalQueueItem[];
  proposals: PortalQueueItem[];
  reports: PortalReportLetter[];
  brains: BrainShelfEntry[];
  source: "live" | "derived" | "seed";
  message?: string;
};

/** Prefer live API fields; fill gaps so portals never read empty by accident. */
export function mergeOperatorWallPayload(input: {
  records?: ReceivingRecord[];
  held?: PortalQueueItem[];
  proposals?: PortalQueueItem[];
  reports?: PortalReportLetter[];
  brains?: BrainShelfEntry[];
  source?: "live" | "derived" | "seed";
  message?: string;
}): OperatorWallPayload {
  const records = input.records?.length ? input.records : [];
  const held = input.held?.length ? input.held : SEED_HELD_ITEMS;
  const proposals = input.proposals?.length ? input.proposals : SEED_PROPOSAL_ITEMS;
  const reports = input.reports?.length ? input.reports : SEED_REPORTS;
  const brains = input.brains?.length ? input.brains : BRAINS_SHELF;
  const usingSeedQueues =
    !input.held?.length || !input.proposals?.length || !input.reports?.length;
  const source = input.source ?? (records.length ? "derived" : "seed");
  let message = input.message;
  if (usingSeedQueues && source !== "seed") {
    message =
      message ??
      "Held, proposals, and reports are seeded until the wall’s extended read is wired.";
  }
  return { records, held, proposals, reports, brains, source, message };
}

export function pendingDraftsForJudgement(
  records: ReceivingRecord[],
  customAcceptStatus?: string,
): ReceivingRecord[] {
  return records
    .filter((record) => !isReceivingRecordActioned(record.status, customAcceptStatus))
    .slice()
    .sort((a, b) => {
      const catA = (a.category ?? "").localeCompare(b.category ?? "");
      if (catA !== 0) return catA;
      return a.title.localeCompare(b.title);
    });
}

export function judgementWaitingCount(
  records: ReceivingRecord[],
  held: PortalQueueItem[],
  proposals: PortalQueueItem[],
  customAcceptStatus?: string,
): number {
  return pendingDraftsForJudgement(records, customAcceptStatus).length + held.length + proposals.length;
}

export function portalCount(
  id: OperatorPortalId,
  payload: OperatorWallPayload,
  customAcceptStatus?: string,
): number {
  if (id === "judgement") {
    return judgementWaitingCount(
      payload.records,
      payload.held,
      payload.proposals,
      customAcceptStatus,
    );
  }
  if (id === "health") return payload.brains.length;
  return payload.reports.length;
}

/** Prefer Handoff / summarize-changes-daily as the default opened letter. */
export function defaultReportLetterId(reports: PortalReportLetter[]): string | null {
  if (!reports.length) return null;
  const daily =
    reports.find((report) => report.agentSlug === "summarize-changes-daily") ??
    reports.find((report) => /daily change summary/i.test(report.title)) ??
    reports.find((report) => report.reportType === "Handoff") ??
    reports[0];
  return daily?.recordId ?? null;
}

export function brainBandLine(brain: BrainShelfEntry): string {
  return healthBandLabel(brain.healthBand);
}
