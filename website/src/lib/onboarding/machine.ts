/**
 * Two-route onboarding state machine — pure, headless-testable.
 *
 * Drives the opening choice, both routes, and Ruth's convergence state.
 * No React, no DOM: the components are thin drivers over this. The two
 * routes are VERB-LED and carry NO maturity judgement; the user may switch
 * route any time before confirmation without losing progress.
 */

import type { ConfirmationDecision } from "./contract-v1";

/** Shared confirmation decision (Ruth's Human Confirmation choices). */
export type ConfirmationChoice = ConfirmationDecision;

/** A file the user is staging into their Source Pack (UI-side staging state). */
export type SourcePackFile = {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
  state: "selecting" | "uploading" | "uploaded" | "failed";
  /** Vercel Blob URL — present only when state is "uploaded". */
  blobUrl?: string;
  /** Error message when state is "failed". */
  error?: string;
  /** Upload progress 0-100 (not always available). */
  progress?: number;
};

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

export function initialOnboardingState(files: SourcePackFile[] = []): OnboardingState {
  return {
    step: "choice",
    route: null,
    files,
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

export function updateFileState(
  state: OnboardingState,
  fileId: string,
  update: Partial<SourcePackFile>,
): OnboardingState {
  return {
    ...state,
    files: state.files.map((f) => (f.id === fileId ? { ...f, ...update } : f)),
  };
}

export function removeFile(state: OnboardingState, fileId: string): OnboardingState {
  return { ...state, files: state.files.filter((f) => f.id !== fileId) };
}

/** Ruth's Source Pack limits. */
export const SOURCE_PACK_LIMITS = {
  maxFiles: 5,
  maxBytesPerFile: 20 * 1024 * 1024, // 20 MiB
  maxBytesTotal: 50 * 1024 * 1024, // 50 MiB
  allowedExtensions: [".pdf", ".docx", ".xlsx", ".csv", ".md", ".txt"] as const,
};

export function canAddFile(state: OnboardingState, sizeBytes: number): { ok: boolean; reason?: string } {
  if (state.files.length >= SOURCE_PACK_LIMITS.maxFiles) {
    return { ok: false, reason: `Maximum ${SOURCE_PACK_LIMITS.maxFiles} files allowed` };
  }
  if (sizeBytes > SOURCE_PACK_LIMITS.maxBytesPerFile) {
    return { ok: false, reason: `File exceeds ${SOURCE_PACK_LIMITS.maxBytesPerFile / 1024 / 1024} MiB limit` };
  }
  const totalBytes = state.files.reduce((sum, f) => sum + f.sizeBytes, 0) + sizeBytes;
  if (totalBytes > SOURCE_PACK_LIMITS.maxBytesTotal) {
    return { ok: false, reason: `Would exceed ${SOURCE_PACK_LIMITS.maxBytesTotal / 1024 / 1024} MiB total limit` };
  }
  return { ok: true };
}

/** Returns true if all files are uploaded (none pending/uploading). */
export function allFilesUploaded(state: OnboardingState): boolean {
  return state.files.length > 0 && state.files.every((f) => f.state === "uploaded");
}

/** Returns true if any file is currently uploading. */
export function hasUploadingFiles(state: OnboardingState): boolean {
  return state.files.some((f) => f.state === "uploading");
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
 * Every provisional inference must have a decision (Confirm / Correct /
 * Leave open) before the single "Accept as draft" action is enabled — Ruth's
 * Human Confirmation is explicit per item and exact-version, never blanket.
 * The caller passes the proposed inference ids from the V1.0.0 fixture.
 */
export function canAcceptDraft(state: OnboardingState, inferenceIds: string[]): boolean {
  if (state.accepted) return false;
  if (inferenceIds.length === 0) return false;
  return inferenceIds.every((id) => {
    const c = state.confirmations[id];
    if (!c) return false;
    // "correct" requires correction text so the correction is captured.
    if (c === "correct") return Boolean(state.corrections[id]?.trim());
    return true;
  });
}

export function acceptAsDraft(state: OnboardingState): OnboardingState {
  return { ...state, accepted: true, step: "receipt" };
}
