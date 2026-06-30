export type MaturityLevel =
  | "seedling"
  | "house-trained"
  | "working"
  | "sharp"
  | "trusted"
  | "elder";

export interface MaturityStep {
  level: MaturityLevel;
  label: string;
  shortLabel: string;
  description: string;
  requirements: string[];
}

export const MATURITY_LADDER: MaturityStep[] = [
  {
    level: "seedling",
    label: "Seedling Brain",
    shortLabel: "Seedling",
    description: "Starter context exists, but it is mostly draft.",
    requirements: ["Complete first brain workshop intake", "At least one draft truth row"],
  },
  {
    level: "house-trained",
    label: "House-Trained Brain",
    shortLabel: "House-Trained",
    description: "Core records are tidy enough for guided use.",
    requirements: ["Draft count below threshold", "Known gaps documented", "First QA pass scheduled"],
  },
  {
    level: "working",
    label: "Working Brain",
    shortLabel: "Working",
    description: "Domain expert QA has started; agents can answer low-risk questions with caveats.",
    requirements: ["1+ QA pass", "10+ approved records", "Failure rate trending down"],
  },
  {
    level: "sharp",
    label: "Sharp Brain",
    shortLabel: "Sharp",
    description: "Multiple QA passes complete; routine in-scope answers carry source confidence.",
    requirements: ["3+ QA passes", "40+ approved records", "No unresolved contradictions"],
  },
  {
    level: "trusted",
    label: "Trusted Brain",
    shortLabel: "Trusted",
    description: "Management sign-off complete; mature enough for operational use within boundaries.",
    requirements: ["Management sign-off current", "Stale records below threshold", "Sustained 30 days at Sharp"],
  },
  {
    level: "elder",
    label: "Elder Brain",
    shortLabel: "Elder",
    description: "Battle-tested through feedback, corrections, and repeated successful use.",
    requirements: ["6+ months operational use", "Elder review by domain owner", "Efficiency credit sustained"],
  },
];

export interface BrainMetrics {
  qaPassCount: number;
  approvedRecordCount: number;
  draftRecordCount: number;
  staleRecordCount: number;
  knownGaps: string[];
  contradictionCount: number;
  answerFailureRate: number;
  answerFailureTrend: "improving" | "stable" | "worsening";
  lastReviewed: string;
  confidenceByDomain: { domain: string; confidence: "low" | "medium" | "high" }[];
}

export interface EfficiencyCreditTier {
  maturity: MaturityLevel;
  label: string;
  creditPercent: number;
}

export const EFFICIENCY_CREDIT_TABLE: EfficiencyCreditTier[] = [
  { maturity: "seedling", label: "Seedling Brain", creditPercent: 0 },
  { maturity: "house-trained", label: "House-Trained Brain", creditPercent: 0 },
  { maturity: "working", label: "Working Brain", creditPercent: 5 },
  { maturity: "sharp", label: "Sharp Brain", creditPercent: 10 },
  { maturity: "trusted", label: "Trusted Brain", creditPercent: 15 },
  { maturity: "elder", label: "Elder Brain", creditPercent: 20 },
];

export interface EfficiencyEligibility {
  sustainedDays: number;
  sustainedDaysRequired: number;
  gapsBelowThreshold: boolean;
  contradictionsLow: boolean;
  failureRateImproving: boolean;
  signOffCurrent: boolean;
}

export interface LeaderboardEntry {
  id: string;
  category: string;
  brainOrTeam: string;
  highlight: string;
}

export interface LevelUpCelebration {
  fromLevel: MaturityLevel;
  toLevel: MaturityLevel;
  reason: string;
  celebratedAt: string;
}

export type BrainMemoryStatus = "draft" | "active" | "promoted";

export type BrainMemoryLifecycle = "draft" | "working" | "trusted" | "retired";

export type MemoryImportance = 1 | 2 | 3 | 4 | 5;

export type RiskTolerance = "conservative" | "balanced" | "assertive";

export const LIFECYCLE_LABELS: Record<BrainMemoryLifecycle, string> = {
  draft: "Draft",
  working: "Working",
  trusted: "Trusted",
  retired: "Retired",
};

export const MEMORY_STATUS_DISPLAY: Record<BrainMemoryStatus, string> = {
  draft: "Draft",
  active: "Working",
  promoted: "Promoted",
};

export const RISK_TOLERANCE_OPTIONS: {
  value: RiskTolerance;
  label: string;
  description: string;
}[] = [
  {
    value: "conservative",
    label: "Conservative",
    description: "Propose-only except obvious retire candidates.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "May tighten low-importance Working Memory with audit trail.",
  },
  {
    value: "assertive",
    label: "Assertive",
    description: "May auto-tighten and auto-retire low-importance records — still no Trusted Truth promotion.",
  },
];

export interface BrainTruthRow {
  id: string;
  title: string;
  summary: string;
  domain: string;
  status: "approved" | "draft";
}

export interface BrainMemoryRow {
  id: string;
  title: string;
  summary: string;
  linkedTruthTitle?: string;
  status: BrainMemoryStatus;
  importance: MemoryImportance;
  lifecycle: BrainMemoryLifecycle;
  lastReferencedAt?: string;
  retireEligibleAt?: string;
  source: string;
  capturedAt: string;
}

export interface PaperTrailLine {
  id: string;
  action: string;
  actor: string;
  reason: string;
  timestamp: string;
}

export interface BrainHealthSnapshot {
  brainName: string;
  brainSlug: string;
  currentLevel: MaturityLevel;
  nextLevel: MaturityLevel | null;
  metrics: BrainMetrics;
  currentCreditPercent: number;
  eligibility: EfficiencyEligibility;
  riskTolerance: RiskTolerance;
  leaderboard: LeaderboardEntry[];
  recentLevelUp: LevelUpCelebration | null;
  truths: BrainTruthRow[];
  memories: BrainMemoryRow[];
}

export const DEFAULT_BRAIN_HEALTH: BrainHealthSnapshot = {
  brainName: "Northline Field Ops Brain",
  brainSlug: "northline-field-ops",
  currentLevel: "working",
  nextLevel: "sharp",
  metrics: {
    qaPassCount: 2,
    approvedRecordCount: 38,
    draftRecordCount: 12,
    staleRecordCount: 3,
    knownGaps: [
      "Ireland variant rules not yet in trusted context",
      "Q3 event category weights still in draft workshop rows",
    ],
    contradictionCount: 0,
    answerFailureRate: 8,
    answerFailureTrend: "improving",
    lastReviewed: "2026-06-24T14:30:00.000Z",
    confidenceByDomain: [
      { domain: "Pricing guardrails", confidence: "high" },
      { domain: "Event staffing", confidence: "medium" },
      { domain: "Ireland operations", confidence: "low" },
    ],
  },
  currentCreditPercent: 5,
  riskTolerance: "balanced",
  eligibility: {
    sustainedDays: 18,
    sustainedDaysRequired: 30,
    gapsBelowThreshold: true,
    contradictionsLow: true,
    failureRateImproving: true,
    signOffCurrent: true,
  },
  leaderboard: [
    {
      id: "cleanest",
      category: "Cleanest brain",
      brainOrTeam: "Northline Field Ops",
      highlight: "Zero unresolved contradictions for 21 days",
    },
    {
      id: "improved",
      category: "Most improved",
      brainOrTeam: "Regional Events team brain",
      highlight: "Failure rate down 40% after stale cleanup sprint",
    },
    {
      id: "stale",
      category: "Fastest stale cleanup",
      brainOrTeam: "Pricing guardrails brain",
      highlight: "Cleared 14 stale rows in one review session",
    },
    {
      id: "evidence",
      category: "Best evidence coverage",
      brainOrTeam: "Forecast Coach brain",
      highlight: "Every approved truth has a linked source snippet",
    },
  ],
  recentLevelUp: {
    fromLevel: "house-trained",
    toLevel: "working",
    reason:
      "2 QA passes completed, 38 approved records, failure rate trending down, and known gaps documented.",
    celebratedAt: "2026-06-18T09:00:00.000Z",
  },
  truths: [
    {
      id: "truth-pricing-1",
      title: "Off-script discount guardrail",
      summary:
        "Reps may not propose discounts beyond approved tiers without RM sign-off logged in the brain.",
      domain: "Pricing guardrails",
      status: "approved",
    },
    {
      id: "truth-staffing-1",
      title: "Event staffing minimums",
      summary: "Weekend events require at least two experienced reps unless RM approves an exception.",
      domain: "Event staffing",
      status: "approved",
    },
    {
      id: "truth-ireland-draft",
      title: "Ireland pricing variant",
      summary: "Draft workshop row — not yet approved for agent use.",
      domain: "Ireland operations",
      status: "draft",
    },
  ],
  memories: [
    {
      id: "mem-discount-call",
      title: "Rep asked about off-script discount on a trusted account",
      summary:
        "Clive answered with caveats and pointed to the guardrail truth. Human approved the escalation path.",
      linkedTruthTitle: "Off-script discount guardrail",
      status: "active",
      importance: 4,
      lifecycle: "working",
      lastReferencedAt: "2026-06-26T09:30:00.000Z",
      source: "Chapter 1 study session",
      capturedAt: "2026-06-20T11:15:00.000Z",
    },
    {
      id: "mem-staffing-weekend",
      title: "Weekend event understaffed in Cork",
      summary:
        "Regional lead flagged a one-rep weekend event. Memory captured for promote review.",
      linkedTruthTitle: "Event staffing minimums",
      status: "active",
      importance: 3,
      lifecycle: "working",
      lastReferencedAt: "2026-06-25T14:10:00.000Z",
      source: "Brain interaction review",
      capturedAt: "2026-06-22T16:40:00.000Z",
    },
    {
      id: "mem-ireland-gap",
      title: "Ireland rep asked for local pricing",
      summary: "No trusted Ireland variant yet — answer stayed in workshop with clear gap flag.",
      status: "draft",
      importance: 2,
      lifecycle: "draft",
      source: "Ask Clive panel",
      capturedAt: "2026-06-23T10:05:00.000Z",
    },
    {
      id: "mem-old-promo-banner",
      title: "Summer promo banner wording from May workshop",
      summary:
        "Transient campaign note — superseded by June pricing refresh. Not referenced in 18 days.",
      status: "active",
      importance: 1,
      lifecycle: "working",
      lastReferencedAt: "2026-06-10T08:00:00.000Z",
      retireEligibleAt: "2026-06-24T08:00:00.000Z",
      source: "Workshop capture",
      capturedAt: "2026-05-28T12:00:00.000Z",
    },
    {
      id: "mem-legacy-footfall",
      title: "Legacy footfall estimate for pilot store",
      summary:
        "One-off pilot figure from Q1 — low importance, unused since rollout ended.",
      status: "active",
      importance: 1,
      lifecycle: "working",
      lastReferencedAt: "2026-06-08T16:20:00.000Z",
      retireEligibleAt: "2026-06-22T16:20:00.000Z",
      source: "Brain interaction review",
      capturedAt: "2026-03-15T10:00:00.000Z",
    },
    {
      id: "mem-retired-sample",
      title: "Old event category label (retired)",
      summary: "Archived after taxonomy cleanup — kept in paper trail only.",
      status: "active",
      importance: 1,
      lifecycle: "retired",
      lastReferencedAt: "2026-05-01T11:00:00.000Z",
      source: "Clive's Man curation pass",
      capturedAt: "2026-02-10T09:00:00.000Z",
    },
  ],
};

export function getImportanceDistribution(
  memories: BrainMemoryRow[],
): Record<MemoryImportance, number> {
  const counts: Record<MemoryImportance, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const memory of memories) {
    if (memory.lifecycle !== "retired") {
      counts[memory.importance] += 1;
    }
  }
  return counts;
}

export function getRetireCandidates(memories: BrainMemoryRow[]): BrainMemoryRow[] {
  const now = Date.now();
  return memories.filter((memory) => {
    if (memory.lifecycle === "retired" || memory.lifecycle === "draft") return false;
    if (memory.importance > 1) return false;
    if (memory.retireEligibleAt) {
      return new Date(memory.retireEligibleAt).getTime() <= now;
    }
    if (!memory.lastReferencedAt) return false;
    const daysSinceRef =
      (now - new Date(memory.lastReferencedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRef >= 14;
  });
}

export function countActiveMemories(memories: BrainMemoryRow[]): number {
  return memories.filter((m) => m.lifecycle !== "retired").length;
}

export function maturityLabel(level: MaturityLevel): string {
  return MATURITY_LADDER.find((step) => step.level === level)?.label ?? level;
}

export function maturityIndex(level: MaturityLevel): number {
  return MATURITY_LADDER.findIndex((step) => step.level === level);
}
