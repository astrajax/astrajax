/**
 * Two-route onboarding state machine — pure, headless-testable.
 *
 * Drives the opening choice, both routes, and Ruth's convergence state.
 * No React, no DOM: the components are thin drivers over this. The two
 * routes are VERB-LED and carry NO maturity judgement; the user may switch
 * route any time before confirmation without losing progress.
 */

import type {
  ConfirmationChoice,
  GapQuestion,
  OnboardingEvidence,
  SourcePackFile,
} from "./evidence-contract";

export type RouteId = "bring-material" | "talk-through";

export type OnboardingStep =
  | "choice"
  // Route A
  | "a-envelope"
  | "a-source-pack"
  | "a-extraction"
  | "a-gap-questions"
  // Route B
  | "b-probing"
  | "b-supporting-file"
  // Convergence
  | "convergence"
  | "receipt";

export const ROUTE_A_STEPS: readonly OnboardingStep[] = [
  "a-envelope",
  "a-source-pack",
  "a-extraction",
  "a-gap-questions",
  "convergence",
  "receipt",
];

export const ROUTE_B_STEPS: readonly OnboardingStep[] = [
  "b-probing",
  "b-supporting-file",
  "convergence",
  "receipt",
];

export const ROUTE_LABELS: Record<RouteId, { verb: string; bestWhen: string }> = {
  "bring-material": {
    verb: "Bring your material",
    bestWhen: "Best when your documents already exist.",
  },
  "talk-through": {
    verb: "Talk it through",
    bestWhen: "Best when it mostly lives in your head.",
  },
};

/** Route B probing bounds: 12–16 questions, visible progress, early stop. */
export const PROBE_MIN = 12;
export const PROBE_MAX = 16;

export type OnboardingState = {
  step: OnboardingStep;
  /** null until a route is chosen; the choice itself never judges maturity. */
  route: RouteId | null;
  /** Route A */
  files: SourcePackFile[];
  gapAnswers: Record<string, string>;
  /** Route B */
  probeAnswers: Record<string, string>;
  probeIndex: number;
  probeStoppedEarly: boolean;
  supportingFile: SourcePackFile | null;
  /** Convergence: per-field Confirm / Correct / Leave open + corrections. */
  confirmations: Record<string, ConfirmationChoice>;
  corrections: Record<string, string>;
  accepted: boolean;
};

export function initialOnboardingState(evidence: OnboardingEvidence): OnboardingState {
  return {
    step: "choice",
    route: null,
    files: evidence.initialFiles,
    gapAnswers: {},
    probeAnswers: {},
    probeIndex: 0,
    probeStoppedEarly: false,
    supportingFile: null,
    confirmations: {},
    corrections: {},
    accepted: false,
  };
}

/**
 * Choose a route, or SWITCH it before confirmation. Switching preserves all
 * answers already given on either route — no progress is lost. The route
 * never carries a maturity judgement; it only picks the screen sequence.
 */
export function chooseRoute(state: OnboardingState, route: RouteId): OnboardingState {
  // Cannot switch once the draft is accepted.
  if (state.accepted) return state;
  const firstStep = route === "bring-material" ? ROUTE_A_STEPS[0] : ROUTE_B_STEPS[0];
  return { ...state, route, step: firstStep };
}

/** True while the user may still switch route without losing progress. */
export function canSwitchRoute(state: OnboardingState): boolean {
  return !state.accepted;
}

export function nextStep(state: OnboardingState): OnboardingState {
  const seq = state.route === "bring-material" ? ROUTE_A_STEPS : ROUTE_B_STEPS;
  const idx = seq.indexOf(state.step);
  if (idx < 0 || idx >= seq.length - 1) return state;
  return { ...state, step: seq[idx + 1] };
}

export function backStep(state: OnboardingState): OnboardingState {
  const seq = state.route === "bring-material" ? ROUTE_A_STEPS : ROUTE_B_STEPS;
  const idx = seq.indexOf(state.step);
  if (idx <= 0) {
    // Before the first route step → back to the opening choice (progress kept).
    return { ...state, step: "choice", route: null };
  }
  return { ...state, step: seq[idx - 1] };
}

// ── Route A ────────────────────────────────────────────────────────────────

export function stageFile(state: OnboardingState, file: SourcePackFile): OnboardingState {
  const files = state.files.some((f) => f.id === file.id)
    ? state.files.map((f) => (f.id === file.id ? file : f))
    : [...state.files, file];
  return { ...state, files };
}

export function answerGap(state: OnboardingState, questionId: string, answer: string): OnboardingState {
  return { ...state, gapAnswers: { ...state.gapAnswers, [questionId]: answer } };
}

// ── Route B ────────────────────────────────────────────────────────────────

export function answerProbe(
  state: OnboardingState,
  questionId: string,
  answer: string,
): OnboardingState {
  return {
    ...state,
    probeAnswers: { ...state.probeAnswers, [questionId]: answer },
    probeIndex: state.probeIndex + 1,
  };
}

/** Early stop is always available; the user confirms whatever is captured. */
export function stopProbingEarly(state: OnboardingState): OnboardingState {
  return { ...state, probeStoppedEarly: true, step: "b-supporting-file" };
}

export function probeProgress(state: OnboardingState, total: number): {
  answered: number;
  total: number;
  /** Progress as a 0..1 fraction for the visible bar. */
  fraction: number;
} {
  const answered = Object.keys(state.probeAnswers).filter((k) => state.probeAnswers[k].trim()).length;
  return { answered, total, fraction: total === 0 ? 0 : Math.min(1, answered / total) };
}

// ── Convergence ────────────────────────────────────────────────────────────

export function setConfirmation(
  state: OnboardingState,
  fieldKey: string,
  choice: ConfirmationChoice,
): OnboardingState {
  return { ...state, confirmations: { ...state.confirmations, [fieldKey]: choice } };
}

export function setCorrection(state: OnboardingState, fieldKey: string, text: string): OnboardingState {
  return { ...state, corrections: { ...state.corrections, [fieldKey]: text } };
}

/**
 * Every provisional field must have a decision (Confirm / Correct / Leave
 * open) before the single "Accept as draft" action is enabled — Ruth's
 * Human Confirmation is explicit per item, never blanket.
 */
export function canAcceptDraft(state: OnboardingState, evidence: OnboardingEvidence): boolean {
  if (state.accepted) return false;
  return evidence.provisional.fields.every((f) => {
    const c = state.confirmations[f.key];
    if (!c) return false;
    // "correct" requires correction text so the correction is captured.
    if (c === "correct") return Boolean(state.corrections[f.key]?.trim());
    return true;
  });
}

export function acceptAsDraft(state: OnboardingState, evidence: OnboardingEvidence): OnboardingState {
  if (!canAcceptDraft(state, evidence)) return state;
  return { ...state, accepted: true, step: "receipt" };
}

/** The questions for the current route's conversation (Route A gap / Route B probe). */
export function activeQuestions(state: OnboardingState, evidence: OnboardingEvidence): GapQuestion[] {
  return state.route === "bring-material" ? evidence.gapQuestions : evidence.probeQuestions;
}
