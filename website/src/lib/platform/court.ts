import type { PaperTrailLine } from "./brain-health";

export type CourtRoleId =
  | "clive"
  | "pam"
  | "doc"
  | "lazlo"
  | "clive-man"
  | "kate"
  | "halvard"
  | "milo"
  | "judge";

/** Everyone who can take a seat on the bench. The Judge is not an
 * attendant — he presides over every session and cannot be seated,
 * swapped, or removed. */
export type CourtAttendantId = Exclude<CourtRoleId, "judge">;

export const COURT_ATTENDANT_POOL: CourtAttendantId[] = [
  "clive",
  "pam",
  "doc",
  "lazlo",
  "clive-man",
  "kate",
  "halvard",
  "milo",
];

/** The standard bench — prefilled at intake; any seat can be swapped for
 * another perspective from the pool. */
export const DEFAULT_BENCH: CourtAttendantId[] = [
  "clive",
  "pam",
  "doc",
  "lazlo",
  "clive-man",
];

export const BENCH_SEATS = 5;

/** Court miniatures — oval-masked layers seated inside the painted gilt
 * frames (the artwork ships with blank frames; the cast are layers). */
export const COURT_PORTRAIT_SRC: Record<CourtAttendantId, string> = {
  clive: "/agent-cast/court/portraits/clive.webp",
  pam: "/agent-cast/court/portraits/pam.webp",
  doc: "/agent-cast/court/portraits/doc.webp",
  lazlo: "/agent-cast/court/portraits/lazlo.webp",
  "clive-man": "/agent-cast/court/portraits/clive-man.webp",
  kate: "/agent-cast/court/portraits/kate.webp",
  halvard: "/agent-cast/court/portraits/halvard.webp",
  milo: "/agent-cast/court/portraits/milo.webp",
};

/** The Judge's breathing loop and its frame-zero poster. Two encodes of
 * the same 8s loop: VP9 WebM first, H.264 MP4 for older Safari, which
 * cannot play VP9 — without the pair he simply stops breathing there.
 * The poster doubles as the reduced-motion still. */
export const COURT_JUDGE_MEDIA = {
  webm: "/agent-cast/court/court-judge.webm",
  mp4: "/agent-cast/court/court-judge.mp4",
  poster: "/agent-cast/court/court-judge-poster.png",
} as const;

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

export type CourtVerdict =
  | "Approve"
  | "Strong approve"
  | "Disapprove"
  | "Strong disapprove"
  | "LOVE"
  | "HATE";

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
  /** Who sits this session, in seat order (top of the page downward). */
  attendees: CourtAttendantId[];
  roles: CourtRole[];
  takes: CourtTake[];
  dialogue: CourtDialogueTurn[];
  judgeSummary: string;
  ruleLine: string;
  convenerId: CourtRoleId;
}

export const COURT_RULE =
  "The Court surfaces perspectives; the human gives judgement.";

export interface CourtBookPosition {
  x: number;
  y: number;
}

export interface CourtBookSlot extends CourtBookPosition {
  width: number;
  height: number;
}

/**
 * Left/right page zones on the 16:9 court book stage. Measured once from
 * the blank-book art (parchment inset after binding, spine edge). Overlays
 * anchor to these boxes — not magic x% nudges on the full stage.
 */
export const COURT_PAGE_ZONES = {
  leftPageInset: 7.4,
  leftPageEnd: 48.1,
  rightPageStart: 52,
} as const;

/**
 * Scene manifest for the blank court book (art v2, July 2026).
 *
 * Portrait column is centred in the left-page grid (CSS). Seats keep
 * opening dimensions for frame-ring masks; strip boxes stay at stage %
 * measured on the art grid (7 Jul 2026).
 */
export interface CourtBookSeat {
  /** Painted opening width — portrait layer and ring mask sizing. */
  width: number;
  height: number;
  /** Vertical centre of this seat's painted verdict strip. */
  slotY: number;
}

export const COURT_BOOK_LAYOUT = {
  /** The five attendant seats, top of the page downward. */
  seats: [
    { width: 4.44, height: 9.1, slotY: 13.1 },
    { width: 4.4, height: 9.15, slotY: 27.59 },
    { width: 4.44, height: 9.0, slotY: 41.81 },
    { width: 4.4, height: 9.0, slotY: 56.06 },
    { width: 4.36, height: 8.85, slotY: 70.32 },
  ] as CourtBookSeat[],
  /** The Judge's frame — fixed, never seated by choice. */
  judgeSeat: { width: 4.31, height: 8.95, slotY: 84.8 } as CourtBookSeat,
  /** How far a portrait layer overdraws its opening (each side), giving
   * the frame-ring window a rim to cover. */
  portraitOvershoot: { width: 0.31, height: 0.4 },
  /** A frame's full gilt extent — the ring-window box, and the hotspot. */
  portraitHotspot: { width: 7.6, height: 13.4 },
  /** The breathing-judge video layer: masked to its own interior oval and
   * sized so that oval fills the painted opening (video is 176×240; its
   * interior occupies ~60%×65% of the clip). */
  judgeVideo: { width: 5.7, height: 13.8 },
  /** Bench verdict strips — shared x/width/height; y = each seat's slotY. */
  slot: { x: 13.3, width: 24.8, height: 8.6 },
  /** The Judge's strip is painted wider than the bench strips. */
  judgeSlot: { x: 13.3, width: 27.1, height: 8.6 },
  /** The written record flows above the brass; content ends clear of the
   * plaque's top edge so live text never sits under the metal. */
  rightPageContent: { left: 54, top: 7, width: 36, height: 60 },
  /** The wide brass plaque. Box = the full ornament (for the hotspot and
   * glow — the hit area and light should cover the whole gilt casting).
   * The engraved word centres on plaqueFace, the recessed wood-grain
   * panel measured directly on a fine grid (x 62.8-79.6, y 77.3-84.1) —
   * not the ornament's own centre, which the crest ornament above pulls
   * upward from the true engravable surface. */
  plaque: { x: 55.0, y: 72.8, width: 34.95, height: 20.55 },
  plaqueFace: { x: 62.8, width: 16.8, height: 6.8, y: 77.3 },
} as const;

export const COURT_ROLES: CourtRole[] = [
  {
    id: "clive",
    name: "Clive Wigglesworth",
    title: "Upside and adoption",
    portraitSrc: COURT_PORTRAIT_SRC.clive,
    focus: "Will people actually use this, and does it make the brain feel helpful?",
  },
  {
    id: "pam",
    name: "Pam Portiscue",
    title: "Risk and weak assumptions",
    portraitSrc: COURT_PORTRAIT_SRC.pam,
    focus: "What could go wrong if we trust this too early?",
  },
  {
    id: "doc",
    name: "Doc Albright",
    title: "Implementation cost and action readiness",
    portraitSrc: COURT_PORTRAIT_SRC.doc,
    focus: "Can we execute cleanly after judgement, with a paper trail?",
  },
  {
    id: "lazlo",
    name: "Lazlo Marlowe",
    title: "Dramaturg's eye",
    portraitSrc: COURT_PORTRAIT_SRC.lazlo,
    focus: "Does this hold together as a story humans will believe?",
  },
  {
    id: "clive-man",
    name: "Clive's Man",
    title: "Keeper of the record",
    portraitSrc: COURT_PORTRAIT_SRC["clive-man"],
    focus: "What does the record actually say, and what will it say afterwards?",
  },
  {
    id: "kate",
    name: "Kate",
    title: "Scenic workshop — craft and reversibility",
    portraitSrc: COURT_PORTRAIT_SRC.kate,
    focus: "Does this hold together as built, and can we undo it if we are wrong?",
  },
  {
    id: "halvard",
    name: "Dr. Halvard Bjornson",
    title: "Fleet health — diagnosis, never surgery",
    portraitSrc: COURT_PORTRAIT_SRC.halvard,
    focus: "What is being pretended, and what small symptom should be named while it is small?",
  },
  {
    id: "milo",
    name: "Milo Cadence",
    title: "Timecraft — tempo and the moment",
    portraitSrc: COURT_PORTRAIT_SRC.milo,
    focus: "Is this the right moment, and what tempo does the change need to land?",
  },
  {
    id: "judge",
    name: "The Judge",
    title: "Summarises; does not decide",
    focus: "Weighs the perspectives for the human; abstains from the final call.",
  },
];

/** Each attendant's opening question when the Court convenes — used by
 * conveneMatter to build the session's opening exchange for whoever is
 * actually seated. */
const OPENING_LINES: Record<CourtAttendantId, string> = {
  clive:
    "The upside first, as is proper. If this works, what does it make possible for the humans involved? That is the question I shall hold while the bench does its work.",
  pam: "And I shall hold the other one. What is the weakest assumption underneath it, and what happens if that assumption is wrong? Evidence before enthusiasm.",
  lazlo:
    "And I will ask how it lands as a story. Stakeholders hear narratives, not specifications. If the story this tells is the wrong one, the specification will not save it.",
  "clive-man":
    "I will want to know what precedent this sets and how the record will hold it. Precision now saves second-guessing later.",
  doc: "When judgement is recorded, I will name the cost of acting on it: effort, risk, and what gets retired. Not before.",
  kate: "And I will ask what would actually be built. Show me the seam, show me the rollback, show me the first cut. A matter that cannot name its smallest testable slice is not ready for my bench.",
  halvard:
    "My question is the quiet one. What is this decision pretending is fine, and what will it cost the ones who must live inside it? Small things said early stay small.",
  milo: "And I will keep the time. Is this the right moment, what tempo does the change want, and where will it stall mid-beat? A right decision at the wrong tempo still falls over.",
};

export const DEFAULT_COURT_DECISION: CourtDecision = {
  id: "court-discount-guardrail",
  title: "Approve the off-script discount guardrail for trusted context?",
  context:
    "Regional managers want reps to move faster on trusted accounts. Clive drafted a guardrail that allows a 10% off-script discount when two conditions are met: account tier is Gold+ and RM pre-approves in the brain log.",
  stakes:
    "High stakes: this becomes approved context agents will cite. Wrong guardrails propagate into live sales conversations and pricing claims.",
  attendees: DEFAULT_BENCH,
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

export function conveneMatter(
  matter: CourtMatter,
  attendees: CourtAttendantId[] = DEFAULT_BENCH,
): CourtDecision {
  // Pam convenes when seated (it is her habit); otherwise the first seat.
  const convenerId: CourtAttendantId = attendees.includes("pam")
    ? "pam"
    : attendees[0];
  const cleanTitle = matter.title.replace(/[.?!]+$/, "");

  const conveningLine: CourtDialogueTurn = {
    roleId: convenerId,
    line:
      convenerId === "pam"
        ? `The Court is in session. The matter before the bench: "${cleanTitle}". This door is always open, but it is not a casual one. I convene; I do not preside.`
        : `The Court is in session. The matter before the bench: "${cleanTitle}". I convene; I do not preside. The bench will frame its questions.`,
  };

  // After convening, every attendee states their question in seat order —
  // the convener included (convening and questioning are different acts).
  const openings: CourtDialogueTurn[] = attendees.map((id) => ({
    roleId: id,
    line: OPENING_LINES[id],
  }));

  return {
    id: `court-matter-${Date.now()}`,
    title: matter.title,
    context: matter.context,
    stakes: matter.stakes,
    attendees,
    roles: COURT_ROLES,
    takes: [],
    dialogue: [
      conveningLine,
      ...openings,
      {
        roleId: "judge",
        line: "The bench has framed its questions. No verdict is available from this side of the room. The judgement, as ever, is yours.",
      },
    ],
    judgeSummary:
      "The bench has spoken. I summarise; I do not choose. The chair that matters is yours.",
    ruleLine: COURT_RULE,
    convenerId,
  };
}
