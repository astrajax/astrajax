/**
 * Operator portals v1 — idle doors + zoomed bay shapes for the Receiving Wall.
 *
 * Kate-owned UI types and seeds. When Doc’s extended API lands on
 * `/api/brains/receiving-wall`, prefer those fields; until then the wall never
 * goes blank. Working look: `docs/initiatives/receiving-wall-kathryn-look-v1.md`
 * (not final — Kathryn / TL own finish).
 */

import {
  isReceivingRecordActioned,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import {
  BRAINS_SHELF,
  HEALTH_BAND_LABELS,
  healthBandLabel,
  type BrainHealthBand,
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
  /** Working tint — bay light / varnish; not final art direction. */
  tint: string;
};

/**
 * Working door inscriptions + bay lights (Kathryn look v1).
 * Order: Judgement, The brains, This morning. Doors never hide when empty.
 */
export const OPERATOR_PORTAL_DOORS: readonly OperatorPortalDoor[] = [
  {
    id: "judgement",
    label: "Judgement",
    blurb: "What waits on you.",
    tint: "#e7d1ad",
  },
  {
    id: "health",
    label: "The brains",
    blurb: "How the household is holding.",
    tint: "#9aa77a",
  },
  {
    id: "reports",
    label: "This morning",
    blurb: "What the house did overnight.",
    tint: "#e4d3a3",
  },
] as const;

/** Working band word colours — catch on the word only, never a room fill. */
export const HEALTH_BAND_WORD_TINT: Record<BrainHealthBand, string> = {
  rotten: "#8b3a2a",
  unhappy: "#b85c38",
  okay: "#e4d3a3",
  happy: "#9aa77a",
  thriving: "#9aa77a",
};

const BAND_SEVERITY: Record<BrainHealthBand, number> = {
  rotten: 0,
  unhappy: 1,
  okay: 2,
  happy: 3,
  thriving: 4,
};

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
      "Overnight the household filed Activity and Reports as usual. The morning pipe wrote Context Amendment Versions first; drafts land on the wall when the Executor finishes.\n\nOpen Judgement for anything that still needs a human. The brains are next door. This letter is the tip of the Reports table — revisions arrive as new rows, never silent edits.",
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
  customAcceptStatus?: string,
): number {
  return pendingDraftsForJudgement(records, customAcceptStatus).length + held.length;
}

/** Worst shrine band present — idle right-hand mark for The brains. */
export function worstBrainBand(brains: BrainShelfEntry[]): BrainHealthBand {
  if (!brains.length) return "okay";
  return brains.reduce<BrainHealthBand>((worst, brain) => {
    return BAND_SEVERITY[brain.healthBand] < BAND_SEVERITY[worst]
      ? brain.healthBand
      : worst;
  }, "thriving");
}

export function worstBrainBandWord(brains: BrainShelfEntry[]): string {
  return HEALTH_BAND_LABELS[worstBrainBand(brains)];
}

/** Default featured brain in the health aperture — worst band, then first. */
export function featuredBrain(brains: BrainShelfEntry[]): BrainShelfEntry | null {
  if (!brains.length) return null;
  const worst = worstBrainBand(brains);
  return brains.find((brain) => brain.healthBand === worst) ?? brains[0] ?? null;
}

export function portalRightMark(
  id: OperatorPortalId,
  payload: OperatorWallPayload,
  customAcceptStatus?: string,
): { kind: "numeral" | "state" | "time"; value: string; tint?: string } {
  if (id === "judgement") {
    return {
      kind: "numeral",
      value: String(judgementWaitingCount(payload.records, payload.held, customAcceptStatus)),
      tint: "#e7d1ad",
    };
  }
  if (id === "health") {
    const band = worstBrainBand(payload.brains);
    return {
      kind: "state",
      value: healthBandLabel(band),
      tint: HEALTH_BAND_WORD_TINT[band],
    };
  }
  return { kind: "time", value: "Today", tint: "#e4d3a3" };
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
