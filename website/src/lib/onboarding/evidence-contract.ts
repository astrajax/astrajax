/**
 * Onboarding evidence — FIXTURE CONTRACT v0.1.
 *
 * CLEARLY LABELLED, VERSIONED, AND TEMPORARY. This module is the seam
 * between the Living Folio onboarding UI (this build) and Ruth Hadley's
 * data layer (in progress in parallel). The UI reads EVERY piece of
 * evidence and EVERY inferred field from this fixture; when Ruth's verified
 * contract lands, it satisfies the exact types and the single accessor
 * (`getOnboardingEvidence`) below, and the fixture is deleted.
 *
 * Contract guarantees the UI depends on (do not change without a version
 * bump and a note to Ruth):
 *
 * - evidence_class is exactly "imported_document" | "self_reported".
 *   imported_document = something the user uploaded/brought.
 *   self_reported     = something the user said in conversation.
 * - Every EvidenceItem carries supporting evidence links/locators that stay
 *   VISIBLE to the user (a file name, a page ref, a quoted turn).
 * - Self-reported items carry exact provenance: the question asked and the
 *   conversation turn it was answered in.
 * - ProvisionalInference is Ruth's Evidence → Provisional Inference →
 *   Human Confirmation state: provisional role, sector, observed
 *   collaborators, brain themes — each item independently
 *   Confirm / Correct / Leave open. Nothing here is a backend truth claim,
 *   canon, an invite, a connector, or production multi-tenancy.
 */

export const ONBOARDING_FIXTURE_VERSION = "0.1" as const;

export type EvidenceClass = "imported_document" | "self_reported";

/** A visible pointer back to the source the user can inspect. */
export type EvidenceLocator = {
  /** Human-readable label shown to the user (file name, page ref, quote). */
  label: string;
  /** Optional detail: file type + size, page number, or the quoted words. */
  detail?: string;
  /** Optional href for an inspectable artefact (fixture-local). */
  href?: string;
};

export type EvidenceProvenance = {
  /** The exact question the user was answering (self_reported only). */
  question?: string;
  /** The conversation turn it was answered in (self_reported only). */
  turn?: number;
};

export type EvidenceItem = {
  id: string;
  evidence_class: EvidenceClass;
  /** What the evidence IS — a short title the user recognises. */
  title: string;
  /** One line on what it contributes. */
  summary: string;
  /** Supporting links/locators, always visible. */
  locators: EvidenceLocator[];
  provenance?: EvidenceProvenance;
};

export type SourcePackAcceptedType = {
  extension: string;
  label: string;
  /** Max per-file size in MB. */
  maxMb: number;
};

export type SourcePackManifest = {
  accepted: SourcePackAcceptedType[];
  /** Hard cap on the number of files in one Source Pack. */
  maxFiles: number;
  /** Hard cap on total pack size in MB. */
  maxTotalMb: number;
};

export type UploadState = "queued" | "staging" | "staged" | "failed";

export type SourcePackFile = {
  id: string;
  name: string;
  extension: string;
  sizeMb: number;
  state: UploadState;
  /** Once staged, the evidence it became (imported_document). */
  evidenceId?: string;
};

/** One row in the deterministic-profile / structured-extraction ledger. */
export type ExtractionLedgerRow = {
  id: string;
  /** What was detected (deterministic, not inferred-by-model). */
  label: string;
  /** Where it was detected from. */
  sourceLabel: string;
  /** The provisional field it feeds. */
  feedsField: "role" | "sector" | "collaborators" | "themes";
  status: "detected" | "confirmed" | "dismissed";
};

/** Clive's Man corpus census — the deterministic count over the Source Pack. */
export type CorpusCensus = {
  documents: number;
  totalWords: number;
  /** Distinct detected entities worth naming to the user. */
  namedSignals: { label: string; count: number }[];
};

/** A targeted gap question (Route A), each self-reported answer becoming evidence. */
export type GapQuestion = {
  id: string;
  question: string;
  /** The provisional field this answer feeds. */
  feedsField: "role" | "sector" | "collaborators" | "themes";
};

/** A single inferred field awaiting human confirmation. */
export type ProvisionalField = {
  key: "role" | "sector" | "collaborators" | "themes";
  label: string;
  /** The provisional value(s) offered. */
  values: string[];
  /** The evidence ids this inference draws on (kept visible). */
  evidenceIds: string[];
};

export type ProvisionalInference = {
  fields: ProvisionalField[];
};

/** Confirmation decision per provisional field — Ruth's Human Confirmation. */
export type ConfirmationChoice = "confirm" | "correct" | "leave_open";

export type OnboardingEvidence = {
  version: typeof ONBOARDING_FIXTURE_VERSION;
  sourcePack: SourcePackManifest;
  initialFiles: SourcePackFile[];
  extractionLedger: ExtractionLedgerRow[];
  corpusCensus: CorpusCensus;
  gapQuestions: GapQuestion[];
  /** Route B: the bounded adaptive question set (12–16). */
  probeQuestions: GapQuestion[];
  provisional: ProvisionalInference;
  /** The evidence items backing the provisional fields. */
  evidence: EvidenceItem[];
};

// ──────────────────────────────────────────────────────────────────────────
// FIXTURE DATA (v0.1) — illustrative, clearly fake, deleted when Ruth's
// verified contract lands. The UI must work identically off this or the
// real contract.
// ──────────────────────────────────────────────────────────────────────────

const FIXTURE: OnboardingEvidence = {
  version: ONBOARDING_FIXTURE_VERSION,

  sourcePack: {
    accepted: [
      { extension: ".pdf", label: "PDF document", maxMb: 25 },
      { extension: ".docx", label: "Word document", maxMb: 15 },
      { extension: ".md", label: "Markdown / notes", maxMb: 5 },
      { extension: ".txt", label: "Plain text", maxMb: 5 },
      { extension: ".csv", label: "Spreadsheet (CSV)", maxMb: 10 },
    ],
    maxFiles: 12,
    maxTotalMb: 60,
  },

  initialFiles: [
    {
      id: "f-strategy",
      name: "2026-commercial-strategy.pdf",
      extension: ".pdf",
      sizeMb: 4.2,
      state: "staged",
      evidenceId: "e-strategy",
    },
    {
      id: "f-playbook",
      name: "field-sales-playbook.docx",
      extension: ".docx",
      sizeMb: 2.1,
      state: "staged",
      evidenceId: "e-playbook",
    },
    {
      id: "f-notes",
      name: "pricing-guardrails.md",
      extension: ".md",
      sizeMb: 0.1,
      state: "staging",
    },
  ],

  extractionLedger: [
    {
      id: "x1",
      label: "Detected a senior commercial role",
      sourceLabel: "2026-commercial-strategy.pdf · p.2",
      feedsField: "role",
      status: "detected",
    },
    {
      id: "x2",
      label: "Detected a field-sales / retail sector",
      sourceLabel: "field-sales-playbook.docx · throughout",
      feedsField: "sector",
      status: "detected",
    },
    {
      id: "x3",
      label: "Detected recurring collaborator names",
      sourceLabel: "2026-commercial-strategy.pdf · pp.4–5",
      feedsField: "collaborators",
      status: "detected",
    },
    {
      id: "x4",
      label: "Detected approval + pricing themes",
      sourceLabel: "pricing-guardrails.md",
      feedsField: "themes",
      status: "detected",
    },
  ],

  corpusCensus: {
    documents: 3,
    totalWords: 18450,
    namedSignals: [
      { label: "people", count: 14 },
      { label: "regions", count: 6 },
      { label: "processes", count: 22 },
    ],
  },

  gapQuestions: [
    {
      id: "g1",
      question: "Which of these decisions should never be made without you?",
      feedsField: "themes",
    },
    {
      id: "g2",
      question: "Who has to trust this brain before it can act on your behalf?",
      feedsField: "collaborators",
    },
  ],

  probeQuestions: [
    { id: "p1", question: "In plain words, what do you actually do day to day?", feedsField: "role" },
    { id: "p2", question: "What kind of organisation is that inside?", feedsField: "sector" },
    { id: "p3", question: "Who do you work closest with, week to week?", feedsField: "collaborators" },
    { id: "p4", question: "What decisions land on your desk most often?", feedsField: "themes" },
    { id: "p5", question: "Which of those should never be delegated?", feedsField: "themes" },
    { id: "p6", question: "What does 'good' look like when it's working?", feedsField: "themes" },
    { id: "p7", question: "Who would need to trust a system acting for you?", feedsField: "collaborators" },
    { id: "p8", question: "What's the messiest source of truth you rely on?", feedsField: "themes" },
    { id: "p9", question: "What would you want it never to get wrong?", feedsField: "themes" },
    { id: "p10", question: "How do you prefer to be corrected?", feedsField: "role" },
    { id: "p11", question: "What's the first thing you'd hand it?", feedsField: "themes" },
    { id: "p12", question: "How will you know it's earning its place?", feedsField: "themes" },
  ],

  provisional: {
    fields: [
      {
        key: "role",
        label: "Your role",
        values: ["Head of a commercial / field-sales function"],
        evidenceIds: ["e-strategy", "sr-role"],
      },
      {
        key: "sector",
        label: "Sector",
        values: ["Retail field sales / direct-to-consumer"],
        evidenceIds: ["e-playbook"],
      },
      {
        key: "collaborators",
        label: "Observed collaborators",
        values: ["Regional managers", "Field salespeople", "A finance partner"],
        evidenceIds: ["e-strategy", "sr-collab"],
      },
      {
        key: "themes",
        label: "Brain themes",
        values: ["Pricing guardrails", "Approval rules", "Trusted answers under pressure"],
        evidenceIds: ["e-playbook", "sr-themes"],
      },
    ],
  },

  evidence: [
    {
      id: "e-strategy",
      evidence_class: "imported_document",
      title: "2026 commercial strategy",
      summary: "Sets out the function's shape and priorities.",
      locators: [
        { label: "2026-commercial-strategy.pdf", detail: "PDF · 4.2 MB", href: "#" },
        { label: "role + priorities", detail: "p.2" },
      ],
    },
    {
      id: "e-playbook",
      evidence_class: "imported_document",
      title: "Field sales playbook",
      summary: "How the team actually sells, day to day.",
      locators: [{ label: "field-sales-playbook.docx", detail: "Word · 2.1 MB", href: "#" }],
    },
    {
      id: "sr-role",
      evidence_class: "self_reported",
      title: "Your description of your role",
      summary: "Answered in your own words.",
      locators: [{ label: "\u201cI lead the field sales team\u2026\u201d", detail: "your words" }],
      provenance: { question: "In plain words, what do you actually do day to day?", turn: 1 },
    },
    {
      id: "sr-collab",
      evidence_class: "self_reported",
      title: "The people you named",
      summary: "Collaborators you said you work closest with.",
      locators: [{ label: "\u201cmy regional managers and the reps\u201d", detail: "your words" }],
      provenance: { question: "Who do you work closest with, week to week?", turn: 3 },
    },
    {
      id: "sr-themes",
      evidence_class: "self_reported",
      title: "The decisions you guard",
      summary: "What you said should never be delegated.",
      locators: [{ label: "\u201cpricing sign-off stays with me\u201d", detail: "your words" }],
      provenance: { question: "Which of those should never be delegated?", turn: 5 },
    },
  ],
};

/**
 * THE WIRING SEAM.
 *
 * This is the single function Ruth's verified contract satisfies later. The
 * UI never reads the fixture directly — it calls getOnboardingEvidence().
 * Today it returns the static fixture; when Ruth's contract lands, this
 * becomes the one place that maps her verified response onto the same
 * OnboardingEvidence shape, and the fixture is deleted. Signature and
 * return type are the contract — do not change them without a version bump.
 */
export function getOnboardingEvidence(): OnboardingEvidence {
  return FIXTURE;
}
