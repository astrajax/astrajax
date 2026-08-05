import type { LoopStep } from "@/lib/aie-demo/types";
import type { CliveReaction } from "@/lib/clive/video-reactions";

/**
 * Beat-scoped reaction dramaturgy — the study's staging notes as data.
 *
 * Design intent (build pack W2, Matthew's rollback flag honoured):
 * - The reaction ENGINE is untouched: clip set, hard cuts (no crossfade),
 *   and the ambient playback rate stay as shipped — that slowness is the
 *   approved feel. Listen (chat entry) uses warm-welcome at 0.8.
 * - Every mapping below is one line. Taste adjustment = delete a line.
 *   Full rollback = revert the wiring commit; the components fall back to
 *   their previous behaviour with no residue.
 * - `pleased` is RESERVED for decision moments. It previously fired on
 *   every assistant reply, which dulled it; a reaction that always plays
 *   is scenery, not acting.
 */

/**
 * Fired once when a loop beat begins. Pam's beats give Clive body language:
 * he glances toward her corner when she takes the floor, and the sniff test
 * on his drafts earns a weighted sigh — his Dream reacting to her Remote,
 * per the cast lanes.
 */
export const BEAT_ENTRY_REACTIONS: Partial<Record<LoopStep, CliveReaction>> = {
  pam_challenge: "glance",
  truth_approval: "sigh",
};

/** The moments the whole loop argues for — pleased lands here and only here. */
export type DecisionMoment =
  | "human_approved"
  | "doc_filed"
  | "access_granted"
  | "proposal_confirmed";

export const DECISION_REACTIONS: Record<DecisionMoment, CliveReaction> = {
  human_approved: "pleased",
  doc_filed: "pleased",
  access_granted: "pleased",
  proposal_confirmed: "pleased",
};

/** Listening stays instant and universal for Clive's own conversations. */
export function userMessageReaction(persona: "clive" | "pam"): CliveReaction | null {
  return persona === "clive" ? "listen" : null;
}

/** The thinking tilt stays — it reads as attention, not repetition. */
export function thinkingReaction(persona: "clive" | "pam"): CliveReaction | null {
  return persona === "clive" ? "think" : null;
}

/**
 * Routine assistant replies no longer trigger a reaction — Clive holds his
 * seated attention while speaking, and holds still while Pam speaks. Returns
 * null by design; kept as a function so a beat-specific exception is a
 * one-line change here rather than a component edit.
 */
export function assistantReplyReaction(
  _persona: "clive" | "pam",
  _step?: LoopStep,
): CliveReaction | null {
  return null;
}
