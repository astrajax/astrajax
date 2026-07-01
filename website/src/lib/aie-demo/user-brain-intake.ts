import { USER_BRAIN_PROFILES } from "./demo-data";
import type { IntakeAnswer, UserBrainIntake, UserBrainProfile } from "./types";

export const INTAKE_STORAGE_KEY = "astrajax-chapter1-loop-v1";

export type IntakeQuestion = {
  id: string;
  field: keyof Pick<
    UserBrainIntake,
    "name" | "role" | "devExperience" | "aiComfort" | "contextFamiliarity" | "goal"
  >;
  text: string;
  required: boolean;
  placeholder?: string;
};

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "name",
    field: "name",
    text: "First things first — what should I call you?",
    required: true,
  },
  {
    id: "role",
    field: "role",
    text: "What's your role, and what are you actually responsible for day to day?",
    required: true,
  },
  {
    id: "dev_experience",
    field: "devExperience",
    text: "What's your development or system architecture experience? Be honest if you're starting from zero — non-coder who builds with AI, designs systems without writing code, hands-on engineer, or none of that yet.",
    required: true,
  },
  {
    id: "ai_comfort",
    field: "aiComfort",
    text: "How comfortable are you working with AI? It's fine to say you've never really used it — or you're a cautious newcomer, daily user, or already deep in it.",
    required: true,
  },
  {
    id: "context_familiarity",
    field: "contextFamiliarity",
    text: "How familiar are you with context systems or operating layers — the structured memory agents draw from? No shame in 'never heard of it' or 'starting from scratch'.",
    required: true,
  },
  {
    id: "goal",
    field: "goal",
    text: "Last one — what's your number one goal here?",
    required: true,
    placeholder: "Your top priority on this journey",
  },
];

export const USER_BRAIN_INTAKE_GREETING =
  "Before I calibrate pace and tone, I need a few things from you — typed answers, not a multiple-choice quiz. It is not a scorecard, and it is not surveillance.";

export function createEmptyIntake(): UserBrainIntake {
  return {
    rawAnswers: [],
    questionIndex: 0,
  };
}

export function getProfileById(profileId: string): UserBrainProfile | undefined {
  return USER_BRAIN_PROFILES.find((profile) => profile.id === profileId);
}

const ZERO_EXPERIENCE_SIGNALS = [
  "never",
  "nothing",
  "no experience",
  "no exp",
  "haven't",
  "havent",
  "brand new",
  "starting from scratch",
  "starting from zero",
  "from zero",
  "from scratch",
  "zero",
  "not used",
  "don't use",
  "dont use",
  "do not use",
  "no idea",
  "first time",
  "complete beginner",
  "total beginner",
  "not familiar",
  "unfamiliar",
  "heard of it",
  "never heard",
  "none yet",
  "none of that",
  "don't know",
  "dont know",
  "no clue",
  "not yet",
  "just starting",
  "new to",
  "newbie",
  "newcomer",
  "beginner",
];

const SKIP_ANSWER_PATTERN = /^(skip|pass|n\/a|na|none|\.|\?+)$/i;

const CONFUSED_ANSWER_PHRASES = [
  "what is that",
  "what's that",
  "what is this",
  "whats that",
  "what is ai",
  "what's ai",
  "idk",
  "dunno",
  "no idea",
  "not sure",
  "don't understand",
  "dont understand",
  "confused",
  "huh",
];

function isConfusedAnswer(text: string): boolean {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (SKIP_ANSWER_PATTERN.test(lower)) return true;
  if (trimmed.length <= 2 && lower !== "ok") return true;
  if (/^(what|how|why|where|when|huh)\b/.test(lower) && lower.includes("?")) return true;
  if (CONFUSED_ANSWER_PHRASES.some((phrase) => lower === phrase || lower.startsWith(`${phrase} `))) {
    return true;
  }

  return false;
}

function isZeroOrConfused(text?: string): boolean {
  if (!text?.trim()) return true;
  const lower = text.trim().toLowerCase();
  if (isConfusedAnswer(text)) return true;
  return matchesAny(lower, ZERO_EXPERIENCE_SIGNALS);
}

function hasPositiveAiExperience(text?: string): boolean {
  if (!text?.trim()) return false;
  const lower = text.trim().toLowerCase();
  if (isZeroOrConfused(text)) return false;

  return (
    lower.includes("comfortable") ||
    lower.includes("daily") ||
    lower.includes("regular") ||
    lower.includes("use it") ||
    lower.includes("using it") ||
    lower.includes("chatgpt") ||
    lower.includes("copilot") ||
    lower.includes("claude") ||
    lower.includes("deep") ||
    lower.includes("expert") ||
    lower.includes("ship") ||
    lower.includes("build with ai")
  );
}

function hasSubstantiveRole(text?: string): boolean {
  if (!text?.trim()) return false;
  const trimmed = text.trim();
  if (isZeroOrConfused(trimmed)) return false;
  return trimmed.length >= 8;
}

function normalizeGoalPhrase(goal: string): string {
  const g = goal.trim().replace(/\.$/, "");
  if (!g) return g;
  if (/^[A-Z]{2,}/.test(g)) return g;
  return g.charAt(0).toLowerCase() + g.slice(1);
}

export function synthesizeHeuristicSummary(intake: UserBrainIntake, profile: UserBrainProfile): string {
  const name = intake.name?.trim() || "you";
  const goal = intake.goal?.trim();

  let experienceSentence: string;
  switch (profile.id) {
    case "starting-fresh":
      experienceSentence = `From what you've told me, ${name}, you're at the beginning of the AI and context-systems journey — no pretence needed, and we'll build up from honest basics.`;
      break;
    case "commercial-new-context":
      experienceSentence = `${name}, you bring real commercial or operational judgement, and governed context systems are the newer territory — I'll keep architecture plain and approval gates visible.`;
      break;
    case "balanced-leader":
      experienceSentence = `You're leading where AI is already familiar, ${name}, and you want context handled properly for your team — I'll match that pace.`;
      break;
    case "systems-expert":
      experienceSentence = `${name}, you're comfortable in the weeds on systems and architecture — I'll stay peer-level and skip the hand-holding.`;
      break;
    default:
      experienceSentence = `I've got a read on where you're starting, ${name}.`;
  }

  if (!goal) return experienceSentence;

  return `${experienceSentence} What matters most to you right now is ${normalizeGoalPhrase(goal)}.`;
}

function matchesAny(text: string, signals: string[]): boolean {
  return signals.some((signal) => text.includes(signal));
}

export function buildIntakeTranscript(intake: UserBrainIntake): { role: "user" | "assistant"; content: string }[] {
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "assistant", content: `${USER_BRAIN_INTAKE_GREETING}\n\n${INTAKE_QUESTIONS[0].text}` },
  ];

  for (let i = 0; i < intake.rawAnswers.length; i++) {
    const answer = intake.rawAnswers[i];
    messages.push({ role: "user", content: answer.answer });

    const nextQuestion = INTAKE_QUESTIONS[i + 1];
    if (nextQuestion) {
      messages.push({
        role: "assistant",
        content: `${acknowledgeAnswer(INTAKE_QUESTIONS[i], answer.answer, intake.name)} ${nextQuestion.text}`,
      });
    }
  }

  if (intake.intakeComplete && intake.classificationSummary) {
    messages.push({
      role: "assistant",
      content: intake.classificationSummary,
    });
  }

  return messages;
}

function acknowledgeAnswer(question: IntakeQuestion, answer: string, name?: string): string {
  if (question.id === "name") {
    const trimmed = answer.trim();
    return trimmed ? `Good to meet you, ${trimmed}.` : "Noted.";
  }
  if (question.id === "goal") {
    return "Got it — that gives me a north star.";
  }
  if (question.id === "role") {
    return "Clear — that helps.";
  }
  if (question.id === "dev_experience") {
    return "Good to know.";
  }
  if (question.id === "ai_comfort") {
    return "Understood.";
  }
  if (question.id === "context_familiarity") {
    return name ? `Thank you, ${name}.` : "Thank you.";
  }
  return "Noted.";
}

export function getNextAssistantMessage(
  intake: UserBrainIntake,
  latestAnswer: string,
  question: IntakeQuestion,
): string | null {
  const ack = acknowledgeAnswer(question, latestAnswer, intake.name ?? latestAnswer.trim());
  const nextIndex = intake.questionIndex + 1;

  if (nextIndex < INTAKE_QUESTIONS.length) {
    return `${ack} ${INTAKE_QUESTIONS[nextIndex].text}`;
  }

  return null;
}

export function applyIntakeAnswer(
  intake: UserBrainIntake,
  question: IntakeQuestion,
  answer: string,
): UserBrainIntake {
  const trimmed = answer.trim();

  const rawAnswers: IntakeAnswer[] = [
    ...intake.rawAnswers,
    { questionId: question.id, question: question.text, answer: trimmed },
  ];

  const fieldValue = trimmed || undefined;

  return {
    ...intake,
    rawAnswers,
    questionIndex: intake.questionIndex + 1,
    [question.field]: fieldValue,
  };
}

export function validateIntakeAnswer(question: IntakeQuestion, answer: string): string | null {
  const trimmed = answer.trim();
  if (!trimmed && question.required) {
    return "I'll need something here — even a short answer helps me calibrate.";
  }
  if (question.id === "name" && trimmed.length < 2) {
    return "Give me at least a name or nickname I can use.";
  }
  if (question.required && question.id !== "name") {
    if (isConfusedAnswer(trimmed)) {
      return "I need a real answer here — even 'starting from scratch' or 'never used it' helps me calibrate.";
    }
    if (trimmed.length < 4) {
      return "A bit more detail helps — even a few words on your honest starting point.";
    }
  }
  return null;
}

export function inferProfileFromIntake(intake: UserBrainIntake): {
  profileId: string;
  summary: string;
  reasoning: string;
} {
  const scores: Record<string, number> = {
    "starting-fresh": 0,
    "commercial-new-context": 0,
    "balanced-leader": 0,
    "systems-expert": 0,
  };

  const ai = (intake.aiComfort ?? "").toLowerCase();
  const ctx = (intake.contextFamiliarity ?? "").toLowerCase();
  const dev = (intake.devExperience ?? "").toLowerCase();
  const role = (intake.role ?? "").toLowerCase();
  const goal = (intake.goal ?? "").toLowerCase();

  const aiZeroSignals = isZeroOrConfused(intake.aiComfort) || ai.includes("cautious newcomer");
  const ctxZeroSignals = isZeroOrConfused(intake.contextFamiliarity);
  const devZeroSignals = isZeroOrConfused(intake.devExperience);
  const zeroFieldCount = [aiZeroSignals, ctxZeroSignals, devZeroSignals].filter(Boolean).length;

  if (zeroFieldCount >= 2) {
    scores["starting-fresh"] += 10;
  }
  if (aiZeroSignals) {
    scores["starting-fresh"] += 3;
  }
  if (ctxZeroSignals) {
    scores["starting-fresh"] += 3;
  }
  if (devZeroSignals) {
    scores["starting-fresh"] += 2;
  }
  if (aiZeroSignals && ctxZeroSignals) {
    scores["starting-fresh"] += 4;
  }
  if (aiZeroSignals && ctxZeroSignals && devZeroSignals) {
    scores["starting-fresh"] += 3;
  }

  const aiPositive = hasPositiveAiExperience(intake.aiComfort);

  if (aiPositive) {
    scores["balanced-leader"] += 2;
    if (!ctxZeroSignals) {
      scores["commercial-new-context"] += 1;
    }
  }
  if (aiPositive && (ai.includes("expert") || ai.includes("deep") || ai.includes("ship"))) {
    scores["systems-expert"] += 2;
    scores["balanced-leader"] += 1;
  }

  if (aiPositive && ctxZeroSignals && !devZeroSignals && hasSubstantiveRole(intake.role)) {
    scores["commercial-new-context"] += 3;
  } else if (
    !ctxZeroSignals &&
    (ctx.includes("new to") ||
      ctx.includes("unfamiliar") ||
      ctx.includes("not familiar") ||
      ctx.includes("never heard"))
  ) {
    scores["commercial-new-context"] += 2;
  }
  if (
    ctx.includes("comfortable") ||
    ctx.includes("some") ||
    ctx.includes("basics") ||
    ctx.includes("notion") ||
    ctx.includes("wiki")
  ) {
    scores["balanced-leader"] += 2;
  }
  if (
    ctx.includes("expert") ||
    ctx.includes("architecture") ||
    ctx.includes("built") ||
    ctx.includes("operating layer") ||
    ctx.includes("governed")
  ) {
    scores["systems-expert"] += 3;
  }

  if (
    !devZeroSignals &&
    (dev.includes("non-coder") ||
      dev.includes("no code") ||
      dev.includes("don't code") ||
      dev.includes("dont code") ||
      dev.includes("never code") ||
      dev.includes("build with ai") ||
      dev.includes("ai-assisted") ||
      dev.includes("not technical"))
  ) {
    scores["commercial-new-context"] += 2;
    scores["balanced-leader"] += 1;
  }
  if (
    dev.includes("design") ||
    dev.includes("spec") ||
    dev.includes("schema") ||
    dev.includes("without writing") ||
    dev.includes("without code") ||
    dev.includes("systems thinking")
  ) {
    scores["balanced-leader"] += 2;
  }
  if (
    dev.includes("engineer") ||
    dev.includes("developer") ||
    dev.includes("hands-on") ||
    dev.includes("write code") ||
    dev.includes("ship code") ||
    dev.includes("software") ||
    dev.includes("platform architect")
  ) {
    scores["systems-expert"] += 3;
  }
  if (dev.includes("architecture") && !dev.includes("non-coder")) {
    scores["systems-expert"] += 2;
    scores["balanced-leader"] += 1;
  }

  if (
    role.includes("leader") ||
    role.includes("manager") ||
    role.includes("head") ||
    role.includes("director") ||
    role.includes("lead ")
  ) {
    scores["balanced-leader"] += 2;
  }
  if (
    role.includes("architect") ||
    role.includes("engineer") ||
    role.includes("platform") ||
    role.includes("systems") ||
    role.includes("developer")
  ) {
    scores["systems-expert"] += 1;
  }
  if (
    hasSubstantiveRole(intake.role) &&
    (role.includes("sales") ||
      role.includes("commercial") ||
      role.includes("revenue") ||
      role.includes("account") ||
      role.includes("ops") ||
      role.includes("operations"))
  ) {
    if (aiPositive && !ctxZeroSignals) {
      scores["commercial-new-context"] += 2;
    }
    if (!aiZeroSignals) {
      scores["balanced-leader"] += 1;
    }
  }

  if (
    goal.includes("architecture") ||
    goal.includes("platform") ||
    goal.includes("agent") ||
    goal.includes("context system")
  ) {
    scores["systems-expert"] += 1;
  }

  const profileId =
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "starting-fresh";
  const profile = getProfileById(profileId)!;

  const reasoning =
    zeroFieldCount >= 2
      ? "Multiple zero or confused answers on AI, context, and experience — starting fresh."
      : aiPositive && ctxZeroSignals
        ? "Comfortable with AI but new to context systems."
        : profile.id === "systems-expert"
          ? "Strong systems or engineering signals."
          : "Heuristic classification from intake answers.";

  const summary = synthesizeHeuristicSummary(intake, profile);

  return { profileId, summary, reasoning };
}

export function buildIntakeSummaryCard(intake: UserBrainIntake, profile: UserBrainProfile): {
  headline: string;
  body: string;
  profileLabel: string;
} {
  const name = intake.name?.trim() || "You";
  const body =
    intake.classificationSummary?.trim() || synthesizeHeuristicSummary(intake, profile);

  return {
    headline: `Here's what I'm taking from this, ${name}`,
    body,
    profileLabel: profile.label,
  };
}

export type PersistedLoopSlice = Pick<
  import("./types").LoopState,
  "sessionId" | "userBrain" | "userBrainIntake" | "currentStep"
>;

export function loadPersistedLoopSlice(): Partial<PersistedLoopSlice> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INTAKE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedLoopSlice>;
  } catch {
    return null;
  }
}

export function persistLoopSlice(slice: PersistedLoopSlice): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(slice));
  } catch {
    // Private browsing or quota — ignore for v1
  }
}

export function clearPersistedLoopSlice(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(INTAKE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
