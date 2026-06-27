import { castHeroByProduct } from "@/lib/agent-cast-assets";
import type { PaperTrailLine } from "./brain-health";

export type CourtRoleId = "clive" | "pam" | "doc" | "iris" | "vera" | "judge";

export interface CourtRole {
  id: CourtRoleId;
  name: string;
  title: string;
  portraitSrc?: string;
  focus: string;
}

export interface CourtTake {
  roleId: CourtRoleId;
  headline: string;
  body: string;
}

export type HumanJudgement = "approve" | "not-yet" | "escalate" | null;

export interface CourtDecision {
  id: string;
  title: string;
  context: string;
  stakes: string;
  roles: CourtRole[];
  takes: CourtTake[];
  judgeSummary: string;
  ruleLine: string;
}

export const COURT_RULE =
  "The Court surfaces perspectives; the human gives judgement.";

export const DEFAULT_COURT_DECISION: CourtDecision = {
  id: "court-discount-guardrail",
  title: "Approve the off-script discount guardrail for trusted context?",
  context:
    "Regional managers want reps to move faster on trusted accounts. Clive drafted a guardrail that allows a 10% off-script discount when two conditions are met: account tier is Gold+ and RM pre-approves in the brain log.",
  stakes:
    "High stakes: this becomes approved context agents will cite. Wrong guardrails propagate into live sales conversations and pricing claims.",
  roles: [
    {
      id: "clive",
      name: "Clive Wigglesworth",
      title: "Upside and adoption",
      portraitSrc: castHeroByProduct("clive"),
      focus: "Will reps actually use this, and does it make the brain feel helpful?",
    },
    {
      id: "pam",
      name: "Pam Portiscue",
      title: "Risk and weak assumptions",
      focus: "What could go wrong if we trust this too early?",
    },
    {
      id: "doc",
      name: "Doc Albright",
      title: "Implementation cost and action readiness",
      portraitSrc: castHeroByProduct("doc"),
      focus: "Can we execute cleanly after judgement, with a paper trail?",
    },
    {
      id: "iris",
      name: "Professor Iris Mortimer",
      title: "Evidence quality",
      portraitSrc: castHeroByProduct("iris"),
      focus: "Does the data support the guardrail thresholds?",
    },
    {
      id: "vera",
      name: "Vera Vinegar-Toes",
      title: "Stakeholder reaction and narrative risk",
      portraitSrc: castHeroByProduct("vera"),
      focus: "How will this land with reps, finance, and leadership?",
    },
    {
      id: "judge",
      name: "The Judge",
      title: "Summarises; does not decide",
      focus: "Weighs the perspectives for the human; abstains from the final call.",
    },
  ],
  takes: [
    {
      roleId: "clive",
      headline: "Adoption upside is real if caveats stay visible",
      body: "Reps on trusted accounts are already improvising in the corridor, poor things. A logged ten per cent path with RM sign-off gives them something safer than hallway folklore, as long as we keep the Ireland variants visibly untrusted.",
    },
    {
      roleId: "pam",
      headline: "Weakest assumption: rep discipline on pre-approval",
      body: "The guardrail assumes reps will wait for RM log entries before quoting. Missing evidence: sign-off compliance rate from the pilot. Rabbit-hole risk: expanding to 15% before the 10% path is proven in review data.",
    },
    {
      roleId: "doc",
      headline: "Action-ready after human judgement",
      body: "I can write the approved truth row, link source snippets, and log the change, but only after you record judgement. Estimated effort: one truth promote, two linked examples, one workshop row retired.",
    },
    {
      roleId: "iris",
      headline: "Evidence is partial, not absent",
      body: "Gold+ account performance supports a bounded discount window, but sample size for Ireland is too thin. Recommend tagging the truth as UK-only until Ireland evidence clears review.",
    },
    {
      roleId: "vera",
      headline: "Finance will ask who pays for the optimism",
      body: "Reps will love the speed. Finance will ask who pays for the optimism, and whether this erodes margin discipline. Reps will quote the headline, not the footnote. Narrative fix: frame it as logged exceptions, not a culture of wiggle room. Leadership needs one slide on the human gate, not just the discount cap.",
    },
    {
      roleId: "judge",
      headline: "Summary for the human gate",
      body: "Six perspectives on the table. The tension sits between adoption upside (Clive, Vera) and evidence boundaries (Pam, Iris). Doc waits on your judgement. I summarise; I do not choose.",
    },
  ],
  judgeSummary:
    "Six perspectives on the table. The tension sits between adoption upside (Clive, Vera) and evidence boundaries (Pam, Iris). Doc waits on your judgement. I do not choose.",
  ruleLine: COURT_RULE,
};

export function createJudgementPaperTrail(
  judgement: Exclude<HumanJudgement, null>,
  actor: string,
): PaperTrailLine {
  const actionMap = {
    approve: "Court judgement: approved for Doc execution",
    "not-yet": "Court judgement: not yet; returned to workshop",
    escalate: "Court judgement: escalated to another human approver",
  };

  return {
    id: `pt-court-${Date.now()}`,
    action: actionMap[judgement],
    actor,
    reason: COURT_RULE,
    timestamp: new Date().toISOString(),
  };
}

export function docExecutionLine(judgement: Exclude<HumanJudgement, null>): string | null {
  if (judgement !== "approve") return null;
  return "Doc will execute the approved brief (truth promote, linked examples, and change log entry) after your judgement is recorded.";
}
