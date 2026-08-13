/**
 * Operator portals v1 — idle doors + zoomed bay helpers (Kate scenic).
 *
 * Payload shapes come from Doc (`@/lib/receiving-wall` +
 * `ReceivingWallPortalsPayload`). Seeds fill gaps so the painted wall never
 * blanks. Working look: `docs/initiatives/receiving-wall-kathryn-look-v1.md`.
 */

import {
  isReceivingRecordActioned,
  type ReceivingPortalId,
  type ReceivingQueueItem,
  type ReceivingRecord,
  type ReceivingReportLetter,
  type ReceivingWallPayload,
} from "@/lib/receiving-wall";
import {
  BRAINS_SHELF,
  HEALTH_BAND_LABELS,
  healthBandLabel,
  type BrainHealthBand,
  type BrainShelfEntry,
} from "@/lib/platform/brains";

/** Client-safe mirror of Doc’s `ReceivingWallPortalsPayload` (brains + bays). */
export type OperatorWallPayload = ReceivingWallPayload & {
  brains: BrainShelfEntry[];
};

export type OperatorPortalId = ReceivingPortalId;
export type PortalQueueItem = ReceivingQueueItem;
export type PortalReportLetter = ReceivingReportLetter;

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

/** Seed Held — only used if the API omits the array entirely. */
export const SEED_HELD_ITEMS: ReceivingQueueItem[] = [
  {
    recordId: "seed-held-auditor-overflow",
    title: "Auditor overflow — held for a human",
    snippet:
      "The Challenger held this letter: the Auditor burst needs a human before any rewrite.",
    provenance: "Context Challenger",
    reason: "Needs a human — do not silently rewrite what is already held.",
    stage: "V2",
    verdict: "Held",
    kind: "held",
  },
];

export const SEED_PROPOSAL_ITEMS: ReceivingQueueItem[] = [
  {
    recordId: "seed-proposal-intake-v1",
    title: "Morning pipe — proposals waiting to be drafted",
    snippet: "Recent proposals from Intake, still waiting to become drafts.",
    provenance: "Clive Intake",
    stage: "V1",
    verdict: "Proposed",
    kind: "proposal",
  },
];

export const SEED_REPORTS: ReceivingReportLetter[] = [
  {
    recordId: "recSmDfozEz98ZTH2",
    title: "What moved overnight — 13 Aug 2026",
    reportType: "Handoff",
    agentSlug: "summarize-changes-daily",
    headline: "What moved overnight — and what still needs your eye.",
    body:
      "Overnight the household filed as usual. Open Judgement for anything that still needs a human. The brains are next door.",
    period: "13 Aug 2026",
  },
];

/** Plain stand-in when the house cannot yet read the real shelf. */
export const SEED_HONESTY_LINE =
  "This bay is a stand-in until the house can read the real shelf.";
const EMPTY_PORTALS: ReceivingWallPayload["portals"] = {
  judgement: { source: "seed" },
  health: { source: "seed" },
  reports: { source: "seed" },
};

/** Prefer live API fields; fill gaps so portals never read empty by accident. */
export function mergeOperatorWallPayload(
  input: Partial<OperatorWallPayload> & {
    source?: ReceivingWallPayload["source"];
    message?: string;
  },
): OperatorWallPayload {
  const records = input.records ?? [];
  const held = input.held ?? SEED_HELD_ITEMS;
  const proposals = input.proposals ?? SEED_PROPOSAL_ITEMS;
  const reports = input.reports?.length ? input.reports : SEED_REPORTS;
  const brains = input.brains?.length ? input.brains : BRAINS_SHELF;
  const portals = input.portals ?? EMPTY_PORTALS;
  const source = input.source ?? (records.length ? "derived" : "seed");

  return {
    records,
    held,
    proposals,
    reports,
    brains,
    source,
    message: input.message,
    portals,
  };
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
  held: ReceivingQueueItem[],
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
      value: HEALTH_BAND_LABELS[band],
      tint: HEALTH_BAND_WORD_TINT[band],
    };
  }
  return { kind: "time", value: "Today", tint: "#e4d3a3" };
}

/** Prefer Handoff / summarize-changes-daily as the default opened letter. */
export function defaultReportLetterId(reports: ReceivingReportLetter[]): string | null {
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

/**
 * One plain honesty sentence for the aperture — never a status banner,
 * never engineer field names. Seed / partial live → stand-in line.
 */
export function wallHonestyNote(payload: OperatorWallPayload): string | null {
  if (payload.source === "seed") return SEED_HONESTY_LINE;

  if (payload.source === "live" && !payload.message) {
    const portalNotes = Object.values(payload.portals).filter(
      (bay) => bay.source !== "live" && bay.message,
    );
    if (!portalNotes.length) return null;
    return SEED_HONESTY_LINE;
  }

  if (payload.message) {
    // Keep API copy only when it already reads as plain English; else stand-in.
    const raw = payload.message.trim();
    if (/PAT|token|Draft Brain Truth|Amendment|Workshop|V1|V2|slug/i.test(raw)) {
      return SEED_HONESTY_LINE;
    }
    return raw;
  }

  return null;
}
