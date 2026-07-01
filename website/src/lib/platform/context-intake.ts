import type { PaperTrailLine } from "@/lib/platform/brain-health";

/**
 * Clive's Man context intake — seeded, honest demo data.
 *
 * Clive's Man *detects* candidate context and *proposes* where it belongs.
 * The human approves, declines, or routes each item. Nothing here becomes
 * canonical truth: approving routes a draft into a brain's review queue.
 * All state lives in the browser session only — no live Airtable writes.
 */

export const DETECTED_BY_CLIVES_MAN = "Clive's Man";

export type ContextIntakeStatus = "pending" | "approved" | "declined" | "routed";

/** Category of where Clive's Man detected the candidate context. */
export type ContextSourceKind =
  | "email"
  | "slack"
  | "notion"
  | "workshop-source-document"
  | "clive-interaction"
  | "pam-interaction"
  | "meeting-transcript"
  | "repo-doc"
  | "other";

const CONTEXT_SOURCE_DISPLAY: Record<
  Exclude<ContextSourceKind, "other">,
  string
> = {
  email: "Email",
  slack: "Slack",
  notion: "Notion",
  "workshop-source-document": "Workshop source document",
  "clive-interaction": "Clive interaction",
  "pam-interaction": "Pam interaction",
  "meeting-transcript": "Meeting transcript",
  "repo-doc": "Repo doc",
};

/** Human-readable category label for a detected context source. */
export function contextSourceLabel(
  kind: ContextSourceKind,
  otherLabel?: string,
): string {
  if (kind === "other") {
    return otherLabel?.trim() || "Other";
  }
  return CONTEXT_SOURCE_DISPLAY[kind];
}

export interface DetectedContextItem {
  id: string;
  title: string;
  /** Short human summary of the detected context. */
  snippet: string;
  /** Source category — drives the intake card pill. */
  sourceKind: ContextSourceKind;
  /** Human-readable provenance detail, e.g. "Gmail · pricing thread". */
  sourceLabel: string;
  /** Which agent detected it — always Clive's Man in this lane. */
  detectedByAgent: string;
  /** Clive's Man's proposed destination brain (a slug from the shelf). */
  suggestedBrainSlug: string;
  /** Proposer/challenger read: novelty, attribution, or a decline nudge. */
  confidenceNote: string;
  status: ContextIntakeStatus;
}

/**
 * ~7 detected items across the seeded brains. A couple deliberately carry a
 * "this might be padding — consider declining" or "route as an open question"
 * note so the queue shows Clive's Man's proposer/challenger discipline, not just
 * a rubber-stamp list.
 */
export const CONTEXT_INTAKE_QUEUE: DetectedContextItem[] = [
  {
    id: "intake-northline-shift-swap",
    title: "Weekend shift-swap rule keeps getting re-asked",
    snippet:
      "Four separate rep threads ask how weekend shifts can be swapped and who signs them off. Looks like a durable working rule worth capturing.",
    sourceKind: "email",
    sourceLabel: "Gmail · ops-lead thread cluster (4 threads)",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "northline-field-ops",
    confidenceNote:
      "Recurs across 4 threads and is attributable to the ops lead — strong candidate for a working memory, not canonical truth.",
    status: "pending",
  },
  {
    id: "intake-pricing-discount-ceiling",
    title: "Q3 discretionary discount ceiling memo",
    snippet:
      "Finance memo caps field discretionary discount at 12% for Q3. May supersede an earlier 15% note already in the brain.",
    sourceKind: "workshop-source-document",
    sourceLabel: "Workshop source · Q3 discount ceiling memo",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "pricing-guardrails",
    confidenceNote:
      "Single-source memo. Challenger flag: confirm it supersedes the existing 15% note before you route, or it will conflict.",
    status: "pending",
  },
  {
    id: "intake-forecast-stage-drift",
    title: "'Committed' pipeline stage defined two ways",
    snippet:
      "Two teams describe the 'committed' forecast stage differently. This is a disagreement to surface, not a settled fact.",
    sourceKind: "slack",
    sourceLabel: "Slack export · committed-stage definitions",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "forecast-coach",
    confidenceNote:
      "Route as an open question, not a truth — the brain should hold the tension until a human resolves the definition.",
    status: "pending",
  },
  {
    id: "intake-northline-handover-checklist",
    title: "Territory handover checklist",
    snippet:
      "A tidy checklist for handing a territory between reps, captured from the ops lead's Notion page.",
    sourceKind: "notion",
    sourceLabel: "Notion · territory handover checklist",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "northline-field-ops",
    confidenceNote:
      "Actionable and attributable. Reversible if it changes — safe to route as a draft into the field-ops queue.",
    status: "pending",
  },
  {
    id: "intake-chapter1-scope-note",
    title: "Governed demo brain scope note",
    snippet:
      "Bootstrap note describing what the Chapter 1 demo brain is allowed to hold. Seeded material, not live curation.",
    sourceKind: "clive-interaction",
    sourceLabel: "Clive interaction · Chapter 1 demo scope",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "astrajax-chapter-1",
    confidenceNote:
      "Bootstrap material — keep as a draft only. It should never enter as canonical truth on the demo brain.",
    status: "pending",
  },
  {
    id: "intake-pricing-bespoke-rebate",
    title: "Client asked for a bespoke annual rebate",
    snippet:
      "One client requested a custom annual rebate. Reads like a one-off negotiation rather than a reusable guardrail.",
    sourceKind: "email",
    sourceLabel: "Gmail · client bespoke rebate thread",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "pricing-guardrails",
    confidenceNote:
      "Low novelty for a guardrails brain and hard to attribute as a rule. Challenger nudge: this may just pad the queue — consider declining.",
    status: "pending",
  },
  {
    id: "intake-forecast-seasonality",
    title: "Q4 seasonality assumption for acquisitions",
    snippet:
      "A working assumption that Q4 acquisitions dip before the holidays. Stated in a planning call, not yet evidenced.",
    sourceKind: "meeting-transcript",
    sourceLabel: "Meeting transcript · Q4 planning call",
    detectedByAgent: DETECTED_BY_CLIVES_MAN,
    suggestedBrainSlug: "forecast-coach",
    confidenceNote:
      "An assumption, not a confirmed fact. Route as an open question so the brain does not treat it as settled.",
    status: "pending",
  },
];

/**
 * Build a session-only paper-trail line for a routed item. Deliberately spells
 * out the governance: Clive's Man proposed, a human approved, and it lands as a
 * draft in the target brain's review queue — never canonical.
 */
export function createRoutePaperTrail(
  itemTitle: string,
  brainName: string,
  actor: string,
): PaperTrailLine {
  return {
    id: `intake-route-${Date.now()}`,
    action: `Routed "${itemTitle}" to ${brainName}`,
    actor,
    reason: `Human decision — proposed by ${DETECTED_BY_CLIVES_MAN}, routed as a draft into ${brainName}'s review queue. Not canonical.`,
    timestamp: new Date().toISOString(),
  };
}

/** Build a session-only paper-trail line for a declined item. */
export function createDeclinePaperTrail(itemTitle: string, actor: string): PaperTrailLine {
  return {
    id: `intake-decline-${Date.now()}`,
    action: `Declined "${itemTitle}"`,
    actor,
    reason: `Human decision — ${DETECTED_BY_CLIVES_MAN}'s proposal set aside. Nothing was written to any brain.`,
    timestamp: new Date().toISOString(),
  };
}
