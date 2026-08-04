/**
 * The state contract — IA Build Brief §2 (docs/initiatives/ia-three-modes-build-plan.md).
 *
 * Authoritative, server-side operator state: the six facts that routing and
 * the House's four room predicates read from. Device-local storage may
 * accelerate the experience; it must never decide identity or completion.
 */

import type { CourtRoleId } from "./court";

/** Operator roles. `internal` unlocks back-of-house (/dispatch, /deploy, /fleet, /command). */
export type OperatorRole = "owner" | "member" | "internal";

/** Journey chapters shipped or planned (§5). */
export type JourneyChapter = 1 | 2 | 3;

export interface JourneyPosition {
  chapter: JourneyChapter;
  /** Free-form step id owned by the chapter's own step machine. */
  step: string;
  completedChapters: JourneyChapter[];
}

/**
 * Household functions a room can depend on. Mirrors the room registry's
 * `configured` predicate source — rooms consume this, never re-derive it.
 */
export type HouseholdFunctionId =
  | "study"
  | "court"
  | "brain-vault"
  | "receiving-wall"
  | "workshop"
  | "lodge"
  | "physician"
  | "coach";

/**
 * The six authoritative facts (§2), bound to one operator.
 *
 * NOTE deliberately absent: any registry-wide "brain exists" fact.
 * "Brain exists" alone is never a routing fact — a registry brain may belong
 * to another operator; an unauthenticated visitor also has no brain.
 */
export interface OperatorState {
  operatorId: string;
  email: string;
  /** Fact 5 — permissions. */
  role: OperatorRole;
  /** Fact 1 — current journey chapter and step. Null once setup is complete and journey retired. */
  journey: JourneyPosition | null;
  /** Fact 2 — brain IDs (slugs) owned by this operator. */
  ownedBrainSlugs: string[];
  /** Fact 3 — configured household functions. */
  configuredFunctions: HouseholdFunctionId[];
  /** Fact 4 — household members the curriculum has introduced. */
  introducedMembers: CourtRoleId[];
  /** Fact 6 — last known-good destination, for recovery and resume. */
  lastSafeDestination: string | null;
  updatedAt: string;
}

/**
 * "Minimum usable household configured" (§2 hierarchy case 4): the operator
 * has finished enough setup that the House is their daily front door.
 * Study is the floor — Clive is the daily entry. Deliberately conservative;
 * widening this is a product decision, not a refactor.
 */
export function hasMinimumUsableHousehold(state: OperatorState): boolean {
  return (
    state.configuredFunctions.includes("study") &&
    state.ownedBrainSlugs.length > 0 &&
    state.journey === null
  );
}

/**
 * Contradiction check (§2 hierarchy case 5). A contradictory state must
 * yield an explicit recovery choice — never a confident guess.
 */
export function findStateContradictions(state: OperatorState): string[] {
  const problems: string[] = [];
  if (state.journey !== null && state.journey.completedChapters.includes(state.journey.chapter)) {
    problems.push(
      `journey chapter ${state.journey.chapter} is both current and completed`,
    );
  }
  if (state.journey === null && state.configuredFunctions.length === 0) {
    problems.push("journey complete but no household function configured");
  }
  if (state.configuredFunctions.length > 0 && state.ownedBrainSlugs.length === 0 && state.journey === null) {
    problems.push("household configured but operator owns no brain");
  }
  return problems;
}

/** Fresh state written at first sign-in, before Chapter 1 begins. */
export function initialOperatorState(input: {
  operatorId: string;
  email: string;
  role?: OperatorRole;
  now?: string;
}): OperatorState {
  return {
    operatorId: input.operatorId,
    email: input.email,
    role: input.role ?? "owner",
    journey: { chapter: 1, step: "start", completedChapters: [] },
    ownedBrainSlugs: [],
    configuredFunctions: [],
    introducedMembers: [],
    lastSafeDestination: null,
    updatedAt: input.now ?? new Date().toISOString(),
  };
}
