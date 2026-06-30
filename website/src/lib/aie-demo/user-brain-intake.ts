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
    text: "How would you describe your development or system architecture experience — non-coder who builds with AI, comfortable designing systems without writing code, or hands-on engineer?",
    required: true,
  },
  {
    id: "ai_comfort",
    field: "aiComfort",
    text: "How comfortable are you working with AI — cautious newcomer, daily user, or already deep in it?",
    required: true,
  },
  {
    id: "context_familiarity",
    field: "contextFamiliarity",
    text: "How familiar are you with context systems or operating layers — the structured memory agents draw from?",
    required: true,
  },
  {
    id: "goal",
    field: "goal",
    text: "Optional last one: what are you trying to build or improve right now? (Say skip if you'd rather not.)",
    required: false,
    placeholder: "Your goal, or type skip",
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

function isSkipAnswer(answer: string): boolean {
  const lower = answer.trim().toLowerCase();
  return lower === "skip" || lower === "n/a" || lower === "none" || lower === "no";
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
  if (question.id === "goal" && isSkipAnswer(answer)) {
    return "No problem — we can leave that open.";
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
  const storedAnswer = question.required || !isSkipAnswer(trimmed) ? trimmed : "";

  const rawAnswers: IntakeAnswer[] = [
    ...intake.rawAnswers,
    { questionId: question.id, question: question.text, answer: storedAnswer || trimmed },
  ];

  const fieldValue =
    question.field === "goal" && isSkipAnswer(trimmed) ? undefined : trimmed || undefined;

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
  return null;
}

export function inferProfileFromIntake(intake: UserBrainIntake): {
  profileId: string;
  summary: string;
  reasoning: string;
} {
  const scores: Record<string, number> = {
    "commercial-new-context": 0,
    "balanced-leader": 0,
    "systems-expert": 0,
  };

  const ai = (intake.aiComfort ?? "").toLowerCase();
  const ctx = (intake.contextFamiliarity ?? "").toLowerCase();
  const dev = (intake.devExperience ?? "").toLowerCase();
  const role = (intake.role ?? "").toLowerCase();
  const goal = (intake.goal ?? "").toLowerCase();

  if (
    ai.includes("new") ||
    ai.includes("cautious") ||
    ai.includes("uncomfortable") ||
    ai.includes("beginner") ||
    ai.includes("never")
  ) {
    scores["commercial-new-context"] += 2;
  }
  if (
    ai.includes("comfortable") ||
    ai.includes("daily") ||
    ai.includes("regular") ||
    ai.includes("use it")
  ) {
    scores["balanced-leader"] += 2;
  }
  if (ai.includes("expert") || ai.includes("deep") || ai.includes("build") || ai.includes("ship")) {
    scores["systems-expert"] += 2;
    scores["balanced-leader"] += 1;
  }

  if (
    ctx.includes("new") ||
    ctx.includes("never") ||
    ctx.includes("unfamiliar") ||
    ctx.includes("heard of") ||
    ctx.includes("no idea")
  ) {
    scores["commercial-new-context"] += 3;
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
    dev.includes("non-coder") ||
    dev.includes("no code") ||
    dev.includes("don't code") ||
    dev.includes("dont code") ||
    dev.includes("never code") ||
    dev.includes("build with ai") ||
    dev.includes("ai-assisted") ||
    dev.includes("not technical")
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
    role.includes("sales") ||
    role.includes("commercial") ||
    role.includes("revenue") ||
    role.includes("account") ||
    role.includes("ops") ||
    role.includes("operations")
  ) {
    scores["commercial-new-context"] += 1;
    scores["balanced-leader"] += 1;
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
    Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "balanced-leader";
  const profile = getProfileById(profileId)!;
  const name = intake.name?.trim() || "you";

  const reasoning = [
    intake.role && `Role: ${intake.role}`,
    intake.devExperience && `Dev / architecture: ${intake.devExperience}`,
    intake.aiComfort && `AI comfort: ${intake.aiComfort}`,
    intake.contextFamiliarity && `Context familiarity: ${intake.contextFamiliarity}`,
    intake.goal && `Goal: ${intake.goal}`,
  ]
    .filter(Boolean)
    .join(". ");

  const summary = `Here's what I heard, ${name}: ${reasoning}. From that, I'm placing you as "${profile.label}" — ${profile.cliveTone}`;

  return { profileId, summary, reasoning };
}

export function buildIntakeSummaryCard(intake: UserBrainIntake, profile: UserBrainProfile): {
  headline: string;
  lines: string[];
  profileLabel: string;
} {
  const name = intake.name?.trim() || "You";
  const lines = [
    intake.role && `Role: ${intake.role}`,
    intake.devExperience && `Dev / architecture: ${intake.devExperience}`,
    intake.aiComfort && `AI comfort: ${intake.aiComfort}`,
    intake.contextFamiliarity && `Context systems: ${intake.contextFamiliarity}`,
    intake.goal && `Building toward: ${intake.goal}`,
  ].filter(Boolean) as string[];

  return {
    headline: `Here's what I heard, ${name}`,
    lines,
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
