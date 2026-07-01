import type {
  BusinessBrainDraft,
  DraftTruthItem,
  GuideMode,
  PamSniffTest,
  ReceiptCard,
  UserBrainIntake,
  UserBrainProfile,
} from "./types";
import { scopeForDraft, categoryForPromote } from "./draft-truth-utils";

export const BOOTH_HEADLINE =
  "AstraJax turns a domain expert's messy knowledge into a governed brain that agents can safely use.";

export const BOOTH_SUBHEAD =
  "Meet Clive, map what the human knows, let Pam challenge it, and decide what becomes trusted.";

export const OWNERSHIP_LINE =
  "This is your decision. You now have context-aware, bias-checked opinions. You decide.";

export const USER_BRAIN_PROFILES: UserBrainProfile[] = [
  {
    id: "starting-fresh",
    label: "Starting fresh — little or no AI or context experience yet",
    aiConfidence: "new",
    contextConfidence: "new",
    commercialJudgement: "comfortable",
    cliveTone:
      "Warm, zero-jargon pace — define terms as they appear, no assumed baseline, celebrate honest starting points.",
    pamSensitivity: "high",
  },
  {
    id: "commercial-new-context",
    label: "Commercial expert, new to context systems",
    aiConfidence: "comfortable",
    contextConfidence: "new",
    commercialJudgement: "expert",
    cliveTone:
      "Plain language, slower assumptions, more explanation on context and approval boundaries.",
    pamSensitivity: "high",
  },
  {
    id: "balanced-leader",
    label: "Team leader, comfortable with AI",
    aiConfidence: "comfortable",
    contextConfidence: "comfortable",
    commercialJudgement: "expert",
    cliveTone: "Balanced pace — trust commercial judgement, ask sharper on evidence gaps.",
    pamSensitivity: "medium",
  },
  {
    id: "systems-expert",
    label: "Strong on systems architecture",
    aiConfidence: "expert",
    contextConfidence: "expert",
    commercialJudgement: "comfortable",
    cliveTone: "Peer-level trade-offs; skip basics on structure, stay careful on adoption narrative.",
    pamSensitivity: "low",
  },
];

export const GUIDE_MODE_OPTIONS: { id: GuideMode; label: string; description: string }[] = [
  {
    id: "full_story",
    label: "Full Story",
    description: "Named characters, warm entrances, visible relationships between agents.",
  },
  {
    id: "light_story",
    label: "Light Story",
    description: "Clear roles with light warmth — minimal theatrics.",
  },
  {
    id: "no_story",
    label: "No Story",
    description: "Plain professional assistants — same scopes and governance underneath.",
  },
];

export const DEFAULT_BUSINESS_BRAIN: BusinessBrainDraft = {
  clientName: "Northline Field Ops",
  goal: "Give regional leads trusted answers on pricing guardrails and approval rules without opening five spreadsheets.",
  workflows: [
    "Weekly forecast review with regional managers",
    "Event staffing decisions from historic shift data",
    "Escalation when a rep proposes an off-script discount",
  ],
  dataSources: ["Gmail threads", "WhatsApp handoffs", "Notion playbooks", "Legacy Google Sheets"],
  approvalRules: [
    "No external pricing claims without approved positioning snippets",
    "Discount exceptions need RM sign-off logged in the brain",
    "Agents propose — humans approve before anything goes live",
  ],
  goodOutput:
    "A rep gets a sourced answer with caveats, knows what is approved vs draft, and sees when to escalate.",
  neverDo: [
    "Invent discount tiers not in approved context",
    "Blend operational numbers with reporting numbers",
    "Skip human approval for canonical changes",
  ],
  knownGaps: [
    "Ireland variant rules not yet in trusted context",
    "Q3 event category weights still in draft workshop rows",
  ],
};

export const DEFAULT_PAM_REVIEW: PamSniffTest = {
  strongestPart:
    "The team knows their exceptions — starting from messy real sources is honest, not a weakness.",
  weakestAssumption:
    "That reps will trust agent answers before they see where the approved snippets came from.",
  missingEvidence:
    "No signed-off pricing guardrail text in trusted context yet — only workshop drafts.",
  rabbitHoleRisk:
    "Building a full analytics layer before the first approved context records exist.",
  safeToSendToDoc: "not_yet",
};

export const CLIVE_INTERVIEW_PROMPTS = [
  "What does your team actually do day to day — not the slide version?",
  "Where does context live today, and who owns keeping it current?",
  "What would a good agent answer sound like — and what must it never say?",
];

/** @deprecated Use brain-theme-templates.ts — kept for legacy references and fallback demos. */
export const BRAINS_THEMES = [
  {
    id: "core",
    label: "Core",
    description: "Founding positioning, guardrails, and what the company actually stands for.",
  },
  {
    id: "sales-new-business",
    label: "New Business",
    description: "Pursuit, pipeline, and how new revenue gets won.",
  },
  {
    id: "product",
    label: "Product",
    description: "What you build, how it works, and what good looks like.",
  },
  {
    id: "money-runway",
    label: "Money & Runway",
    description: "P&L discipline, forecasts, and what the numbers mean.",
  },
  {
    id: "people",
    label: "People",
    description: "Roles, culture, hiring, and how teams actually operate.",
  },
] as const;

export const CLIVE_DRAFT_SUMMARY =
  "I've drafted a business brain brief from your answers. It stays in the workshop until you approve what becomes trusted. At Seedling maturity there is no approved context for agents to use yet.";

export const ACCESS_RECEIPT_LINE =
  "Context access was scoped, time-limited, and logged. (Brain Key is the backstage name for this grant — agents never see credentials.)";

export const RECEIPT_CARDS: ReceiptCard[] = [
  {
    id: "fleet",
    title: "Agent fleet proposal",
    summary:
      "Three task-scoped agents: Forecast Coach, Event Staffing Advisor, Pricing Guardrail Checker — personality editable, competence locked.",
    tag: "Chapter 2 preview",
  },
  {
    id: "hyperagent",
    title: "HyperAgent-ready package",
    summary:
      "Export bundle with scoped tools, approval rules, and trusted context bindings — runtime partner, not competitor.",
    tag: "Deploy lane",
  },
  {
    id: "doc-log",
    title: "Doc action log",
    summary:
      "Truth promote recorded with approver, executing agent, affected record IDs, and hash-chained change log entry.",
    tag: "Paper trail",
  },
  {
    id: "adoption",
    title: "Adoption loop",
    summary:
      "Seedling Brain → next QA pass → training progress → brain maturity path. Coaching, not surveillance.",
    tag: "Scorekeeper",
  },
  {
    id: "proof",
    title: "Butternut / DS proof",
    summary:
      "~12-month boring layer first, then agents in weeks. Human approval everywhere. This pattern already ran in a real commercial operation.",
    tag: "Proof drawer",
  },
];

export const DEMO_SCOPE = "read:brain-truth:positioning";

export const PROMOTE_DRAFT = {
  draftRecordId: "recDraftDemo1",
  category: "Positioning",
  scope: DEMO_SCOPE,
};

/** Workshop demo row when Airtable is wired but empty — see brain-key build plan. */
export const FALLBACK_WORKSHOP_DRAFT: DraftTruthItem = {
  recordId: "recDraftDemo1",
  title: "AstraJax positioning guardrail",
  canonicalText:
    "AstraJax helps commercial teams turn domain expertise into AI-ready operating systems. Clive reasons; Clive's Man stewards the context lane. Agents propose — humans approve before anything becomes trusted context.",
  proposedCategory: "Definition",
  brainTheme: "core",
  status: "Draft",
  proposedByAgent: "Clive Curator",
  scope: DEMO_SCOPE,
  source: "fallback",
};

export function buildSessionDraftTruths(
  sessionId: string,
  intake: UserBrainIntake | null | undefined,
): DraftTruthItem[] {
  if (!intake?.intakeComplete) return [];

  const name = intake.name?.trim() || "You";
  const goal = intake.goal?.trim();
  const role = intake.role?.trim();

  const drafts: DraftTruthItem[] = [];

  if (goal) {
    drafts.push({
      recordId: `session_${sessionId}_goal`,
      title: `${name}'s primary goal`,
      canonicalText: goal,
      proposedCategory: "Definition",
      brainTheme: "core",
      status: "Draft",
      proposedByAgent: "Clive",
      scope: scopeForDraft({ brainTheme: "core", proposedCategory: "Definition" }),
      source: "session",
    });
  }

  if (role) {
    drafts.push({
      recordId: `session_${sessionId}_role`,
      title: `${name}'s role and remit`,
      canonicalText: role,
      proposedCategory: "Knowledge",
      brainTheme: "people",
      status: "Draft",
      proposedByAgent: "Clive",
      scope: scopeForDraft({ brainTheme: "people", proposedCategory: "Knowledge" }),
      source: "session",
    });
  }

  return drafts;
}

export function mergeDraftTruthsForDisplay(
  sessionId: string,
  intake: UserBrainIntake | null | undefined,
  workshopDrafts: DraftTruthItem[],
): { drafts: DraftTruthItem[]; source: "workshop" | "session" | "fallback"; notice?: string } {
  if (workshopDrafts.length > 0) {
    return { drafts: workshopDrafts, source: "workshop" };
  }

  const sessionDrafts = buildSessionDraftTruths(sessionId, intake);
  if (sessionDrafts.length > 0) {
    return {
      drafts: sessionDrafts,
      source: "session",
      notice:
        "Workshop is empty or not wired — these drafts come from your intake. Doc can file them in demo (memory) mode; live promote needs Workshop rows.",
    };
  }

  return {
    drafts: [FALLBACK_WORKSHOP_DRAFT],
    source: "fallback",
    notice:
      "Showing a seeded demo draft. Wire BRAIN_WORKSHOP_WRITE_TOKEN and BRAIN_DOC_PROMOTE_TOKEN for live Workshop → Trusted promote.",
  };
}

export function promotionsFromDrafts(
  drafts: DraftTruthItem[],
  selectedIds: string[],
): { draftRecordId: string; category: string; scope: string }[] {
  return selectedIds
    .map((id) => drafts.find((draft) => draft.recordId === id))
    .filter((draft): draft is DraftTruthItem => Boolean(draft))
    .map((draft) => ({
      draftRecordId: draft.recordId,
      category: categoryForPromote(draft.proposedCategory),
      scope: draft.scope,
    }));
}
