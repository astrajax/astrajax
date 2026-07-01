/**
 * Sector → brain theme recommendations for Chapter 1.
 *
 * Aligned to docs/initiatives/chapter1-context-structure.md:
 * - Core Brain is always one theme (§3.1)
 * - Founder overlay uses domain brains in §3.3
 * - Function Leader templates start with Sales (§3.3); other functions follow the same pattern
 *
 * People function template is provisional — included with narrow scope until a full
 * Function Leader — People template is authored in Airtable (§3.3: "author templates when a client vertical needs them").
 */

import type { UserBrainIntake } from "./types";

export type OperatorArchetype = "founder" | "function-leader";

/** Primary function / sector — mirrors chapter1-context-structure §2.1 Primary function + founder path. */
export type SectorId =
  | "founder"
  | "sales"
  | "marketing"
  | "product"
  | "operations"
  | "finance"
  | "customer-success"
  | "people"
  | "professional-services"
  | "general";

export type BrainThemeDefinition = {
  id: string;
  label: string;
  description: string;
  scopeSlug: string;
  isCore?: boolean;
};

export type RecommendedTheme = BrainThemeDefinition & {
  whyRecommended: string;
};

export type BrainThemeRecommendation = {
  sectorId: SectorId;
  sectorLabel: string;
  archetype: OperatorArchetype;
  themes: RecommendedTheme[];
  primaryPickId: string;
  sectorRationale: string;
};

/** Full theme catalog — scope slugs from chapter1-context-structure §3.1–3.3. */
export const BRAIN_THEME_CATALOG: Record<string, BrainThemeDefinition> = {
  core: {
    id: "core",
    label: "Core",
    description: "Mission, principles, governance, key roles, and what the company stands for.",
    scopeSlug: "core",
    isCore: true,
  },
  "customers-market": {
    id: "customers-market",
    label: "Customers & Market",
    description: "Who you serve, why they buy, and what the market actually looks like.",
    scopeSlug: "customers-market",
  },
  product: {
    id: "product",
    label: "Product",
    description: "What you build, how it works, and what good looks like.",
    scopeSlug: "product",
  },
  "go-to-market": {
    id: "go-to-market",
    label: "Go-to-Market",
    description: "How you reach customers, win deals, and tell the story in market.",
    scopeSlug: "go-to-market",
  },
  "delivery-ops": {
    id: "delivery-ops",
    label: "Delivery & Operations",
    description: "How work gets done day to day — fulfilment, handoffs, and operating rhythm.",
    scopeSlug: "delivery-ops",
  },
  "money-runway": {
    id: "money-runway",
    label: "Money & Runway",
    description: "Revenue, cost, runway, forecasts, and what the numbers mean.",
    scopeSlug: "money-runway",
  },
  "sales-new-business": {
    id: "sales-new-business",
    label: "New Business",
    description: "Pipeline, prospecting, first meetings, and how new revenue gets won.",
    scopeSlug: "sales-new-business",
  },
  "sales-accounts": {
    id: "sales-accounts",
    label: "Accounts & Renewals",
    description: "Existing customers, retention, expansion, and renewal motion.",
    scopeSlug: "sales-accounts",
  },
  "sales-ops": {
    id: "sales-ops",
    label: "Sales Ops & Enablement",
    description: "Tools, playbooks, CRM hygiene, and handoffs inside the sales function.",
    scopeSlug: "sales-ops",
  },
  "sales-forecasting": {
    id: "sales-forecasting",
    label: "Forecasting & Targets",
    description: "Targets, forecast rhythm, variance rules, and how numbers get agreed.",
    scopeSlug: "sales-forecasting",
  },
  /**
   * Provisional People domain — Core already holds key roles & escalation (§3.1).
   * This theme covers HR/People function ownership until a full template is authored.
   */
  "people-culture": {
    id: "people-culture",
    label: "People & Culture",
    description: "Hiring, team design, culture, and how people actually operate — narrow scope until the full People template ships.",
    scopeSlug: "people-culture",
  },
};

const SECTOR_LABELS: Record<SectorId, string> = {
  founder: "Founder / startup",
  sales: "Sales / commercial",
  marketing: "Marketing",
  product: "Product / tech",
  operations: "Operations / delivery",
  finance: "Finance",
  "customer-success": "Customer success",
  people: "People / HR",
  "professional-services": "Professional services",
  general: "Your function",
};

type SectorTemplate = {
  sectorId: SectorId;
  archetype: OperatorArchetype;
  themeIds: string[];
  primaryPickId: string;
  rationale: string;
  themeReasons: Partial<Record<string, string>>;
};

const SECTOR_TEMPLATES: Record<SectorId, SectorTemplate> = {
  founder: {
    sectorId: "founder",
    archetype: "founder",
    themeIds: ["core", "customers-market", "product", "go-to-market", "delivery-ops", "money-runway"],
    primaryPickId: "core",
    rationale:
      "You're shaping the whole company — Core first, then the domain brains you actually own today. Founders rarely need every domain filled on day one.",
    themeReasons: {
      core: "Every operator gets one Core — mission, principles, and governance before anything else.",
      "customers-market": "Who you serve and why they buy — usually the first domain brain a young company needs depth in.",
      product: "What you're building and how you prioritise — natural second pick if product is your edge.",
      "go-to-market": "How you reach and win customers — pairs with Customers & Market when revenue motion matters.",
      "delivery-ops": "How work actually gets done — worth lighting once you have something to deliver.",
      "money-runway": "Runway and unit economics — light when finance becomes a real constraint, not before.",
    },
  },
  sales: {
    sectorId: "sales",
    archetype: "function-leader",
    themeIds: ["core", "sales-new-business", "sales-accounts", "sales-ops", "sales-forecasting"],
    primaryPickId: "sales-new-business",
    rationale:
      "You're leading a commercial function — Core for company context, then the sales domain brains that match how revenue actually moves.",
    themeReasons: {
      core: "Function leaders still need Core — plus Business Context and Adjacent Functions overlays as you grow.",
      "sales-new-business": "Pipeline and new-logo motion — usually where sales leaders feel the most context pain first.",
      "sales-accounts": "Retention and expansion — light this if renewals and existing accounts are your main remit.",
      "sales-ops": "Playbooks, tools, and handoffs — the boring layer that makes agents useful for reps.",
      "sales-forecasting": "Targets and forecast rhythm — when variance rules and numbers discipline matter most.",
    },
  },
  marketing: {
    sectorId: "marketing",
    archetype: "function-leader",
    themeIds: ["core", "customers-market", "go-to-market", "product"],
    primaryPickId: "go-to-market",
    rationale:
      "Marketing sits between market understanding and how the company shows up — these themes keep positioning separate from product depth.",
    themeReasons: {
      core: "Governance and company direction — so campaigns don't drift from what leadership actually approved.",
      "customers-market": "Who you're talking to and why they care — the audience layer agents must not invent.",
      "go-to-market": "Channels, messaging, and launch motion — usually the brain marketing leaders light first.",
      product: "What you're actually selling — light when product-marketing fit is the bottleneck.",
    },
  },
  product: {
    sectorId: "product",
    archetype: "function-leader",
    themeIds: ["core", "product", "customers-market", "delivery-ops"],
    primaryPickId: "product",
    rationale:
      "Product leaders own what gets built and why — pair Product with market context, not a whole-company dump on day one.",
    themeReasons: {
      core: "Principles and direction — so roadmap context doesn't float free of company guardrails.",
      product: "Roadmap, priorities, and what good looks like — your natural first pick.",
      "customers-market": "Who you're building for — keeps personas and jobs-to-be-done in one home.",
      "delivery-ops": "How it ships — worth lighting when eng/ops handoffs are where context breaks.",
    },
  },
  operations: {
    sectorId: "operations",
    archetype: "function-leader",
    themeIds: ["core", "delivery-ops", "sales-ops", "product"],
    primaryPickId: "delivery-ops",
    rationale:
      "Ops leaders own how work flows — Delivery & Operations first, with adjacent themes only where handoffs actually hurt.",
    themeReasons: {
      core: "Company-wide rules and escalation — ops needs this before automating anything.",
      "delivery-ops": "Day-to-day fulfilment, staffing, and rhythm — your home territory.",
      "sales-ops": "When sales handoffs and field ops overlap — light if that's where the sludge lives.",
      product: "When operational constraints shape what gets built — optional, not day-one.",
    },
  },
  finance: {
    sectorId: "finance",
    archetype: "function-leader",
    themeIds: ["core", "money-runway", "sales-forecasting", "delivery-ops"],
    primaryPickId: "money-runway",
    rationale:
      "Finance needs numbers discipline and clear lenses — Money & Runway first, with forecast rhythm when commercial numbers are in scope.",
    themeReasons: {
      core: "Governance and who approves what — finance brains fail without this.",
      "money-runway": "P&L, runway, and unit economics — your primary domain.",
      "sales-forecasting": "When you own or depend on commercial forecast rhythm — not full sales depth.",
      "delivery-ops": "Cost-to-serve and operational drivers — light when ops spend is material.",
    },
  },
  "customer-success": {
    sectorId: "customer-success",
    archetype: "function-leader",
    themeIds: ["core", "sales-accounts", "customers-market", "product"],
    primaryPickId: "sales-accounts",
    rationale:
      "Customer success sits on existing relationships — Accounts & Renewals maps cleanly; market and product context stay adjacent, not owned.",
    themeReasons: {
      core: "Company guardrails — so CS agents never promise what leadership hasn't approved.",
      "sales-accounts": "Retention, expansion, and renewal motion — your natural first brain.",
      "customers-market": "Who customers are and why they stay — read-oriented, not owned in depth.",
      product: "What customers actually bought — light when product gaps drive churn conversations.",
    },
  },
  people: {
    sectorId: "people",
    archetype: "function-leader",
    themeIds: ["core", "people-culture", "delivery-ops"],
    primaryPickId: "people-culture",
    rationale:
      "People/HR owns team design and culture — Core holds key roles; People & Culture is provisional until the full template ships.",
    themeReasons: {
      core: "Key roles, escalation, and governance — Core's people area, not a separate politics brain.",
      "people-culture": "Hiring, culture, and how teams operate — provisional scope; we'll tighten as the template matures.",
      "delivery-ops": "When people processes touch how work gets scheduled and staffed — adjacent only.",
    },
  },
  "professional-services": {
    sectorId: "professional-services",
    archetype: "function-leader",
    themeIds: ["core", "customers-market", "delivery-ops", "go-to-market"],
    primaryPickId: "delivery-ops",
    rationale:
      "Agencies and consultancies sell expertise and deliver projects — client context and delivery rhythm matter more than a generic product brain.",
    themeReasons: {
      core: "How you govern client work and what you will never auto-commit to.",
      "customers-market": "Who you serve and what engagements look like — keeps ICP and offer shape honest.",
      "delivery-ops": "How projects run, handoffs, and quality bars — usually the first brain to light.",
      "go-to-market": "How you win work — when pipeline and proposals are where context breaks.",
    },
  },
  general: {
    sectorId: "general",
    archetype: "function-leader",
    themeIds: ["core", "product", "go-to-market", "delivery-ops"],
    primaryPickId: "core",
    rationale:
      "I couldn't pin a exact sector from your answers — start with Core, then pick the domain brain closest to what you actually own.",
    themeReasons: {
      core: "Always first — mission, principles, and governance before domain depth.",
      product: "If you shape what gets built.",
      "go-to-market": "If you shape how the company reaches customers.",
      "delivery-ops": "If you shape how work gets done.",
    },
  },
};

const FOUNDER_SIGNALS = [
  "founder",
  "co-founder",
  "cofounder",
  "startup",
  "start up",
  "starting a company",
  "building a company",
  "my company",
  "own the business",
  "entire business",
  "whole company",
  "ceo",
  "chief executive",
];

const SECTOR_SIGNALS: Record<Exclude<SectorId, "founder" | "general">, string[]> = {
  sales: [
    "sales",
    "commercial",
    "revenue",
    "business development",
    "bd ",
    "account executive",
    "field sales",
    "new business",
    "pipeline",
  ],
  marketing: ["marketing", "brand", "demand gen", "content", "communications", "growth marketing"],
  product: [
    "product manager",
    "product lead",
    "product owner",
    "pm ",
    "engineering lead",
    "tech lead",
    "cto",
    "developer",
    "software",
  ],
  operations: [
    "operations",
    " ops",
    "ops ",
    "delivery",
    "fulfilment",
    "fulfillment",
    "supply chain",
    "logistics",
    "field ops",
  ],
  finance: ["finance", "financial", "cfo", "accounting", "fp&a", "controller", "treasury"],
  "customer-success": [
    "customer success",
    "client success",
    "cs ",
    " cs",
    "support lead",
    "retention",
    "account management",
  ],
  people: ["people", "hr ", " hr", "human resources", "talent", "recruiting", "people ops"],
  "professional-services": [
    "consulting",
    "consultant",
    "agency",
    "professional services",
    "client services",
    "advisory",
    "law firm",
    "accountancy",
  ],
};

function combinedIntakeText(intake: UserBrainIntake): string {
  return [
    intake.businessSector,
    intake.role,
    intake.goal,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesAny(text: string, signals: string[]): boolean {
  return signals.some((signal) => text.includes(signal));
}

export function inferArchetype(intake: UserBrainIntake): OperatorArchetype {
  const text = combinedIntakeText(intake);
  if (matchesAny(text, FOUNDER_SIGNALS)) return "founder";
  return "function-leader";
}

export function inferSectorFromIntake(intake: UserBrainIntake): SectorId {
  const text = combinedIntakeText(intake);

  if (matchesAny(text, FOUNDER_SIGNALS)) return "founder";

  const scores: Partial<Record<SectorId, number>> = {};
  for (const [sector, signals] of Object.entries(SECTOR_SIGNALS) as [
    Exclude<SectorId, "founder" | "general">,
    string[],
  ][]) {
    scores[sector] = signals.reduce((acc, signal) => (text.includes(signal) ? acc + 1 : acc), 0);
  }

  const ranked = Object.entries(scores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const [topSector, topScore] = ranked[0] ?? ["general", 0];

  if ((topScore ?? 0) > 0) return topSector as SectorId;
  return "general";
}

function buildRecommendation(sectorId: SectorId): BrainThemeRecommendation {
  const template = SECTOR_TEMPLATES[sectorId];
  const themes: RecommendedTheme[] = template.themeIds
    .map((id) => {
      const def = BRAIN_THEME_CATALOG[id];
      if (!def) return null;
      return {
        ...def,
        whyRecommended: template.themeReasons[id] ?? def.description,
      };
    })
    .filter((t): t is RecommendedTheme => t !== null);

  return {
    sectorId: template.sectorId,
    sectorLabel: SECTOR_LABELS[template.sectorId],
    archetype: template.archetype,
    themes,
    primaryPickId: template.primaryPickId,
    sectorRationale: template.rationale,
  };
}

export function recommendBrainThemes(intake: UserBrainIntake): BrainThemeRecommendation {
  const sectorId = inferSectorFromIntake(intake);
  return buildRecommendation(sectorId);
}

export function getBrainThemeById(id: string): BrainThemeDefinition | undefined {
  return BRAIN_THEME_CATALOG[id];
}

/** Plain-language qualities of a good brain theme — for Clive copy and UI teaching. */
export const GOOD_THEME_QUALITIES = [
  {
    title: "Clear scope",
    body: "One domain you actually own — not 'everything about the company'.",
  },
  {
    title: "Named ownership",
    body: "Someone is accountable for keeping it current; agents propose, humans approve.",
  },
  {
    title: "Audit trail",
    body: "Workshop drafts first, Trusted Brain only after you sign off — so nothing sneaks in as fact.",
  },
] as const;

export const WHY_WE_THEME =
  "We theme brains so context stays partitioned — Sales workflows don't leak into Product, and agents retrieve one slice at a time instead of drowning in everything at once.";

export function themesForIntake(intake: UserBrainIntake | null | undefined): RecommendedTheme[] {
  if (intake?.brainThemeRecommendations?.themes?.length) {
    return intake.brainThemeRecommendations.themes;
  }
  if (intake?.intakeComplete) {
    return recommendBrainThemes(intake).themes;
  }
  return SECTOR_TEMPLATES.general.themeIds
    .map((id) => BRAIN_THEME_CATALOG[id])
    .filter(Boolean)
    .map((def) => ({
      ...def!,
      whyRecommended: def!.description,
    }));
}
