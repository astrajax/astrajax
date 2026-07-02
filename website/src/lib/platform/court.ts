import { castHeroByProduct } from "@/lib/agent-cast-assets";
import type { PaperTrailLine } from "./brain-health";

export type CourtRoleId = "clive" | "pam" | "doc" | "lazlo" | "clive-man" | "judge";

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

export interface CourtDialogueTurn {
  roleId: CourtRoleId;
  line: string;
}

export type CourtVerdict = "Approve" | "Strong approve" | "Disapprove" | "Strong disapprove" | "LOVE" | "HATE";

export interface AgentVerdict {
  roleId: CourtRoleId;
  verdict: CourtVerdict;
  summary: string;
}

export interface BickerTurn {
  roleId: CourtRoleId | "user";
  line: string;
}

export type HumanJudgement = "approve" | "not-yet" | "escalate" | null;

export interface CourtDecision {
  id: string;
  title: string;
  context: string;
  stakes: string;
  roles: CourtRole[];
  takes: CourtTake[];
  dialogue: CourtDialogueTurn[];
  judgeSummary: string;
  ruleLine: string;
  convenerId: CourtRoleId;
}

export const COURT_RULE =
  "The Court surfaces perspectives; the human gives judgement.";

export const CONVENING_LINE =
  "Pam Portiscue convenes this session. She calls the Court to order; she does not own the verdict.";

export interface CourtBookPosition {
  x: number;
  y: number;
}

export interface CourtBookSlot extends CourtBookPosition {
  width: number;
  height: number;
}

export const COURT_BOOK_LAYOUT = {
  portraits: {
    clive: { x: 15.9, y: 13.9 },
    pam: { x: 15.6, y: 28.2 },
    doc: { x: 15.9, y: 42.1 },
    lazlo: { x: 15.4, y: 56.5 },
    "clive-man": { x: 15.4, y: 70.6 },
    judge: { x: 15.4, y: 84.1 },
  } as Record<CourtRoleId, CourtBookPosition>,
  verdictSlots: {
    clive: { x: 19.5, y: 13.9, width: 26, height: 9 },
    pam: { x: 19.5, y: 28.2, width: 26, height: 9 },
    doc: { x: 19.5, y: 42.1, width: 26, height: 9 },
    lazlo: { x: 19.5, y: 56.5, width: 26, height: 9 },
    "clive-man": { x: 19.5, y: 70.6, width: 26, height: 9 },
  } as Record<Exclude<CourtRoleId, "judge">, CourtBookSlot>,
  rightPageContent: { left: 55, top: 8, width: 34, height: 76 },
  plaque: { x: 68.5, y: 82, width: 12, height: 12 },
} as const;

export const COURT_ROLES: CourtRole[] = [
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
      id: "lazlo",
      name: "Lazlo Marlowe",
      title: "Dramaturg's eye",
      focus: "Does this hold together as a story humans will believe?",
    },
    {
      id: "clive-man",
      name: "Clive's Man",
      title: "Keeper of the record",
      focus: "What does the record actually say, and what will it say afterwards?",
    },
    {
      id: "judge",
      name: "The Judge",
      title: "Summarises; does not decide",
      focus: "Weighs the perspectives for the human; abstains from the final call.",
    },
];

export const DEFAULT_COURT_DECISION: CourtDecision = {
  id: "court-discount-guardrail",
  title: "Approve the off-script discount guardrail for trusted context?",
  context:
    "Regional managers want reps to move faster on trusted accounts. Clive drafted a guardrail that allows a 10% off-script discount when two conditions are met: account tier is Gold+ and RM pre-approves in the brain log.",
  stakes:
    "High stakes: this becomes approved context agents will cite. Wrong guardrails propagate into live sales conversations and pricing claims.",
  roles: COURT_ROLES,
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
      roleId: "lazlo",
      headline: "Does the narrative hold, and will reps believe it?",
      body: "Gold+ account performance supports a bounded discount window, but the story this tells must ring true. Reps will love the speed, yet leadership will ask who pays for the optimism. Frame it as logged exceptions, not a culture of wiggle room, or the narrative collapses.",
    },
    {
      roleId: "clive-man",
      headline: "The record must be exact; precedent matters",
      body: "What the record says now shapes what it says afterwards. This guardrail assumes RM log discipline; I need that discipline exact. Tagging the truth as UK-only until Ireland evidence clears review keeps the precedent clean. A narrow record beats a broad assumption.",
    },
    {
      roleId: "judge",
      headline: "Summary for the human gate",
      body: "Five perspectives on the table. The tension sits between narrative flow and record precision. Doc waits on your judgement. I summarise; I do not choose.",
    },
  ],
  dialogue: [
    {
      roleId: "pam",
      line: "The Court is in session. The matter before the bench: a ten per cent off-script discount guardrail for trusted accounts. I convene; I do not preside. Clive, you brought this. Make your case.",
    },
    {
      roleId: "clive",
      line: "Gladly, Pam. Reps on trusted accounts are already improvising in the corridors, poor things. A logged ten per cent path with RM sign-off is kinder than hallway folklore. Adoption follows helpfulness.",
    },
    {
      roleId: "pam",
      line: "Helpfulness is exactly how drift gets in the door, Clive. This guardrail assumes reps wait for the RM log entry before quoting. Where is the sign-off compliance rate from the pilot?",
    },
    {
      roleId: "lazlo",
      line: "Does the story hold? Gold-plus account performance supports a bounded discount window, yet the narrative must ring true. Reps will quote the headline, never the footnote. Frame it as logged exceptions or leadership hears something you did not say.",
    },
    {
      roleId: "clive-man",
      line: "The record must be exact. Tagging the truth as UK-only until Ireland evidence clears review keeps the precedent clean. A narrow record beats a broad assumption, and RM log discipline is not negotiable.",
    },
    {
      roleId: "doc",
      line: "If judgement lands, execution is one truth promote, two linked examples, one workshop row retired. I move on recorded judgement, not on applause.",
    },
    {
      roleId: "clive",
      line: "Then let the record show I accept Clive's Man's boundary. UK-only, with the Ireland variants visibly untrusted. Better a narrow truth than a broad rumour.",
    },
    {
      roleId: "pam",
      line: "Noted for the record. And the fifteen per cent whisper dies here until the ten per cent path is proven in review data.",
    },
    {
      roleId: "judge",
      line: "The bench has spoken and I shall be brief. The tension sits between narrative flow and record precision. I summarise; I do not choose. The only chair that matters now is yours.",
    },
  ],
  judgeSummary:
    "Five perspectives on the table. The tension sits between narrative flow (Lazlo) and record precision (Clive's Man). Doc waits on your judgement. I do not choose.",
  ruleLine: COURT_RULE,
  convenerId: "pam",
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

export interface CourtMatter {
  title: string;
  context: string;
  stakes: string;
}

/** Character limits for the intake form — keeps entries on the page of the book. */
export const COURT_MATTER_LIMITS = {
  title: 120,
  context: 500,
  stakes: 300,
} as const;

export function conveneMatter(matter: CourtMatter): CourtDecision {
  return {
    id: `court-matter-${Date.now()}`,
    title: matter.title,
    context: matter.context,
    stakes: matter.stakes,
    roles: COURT_ROLES,
    takes: [],
    dialogue: [
      {
        roleId: "pam",
        line: `The Court is in session. The matter before the bench: "${matter.title.replace(/[.?!]+$/, "")}". This door is always open, but it is not a casual one. I convene; I do not preside. Clive, the constructive case, please.`,
      },
      {
        roleId: "clive",
        line: "The upside first, as is proper. If this works, what does it make possible for the humans involved? That is the question I shall hold while the bench does its work.",
      },
      {
        roleId: "pam",
        line: "And I shall hold the other one. What is the weakest assumption underneath it, and what happens if that assumption is wrong? Evidence before enthusiasm.",
      },
      {
        roleId: "lazlo",
        line: "And I will ask how it lands as a story. Stakeholders hear narratives, not specifications. If the story this tells is the wrong one, the specification will not save it.",
      },
      {
        roleId: "clive-man",
        line: "I will want to know what precedent this sets and how the record will hold it. Precision now saves second-guessing later.",
      },
      {
        roleId: "doc",
        line: "When judgement is recorded, I will name the cost of acting on it: effort, risk, and what gets retired. Not before.",
      },
      {
        roleId: "judge",
        line: "The bench has framed its questions. No verdict is available from this side of the room. The judgement, as ever, is yours.",
      },
    ],
    judgeSummary:
      "Six perspectives on the table. I summarise; I do not choose. The chair that matters is yours.",
    ruleLine: COURT_RULE,
    convenerId: "pam",
  };
}
