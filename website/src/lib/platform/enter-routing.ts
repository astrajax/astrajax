/**
 * The /enter routing hierarchy — IA Build Brief §2, implemented as a pure
 * function so every case is unit-testable. `/` NEVER performs this logic;
 * `/enter` is the only state-aware entrance.
 */

import {
  findStateContradictions,
  hasMinimumUsableHousehold,
  type OperatorState,
} from "./operator-state";

export type EnterDestination =
  | { kind: "visitor"; path: "/" }
  | { kind: "showroom"; path: "/showroom" }
  | { kind: "journey"; path: string; chapter: number; step: string }
  | { kind: "house"; path: "/house" }
  | { kind: "recovery"; path: "/enter/recover"; reasons: string[] };

export interface EnterInput {
  /** Verified identity from the server session — never from device storage. */
  identity: { operatorId: string; email: string } | null;
  /**
   * Authoritative server-side state for that operator, or null if no record
   * could be loaded. Null with a verified identity is a recovery case, not a
   * guess — first sign-in writes an initial state, so absence is anomalous.
   */
  state: OperatorState | null;
  /** Explicit showroom request (?mode=showroom on /enter, sales links, CTAs). */
  showroomRequested: boolean;
}

export function journeyPath(chapter: number, step: string): string {
  return `/chapter-${chapter}?step=${encodeURIComponent(step)}`;
}

export function resolveEnterDestination(input: EnterInput): EnterDestination {
  // 1. No verified identity → Visitor. (Showroom for anonymous visitors is
  // still explicit — case 2 — but identity-less non-showroom traffic never
  // gets guessed into the product.)
  if (!input.identity) {
    if (input.showroomRequested) return { kind: "showroom", path: "/showroom" };
    return { kind: "visitor", path: "/" };
  }

  // 2. Explicit showroom request wins over resume for signed-in operators too.
  if (input.showroomRequested) return { kind: "showroom", path: "/showroom" };

  // 5 (checked before 3/4 because both depend on trustworthy state):
  // missing or contradictory state → explicit recovery choice, never a guess.
  if (!input.state) {
    return {
      kind: "recovery",
      path: "/enter/recover",
      reasons: ["no operator state record found for a verified identity"],
    };
  }
  const contradictions = findStateContradictions(input.state);
  if (contradictions.length > 0) {
    return { kind: "recovery", path: "/enter/recover", reasons: contradictions };
  }

  // 4. Minimum usable household → the House.
  if (hasMinimumUsableHousehold(input.state)) {
    return { kind: "house", path: "/house" };
  }

  // 3. Verified identity + incomplete setup → resume the Journey exactly
  // where the server says the operator is.
  if (input.state.journey) {
    const { chapter, step } = input.state.journey;
    return {
      kind: "journey",
      path: journeyPath(chapter, step),
      chapter,
      step,
    };
  }

  // Journey null but household not minimally usable and not contradictory:
  // unreachable by construction (findStateContradictions covers it), but the
  // honest fallback is recovery, never a guess.
  return {
    kind: "recovery",
    path: "/enter/recover",
    reasons: ["journey complete but household below minimum usable configuration"],
  };
}
