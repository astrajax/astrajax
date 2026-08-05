/**
 * Contextual reaction selection + non-interruption contract — the policy
 * half of Clive's video player, extracted so it can be tested headless.
 *
 * The contract (Matthew's addendum, 5 Aug 2026):
 *
 * - A reaction clip NEVER interrupts another non-idle clip: no scripted
 *   transition, no speaking clip, no arbitrary playClip clip, and no
 *   reaction already in progress.
 * - Priority: scripted / welcome / speaking clip > a currently playing
 *   reaction/action clip > a queued contextual reaction > the idle reel.
 * - At most ONE queued cue (the latest relevant); no accumulating queue.
 * - Queued cues carry a short relevance TTL — a cue that has gone stale,
 *   or whose page state/turn has moved on, is dropped, never played.
 * - New cues never reset currentTime and never cut while a protected clip
 *   is active.
 * - Rate-limited: one reaction per assistant turn, plus a cooldown, so he
 *   doesn't twitch theatrically through a conversation.
 * - Reduced motion: no cues, no queue — the poster holds.
 *
 * This module is pure: no DOM, no video element, no timers owned here. The
 * component (`CliveVideoStage`) is the driver — it reports player phase and
 * wall-clock time, the policy decides, and the driver acts on `play` once
 * the protected clip ends naturally.
 */

import type { CliveReaction } from "@/lib/clive/video-reactions";

/** Player phases as the contract orders them. */
export type PlayerPhase =
  /** Idle reel or the ambient idle loop — interruptible. */
  | "idle"
  /** A contextual reaction currently playing — protected. */
  | "reaction"
  /** An arbitrary playClip clip — protected. */
  | "clip"
  /** Scripted state-change / welcome / speaking clip — most protected. */
  | "scripted";

/** What the policy tells the driver to do with an incoming cue. */
export type CueDecision =
  | { kind: "play-now" }
  | { kind: "queue" }
  | { kind: "drop"; reason: string };

export type ReactionQueueState = {
  /** The single coalesced cue, if any. */
  queued: CliveReaction | null;
  /** Wall-clock ms when the current queued cue was offered (for TTL). */
  queuedAt: number;
  /** Wall-clock ms when the last reaction actually started (cooldown). */
  lastPlayedAt: number;
  /** The turn token the queue belongs to (cleared on turn/page change). */
  turnToken: string | null;
};

export const initialReactionQueueState = (): ReactionQueueState => ({
  queued: null,
  queuedAt: 0,
  lastPlayedAt: 0,
  turnToken: null,
});

/** ms a queued cue stays relevant. Past this it drops, never plays. */
export const REACTION_QUEUE_TTL_MS = 4000;

/** ms between the starts of two reactions — the anti-twitch cooldown. */
export const REACTION_COOLDOWN_MS = 2500;

/**
 * Decide what to do with an incoming contextual cue.
 *
 * The cue allowlist is enforced upstream at the type level (the cue is a
 * typed `CliveReaction`, never a path/URL). Here we enforce interruption
 * and rate limits. `prefersReducedMotion` short-circuits everything.
 */
export function decideCue(opts: {
  reaction: CliveReaction;
  phase: PlayerPhase;
  state: ReactionQueueState;
  now: number;
  turnToken: string | null;
  prefersReducedMotion: boolean;
}): CueDecision {
  const { reaction, phase, state, now, turnToken, prefersReducedMotion } = opts;

  if (prefersReducedMotion) return { kind: "drop", reason: "reduced-motion" };

  // One reaction per assistant turn: a cue identical to one already queued
  // for this same turn is a no-op (it IS the single coalesced cue).
  if (state.queued === reaction && state.turnToken === turnToken) {
    return { kind: "drop", reason: "same-cue-already-queued" };
  }

  // Cooldown: if a reaction only just started, don't even queue the next —
  // a twitch that would fire the instant the current one ends. The exception
  // is when nothing is playing (idle), where the cooldown still applies but
  // via the queue path below.
  const inCooldown = now - state.lastPlayedAt < REACTION_COOLDOWN_MS;

  if (phase === "idle") {
    if (inCooldown) {
      // Don't fire immediately after the last one; hold as the single queue.
      return { kind: "queue" };
    }
    return { kind: "play-now" };
  }

  // Any protected phase (reaction / clip / scripted): never cut. Coalesce
  // into the single latest-relevant queue slot.
  return { kind: "queue" };
}

/**
 * On a protected clip's NATURAL end, choose the next thing to play.
 * Returns the queued reaction only if it's still relevant (TTL + same
 * turn); otherwise null — the driver returns to idle/idle reel.
 */
export function nextAfterNaturalEnd(opts: {
  state: ReactionQueueState;
  now: number;
  turnToken: string | null;
  prefersReducedMotion: boolean;
}): CliveReaction | null {
  const { state, now, turnToken, prefersReducedMotion } = opts;
  if (prefersReducedMotion) return null;
  if (!state.queued) return null;
  if (state.turnToken !== turnToken) return null;
  if (now - state.queuedAt > REACTION_QUEUE_TTL_MS) return null;
  return state.queued;
}

/** Is a queued cue still relevant right now? (For the driver's sanity.) */
export function queuedCueValid(
  state: ReactionQueueState,
  now: number,
  turnToken: string | null,
): boolean {
  return (
    state.queued !== null &&
    state.turnToken === turnToken &&
    now - state.queuedAt <= REACTION_QUEUE_TTL_MS
  );
}
