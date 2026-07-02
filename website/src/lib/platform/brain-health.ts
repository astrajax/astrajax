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
  brainName: "AstraJax Chapter 1",
  brainSlug: "astrajax-chapter-1",
  currentLevel: "seedling",
  nextLevel: "house-trained",
  metrics: {
    qaPassCount: 0,
    approvedRecordCount: 0,
    draftRecordCount: 0,
    staleRecordCount: 0,
    knownGaps: ["Trusted truths not yet loaded — run demo seed or sit with Clive"],
    contradictionCount: 0,
    answerFailureRate: 0,
    answerFailureTrend: "stable",
    lastReviewed: new Date().toISOString(),
    confidenceByDomain: [{ domain: "Positioning", confidence: "low" }],
  },
  currentCreditPercent: 0,
  riskTolerance: "balanced",
  eligibility: {
    sustainedDays: 0,
    sustainedDaysRequired: 30,
    gapsBelowThreshold: false,
    contradictionsLow: true,
    failureRateImproving: true,
    signOffCurrent: false,
  },
  leaderboard: [],
  recentLevelUp: null,
  truths: [],
  memories: [],
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
