export interface AdoptionSignal {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "stable" | "down";
  description: string;
}

export interface TeamCelebration {
  id: string;
  team: string;
  headline: string;
  detail: string;
  celebratedAt: string;
}

export interface XpLevel {
  level: number;
  label: string;
  xpRequired: number;
  currentXp: number;
}

export interface AdoptionSnapshot {
  hostName: string;
  hostRole: string;
  hostPortraitSrc: string;
  hostGreeting: string;
  brainName: string;
  signals: AdoptionSignal[];
  xp: XpLevel;
  teamCelebrations: TeamCelebration[];
  enablementNote: string;
}

export const ADOPTION_ENABLEMENT_NOTE =
  "Enablement, not surveillance. We celebrate teams and positive habits, never rank individuals or count who asked fewest questions.";

export const ADOPTION_PROOF_NOTE =
  "See the Butternut DS training hub: team sandboxes, training videos, and adoption ops in production (celebrate teams, not individuals).";

export const DEFAULT_ADOPTION: AdoptionSnapshot = {
  hostName: "KK Kingsford",
  hostRole: "Scorekeeper, team momentum and XP",
  hostPortraitSrc: "/agent-cast/kk-kingsford.png",
  hostGreeting:
    "Another week on the board. Loudest cheers for the pods that levelled up their practice. Teams win together here.",
  brainName: "Northline Field Ops Brain",
  signals: [
    {
      id: "training",
      label: "Training completion",
      value: 78,
      unit: "%",
      trend: "up",
      description: "Core prompt sandbox and guardrail walkthrough finished.",
    },
    {
      id: "confidence",
      label: "Prompt confidence",
      value: 72,
      unit: "/100",
      trend: "up",
      description:
        "Team average self-reported comfort asking governed questions, aggregated, never ranked by person.",
    },
    {
      id: "helpful",
      label: "Helpful usage",
      value: 64,
      unit: "%",
      trend: "stable",
      description: "Interactions scored helpful after human review, not vanity clicks.",
    },
    {
      id: "sandbox",
      label: "Sandbox practice",
      value: 41,
      unit: "sessions",
      trend: "up",
      description: "Safe practice runs before live customer conversations.",
    },
  ],
  xp: {
    level: 4,
    label: "Field-ready",
    xpRequired: 500,
    currentXp: 340,
  },
  teamCelebrations: [
    {
      id: "cel-sales-sandbox",
      team: "Direct Sales",
      headline: "Sales completed the prompt sandbox",
      detail: "Whole regional pod finished the guardrail walkthrough this week.",
      celebratedAt: "2026-06-25T17:00:00.000Z",
    },
    {
      id: "cel-ops-confidence",
      team: "Regional Ops",
      headline: "Ops improved confidence this week",
      detail: "Average prompt confidence up 12 points after Coach Whit sessions.",
      celebratedAt: "2026-06-24T12:00:00.000Z",
    },
    {
      id: "cel-events-practice",
      team: "Events team",
      headline: "Events logged 20 sandbox sessions",
      detail: "Practised staffing exceptions before the summer festival push.",
      celebratedAt: "2026-06-23T09:30:00.000Z",
    },
    {
      id: "cel-pricing-helpful",
      team: "Pricing champions pod",
      headline: "Pricing pod hit 90% helpful usage",
      detail: "Review queue clean, reps citing approved guardrails in the field.",
      celebratedAt: "2026-06-22T15:00:00.000Z",
    },
  ],
  enablementNote: ADOPTION_ENABLEMENT_NOTE,
};
