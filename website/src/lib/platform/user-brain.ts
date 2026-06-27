export type CompetencyScore = "new" | "comfortable" | "expert" | "prefer-not-to-say";

export interface UserBrainDomain {
  id: string;
  label: string;
  score: CompetencyScore;
  notes?: string;
}

export interface CalibrationRow {
  signal: string;
  cliveBehaviour: string;
  pamBehaviour: string;
}

export interface CoachWhitTip {
  id: string;
  domainId: string;
  title: string;
  tip: string;
  examplePrompt: string;
}

export interface ManagerCoachingFlag {
  id: string;
  label: string;
  value: string;
  setBy: string;
  readOnly: true;
}

export interface UserBrainSnapshot {
  userName: string;
  domains: UserBrainDomain[];
  managerFlags: ManagerCoachingFlag[];
  coachTips: CoachWhitTip[];
}

export const USER_BRAIN_DOMAINS: Omit<UserBrainDomain, "score" | "notes">[] = [
  { id: "ai-prompting", label: "AI usage and prompting" },
  { id: "context-env", label: "Context environments and knowledge curation" },
  { id: "system-arch", label: "System architecture and workflow design" },
  { id: "coding", label: "Coding and technical implementation" },
  { id: "commercial", label: "Commercial forecasting and planning" },
  { id: "data-evidence", label: "Data quality and evidence" },
  { id: "team-leadership", label: "Team leadership and change" },
  { id: "domain-specific", label: "Domain-specific work (field sales ops)" },
];

export const DEFAULT_USER_BRAIN: UserBrainSnapshot = {
  userName: "Matthew",
  domains: [
    { id: "ai-prompting", label: "AI usage and prompting", score: "comfortable", notes: "Strong on iteration; still building prompt habit discipline." },
    { id: "context-env", label: "Context environments and knowledge curation", score: "expert", notes: "Built the Butternut operating layer; knows where context rots." },
    { id: "system-arch", label: "System architecture and workflow design", score: "comfortable" },
    { id: "coding", label: "Coding and technical implementation", score: "new", notes: "Ships via AI-assisted build — does not hand-write code." },
    { id: "commercial", label: "Commercial forecasting and planning", score: "expert" },
    { id: "data-evidence", label: "Data quality and evidence", score: "comfortable" },
    { id: "team-leadership", label: "Team leadership and change", score: "expert" },
    { id: "domain-specific", label: "Domain-specific work (field sales ops)", score: "expert" },
  ],
  managerFlags: [
    {
      id: "engagement",
      label: "Engagement level",
      value: "High — actively shaping the brain and reviewing agent answers",
      setBy: "Self (founder champion)",
      readOnly: true,
    },
    {
      id: "technical-adeptness",
      label: "Technical adeptness",
      value: "Commercial-first; relies on Doc lane for implementation",
      setBy: "Self (founder champion)",
      readOnly: true,
    },
  ],
  coachTips: [
    {
      id: "tip-context-1",
      domainId: "context-env",
      title: "Name the approval boundary in your prompt",
      tip: "When you ask for a draft, say what must stay workshop-only vs what you might promote. Clive calibrates caveats from that signal.",
      examplePrompt:
        "Draft a pricing guardrail for workshop review only — do not phrase it as approved policy.",
    },
    {
      id: "tip-prompt-1",
      domainId: "ai-prompting",
      title: "Ask for evidence, not enthusiasm",
      tip: "Replace 'is this a good idea?' with 'what assumption would Pam challenge first?' — you get challenge without skipping the human gate.",
      examplePrompt: "What is the weakest assumption in this rollout plan, and what evidence is missing?",
    },
    {
      id: "tip-coding-1",
      domainId: "coding",
      title: "Scope the build lane explicitly",
      tip: "Tell Doc whether you want a proposal, a package, or a Cursor dispatch brief. Narrow scope keeps Composer work bounded.",
      examplePrompt:
        "Doc, prepare a build brief for a brain health page, seeded demo data only, no live system writes.",
    },
  ],
};

export function deriveCalibration(domains: UserBrainDomain[]): CalibrationRow[] {
  const byId = Object.fromEntries(domains.map((d) => [d.id, d.score])) as Record<string, CompetencyScore>;

  const aiLow = byId["ai-prompting"] === "new" || byId["ai-prompting"] === "prefer-not-to-say";
  const contextLow =
    byId["context-env"] === "new" || byId["context-env"] === "prefer-not-to-say";
  const archStrong = byId["system-arch"] === "expert";
  const commercialStrong = byId["commercial"] === "expert";
  const allExpert = domains.every((d) => d.score === "expert" || d.score === "prefer-not-to-say");

  const rows: CalibrationRow[] = [];

  if (aiLow || contextLow) {
    rows.push({
      signal: "Low AI or context-environment experience",
      cliveBehaviour: "More explanation, fewer assumptions, slower pace",
      pamBehaviour:
        "More sensitive contextual triggers (thin evidence, scope creep); mandatory Pam at action gates",
    });
  }

  if (contextLow) {
    rows.push({
      signal: "Low context-environment experience",
      cliveBehaviour: "Plain language, teach as you go, do not trust vague context claims",
      pamBehaviour: "Challenge scope and source boundaries when those topics arise",
    });
  }

  if (archStrong) {
    rows.push({
      signal: "Strong system architecture",
      cliveBehaviour: "Faster trade-off language, less hand-holding on structure",
      pamBehaviour: "Less challenge on structure; more on adoption and evidence",
    });
  }

  if (commercialStrong) {
    rows.push({
      signal: "Strong commercial / domain judgement",
      cliveBehaviour: "Trust domain claims more; ask sharper operational questions",
      pamBehaviour: "Focus on narrative risk, stakeholder reaction, overconfidence",
    });
  }

  if (allExpert) {
    rows.push({
      signal: "Expert across mapped domains",
      cliveBehaviour: "Peer-level conversation; skip basics",
      pamBehaviour: "Mandatory checkpoints still apply before action — expertise does not remove governance",
    });
  }

  if (rows.length === 0) {
    rows.push({
      signal: "Balanced profile",
      cliveBehaviour: "Balanced pace — explain governance, trust domain judgement where shown",
      pamBehaviour: "Standard contextual sensitivity at action boundaries",
    });
  }

  return rows;
}

export function weakestDomains(domains: UserBrainDomain[]): UserBrainDomain[] {
  const priority: CompetencyScore[] = ["new", "prefer-not-to-say", "comfortable", "expert"];
  return [...domains]
    .filter((d) => d.score !== "expert")
    .sort((a, b) => priority.indexOf(a.score) - priority.indexOf(b.score))
    .slice(0, 3);
}

export function scoreLabel(score: CompetencyScore): string {
  switch (score) {
    case "new":
      return "New";
    case "comfortable":
      return "Comfortable";
    case "expert":
      return "Expert";
    case "prefer-not-to-say":
      return "Prefer not to say";
  }
}
