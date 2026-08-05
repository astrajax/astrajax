/**
 * @vitest-environment jsdom
 *
 * The six non-interruption contract cases from Matthew's addendum
 * (5 Aug 2026), driven against the pure policy in ./reaction-queue.
 */
import { describe, expect, it } from "vitest";
import {
  decideCue,
  initialReactionQueueState,
  nextAfterNaturalEnd,
  queuedCueValid,
  REACTION_COOLDOWN_MS,
  REACTION_QUEUE_TTL_MS,
} from "./reaction-queue";

const TURN = "turn-1";

describe("reaction queue — non-interruption contract", () => {
  it("reaction while a reaction is active: never plays now, coalesces to the queue", () => {
    const state = initialReactionQueueState();
    state.lastPlayedAt = 10000; // current reaction started at t=10000

    const d = decideCue({
      reaction: "think",
      phase: "reaction",
      state,
      now: 11000, // past the cooldown, but a reaction is ACTIVE
      turnToken: TURN,
      prefersReducedMotion: false,
    });

    expect(d.kind).toBe("queue");
    expect(d.kind).not.toBe("play-now");
  });

  it("reaction while a scripted/welcome/speaking clip is active: queue, never cut", () => {
    const state = initialReactionQueueState();

    const d = decideCue({
      reaction: "happy",
      phase: "scripted",
      state,
      now: 50000,
      turnToken: TURN,
      prefersReducedMotion: false,
    });

    expect(d.kind).toBe("queue");
  });

  it("two cues during one protected clip: coalesce to ONE (the latest)", () => {
    let state = initialReactionQueueState();

    // First cue arrives mid-protected-clip → queue it
    const first = decideCue({
      reaction: "think",
      phase: "clip",
      state,
      now: 1000,
      turnToken: TURN,
      prefersReducedMotion: false,
    });
    expect(first.kind).toBe("queue");
    if (first.kind === "queue") {
      state = { ...state, queued: "think", queuedAt: 1000, turnToken: TURN };
    }

    // Second, different cue arrives still inside the same protected clip →
    // replaces the queued slot; we never hold two.
    const second = decideCue({
      reaction: "pleased",
      phase: "clip",
      state,
      now: 1500,
      turnToken: TURN,
      prefersReducedMotion: false,
    });
    expect(second.kind).toBe("queue");
    if (second.kind === "queue") {
      state = { ...state, queued: "pleased", queuedAt: 1500, turnToken: TURN };
    }

    // Only one cue is ever stored, and it's the latest relevant one.
    expect(state.queued).toBe("pleased");
  });

  it("stale queued cue drops on natural end (TTL expired) and returns to idle", () => {
    const state = initialReactionQueueState();
    state.queued = "think";
    state.queuedAt = 1000;
    state.turnToken = TURN;

    // Protected clip ends long after the cue went stale.
    const next = nextAfterNaturalEnd({
      state,
      now: 1000 + REACTION_QUEUE_TTL_MS + 1,
      turnToken: TURN,
      prefersReducedMotion: false,
    });

    expect(next).toBeNull();
    expect(queuedCueValid(state, 1000 + REACTION_QUEUE_TTL_MS + 1, TURN)).toBe(false);
  });

  it("reduced motion ignores the cue entirely — no play, no queue", () => {
    const state = initialReactionQueueState();

    const d = decideCue({
      reaction: "happy",
      phase: "idle",
      state,
      now: 5000,
      turnToken: TURN,
      prefersReducedMotion: true,
    });

    expect(d).toEqual({ kind: "drop", reason: "reduced-motion" });
    expect(nextAfterNaturalEnd({
      state: { ...state, queued: "happy", queuedAt: 5000, turnToken: TURN },
      now: 6000,
      turnToken: TURN,
      prefersReducedMotion: true,
    })).toBeNull();
  });

  it("a valid queued cue plays only after the protected clip's NATURAL end", () => {
    let state = initialReactionQueueState();

    // Cue arrives while a reaction is active → queue
    const d = decideCue({
      reaction: "think",
      phase: "reaction",
      state,
      now: 2000,
      turnToken: TURN,
      prefersReducedMotion: false,
    });
    expect(d.kind).toBe("queue");
    state = { ...state, queued: "think", queuedAt: 2000, turnToken: TURN };

    // While the protected clip is STILL playing, no cut happens.
    expect(queuedCueValid(state, 2500, TURN)).toBe(true);

    // On natural end within TTL + same turn → the cue plays once.
    const next = nextAfterNaturalEnd({
      state,
      now: 3000,
      turnToken: TURN,
      prefersReducedMotion: false,
    });
    expect(next).toBe("think");
  });

  it("a cue from a stale turn drops on natural end even within TTL", () => {
    const state = initialReactionQueueState();
    state.queued = "think";
    state.queuedAt = 1000;
    state.turnToken = "turn-old";

    const next = nextAfterNaturalEnd({
      state,
      now: 1500,
      turnToken: "turn-new", // page state/turn moved on
      prefersReducedMotion: false,
    });

    expect(next).toBeNull();
  });

  it("cooldown: idle phase but a reaction just started → queue, not play-now", () => {
    const state = initialReactionQueueState();
    state.lastPlayedAt = 10000;

    const d = decideCue({
      reaction: "sigh",
      phase: "idle",
      state,
      now: 10000 + REACTION_COOLDOWN_MS - 1,
      turnToken: TURN,
      prefersReducedMotion: false,
    });

    expect(d.kind).toBe("queue");
  });

  it("idle phase, no cooldown → play now", () => {
    const state = initialReactionQueueState();

    const d = decideCue({
      reaction: "glance",
      phase: "idle",
      state,
      now: 90000,
      turnToken: TURN,
      prefersReducedMotion: false,
    });

    expect(d.kind).toBe("play-now");
  });
});
