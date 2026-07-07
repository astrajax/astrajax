import type { IntakeAnswer, UserBrainIntake } from "./types";
import { INTAKE_QUESTIONS } from "./user-brain-intake";

/**
 * The Architect intake as an AGENDA rather than a script: the seven things
 * Clive needs to learn, each with an approved plain-words explainer he can
 * offer when the user asks what a question means. The content is
 * deterministic; the AI delivers it conversationally
 * (/api/chapter1/intake-chat). The scripted flow in user-brain-intake.ts
 * remains the booth-safe fallback and shares field ids with this agenda.
 */

export type CapturedField =
  | "name"
  | "role"
  | "businessSector"
  | "devExperience"
  | "aiComfort"
  | "contextFamiliarity"
  | "goal";

export const CAPTURED_FIELDS: CapturedField[] = [
  "name",
  "role",
  "businessSector",
  "devExperience",
  "aiComfort",
  "contextFamiliarity",
  "goal",
];

export type CapturedIntakeFields = Partial<Record<CapturedField, string>>;

export type IntakeAgendaItem = {
  field: CapturedField;
  questionId: string;
  goal: string;
  explainer: string;
};

export const INTAKE_AGENDA: IntakeAgendaItem[] = [
  {
    field: "name",
    questionId: "name",
    goal: "What to call them.",
    explainer: "Just what I should call you — a name or nickname is plenty.",
  },
  {
    field: "role",
    questionId: "role",
    goal: "What they actually do day to day, in their own words.",
    explainer:
      "Your job in plain words — what you're actually responsible for day to day, whatever the title says.",
  },
  {
    field: "businessSector",
    questionId: "business_sector",
    goal: "The kind of business and which corner of it they own.",
    explainer:
      "What sort of business you're in, and your corner of it — sales, ops, product, marketing, the whole thing if it's yours. 'Ops' or 'a startup I'm building' is a perfectly good answer.",
  },
  {
    field: "devExperience",
    questionId: "dev_experience",
    goal: "Their honest development or system-architecture starting point.",
    explainer:
      "Development means building software or designing how systems fit together. Never touched it? That's a perfectly good answer — plenty of architects here build with AI instead of code.",
  },
  {
    field: "aiComfort",
    questionId: "ai_comfort",
    goal: "How much they actually use AI tools today.",
    explainer:
      "How much you actually use AI tools — things like ChatGPT or Claude — in a normal week. From 'never' to 'constantly' — honesty beats polish.",
  },
  {
    field: "contextFamiliarity",
    questionId: "context_familiarity",
    goal: "Whether governed context systems are familiar territory.",
    explainer:
      "Context systems are the structured memory agents draw on — approved facts, sources, definitions, kept clean. 'Never heard of them' is an honest and useful answer.",
  },
  {
    field: "goal",
    questionId: "goal",
    goal: "The one thing they most want from this.",
    explainer: "Your number one hope for this — in plain words, one line is fine.",
  },
];

const FIELD_MAX_LENGTH: Record<CapturedField, number> = {
  name: 120,
  role: 300,
  businessSector: 300,
  devExperience: 300,
  aiComfort: 300,
  contextFamiliarity: 300,
  goal: 300,
};

/**
 * Merge a model-supplied `captured` object into an existing capture,
 * accepting only known fields with non-empty string values. Latest wins.
 */
export function mergeCaptured(
  base: CapturedIntakeFields,
  incoming: unknown,
): CapturedIntakeFields {
  const next: CapturedIntakeFields = { ...base };
  if (typeof incoming !== "object" || incoming === null) return next;
  for (const field of CAPTURED_FIELDS) {
    const value = (incoming as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      next[field] = value.trim().slice(0, FIELD_MAX_LENGTH[field]);
    }
  }
  return next;
}

/** Index into INTAKE_QUESTIONS of the first question whose field is not yet
 * captured; INTAKE_QUESTIONS.length when the agenda is fully covered. */
export function firstUncoveredIndex(captured: CapturedIntakeFields): number {
  for (let i = 0; i < INTAKE_QUESTIONS.length; i++) {
    if (!captured[INTAKE_QUESTIONS[i].field as CapturedField]?.trim()) return i;
  }
  return INTAKE_QUESTIONS.length;
}

/** Rebuild rawAnswers from captured fields, keyed to the scripted questions,
 * so downstream consumers (classifier prompt, Workshop save, transcript
 * restore) see the same shape either engine produces. */
export function rawAnswersFromCaptured(captured: CapturedIntakeFields): IntakeAnswer[] {
  const answers: IntakeAnswer[] = [];
  for (const question of INTAKE_QUESTIONS) {
    const value = captured[question.field as CapturedField];
    if (value?.trim()) {
      answers.push({ questionId: question.id, question: question.text, answer: value.trim() });
    }
  }
  return answers;
}

/**
 * Bridge a running AI capture into the scripted engine's intake shape —
 * questionIndex points at the first uncovered question, so the scripted
 * fallback resumes exactly where the conversation left off.
 */
export function intakeFromCaptured(captured: CapturedIntakeFields): UserBrainIntake {
  return {
    ...captured,
    rawAnswers: rawAnswersFromCaptured(captured),
    questionIndex: firstUncoveredIndex(captured),
  };
}
