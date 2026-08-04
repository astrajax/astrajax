import { describe, expect, it } from "vitest";
import { resolveEnterDestination } from "./enter-routing";
import { initialOperatorState, type OperatorState } from "./operator-state";

const identity = { operatorId: "op_matthew", email: "matthew@example.com" };

function fresh(): OperatorState {
  return initialOperatorState({
    operatorId: identity.operatorId,
    email: identity.email,
    now: "2026-08-04T12:00:00.000Z",
  });
}

function settled(): OperatorState {
  return {
    ...fresh(),
    journey: null,
    ownedBrainSlugs: ["matthew-user-brain"],
    configuredFunctions: ["study", "court"],
    introducedMembers: ["clive", "pam"],
    lastSafeDestination: "/house",
  };
}

describe("resolveEnterDestination — the five §2 hierarchy cases", () => {
  it("case 1: no verified identity → visitor at /", () => {
    const dest = resolveEnterDestination({
      identity: null,
      state: null,
      showroomRequested: false,
    });
    expect(dest).toEqual({ kind: "visitor", path: "/" });
  });

  it("case 2: explicit showroom request → showroom, signed in or not", () => {
    for (const id of [null, identity]) {
      const dest = resolveEnterDestination({
        identity: id,
        state: id ? settled() : null,
        showroomRequested: true,
      });
      expect(dest.kind).toBe("showroom");
    }
  });

  it("case 3: verified identity + incomplete setup → resume journey at current chapter/step", () => {
    const state = fresh();
    state.journey = { chapter: 2, step: "mine-sources", completedChapters: [1] };
    const dest = resolveEnterDestination({
      identity,
      state,
      showroomRequested: false,
    });
    expect(dest).toMatchObject({ kind: "journey", chapter: 2, step: "mine-sources" });
    expect(dest.path).toBe("/chapter-2?step=mine-sources");
  });

  it("case 4: verified identity + minimum usable household → the House", () => {
    const dest = resolveEnterDestination({
      identity,
      state: settled(),
      showroomRequested: false,
    });
    expect(dest).toEqual({ kind: "house", path: "/house" });
  });

  it("case 5a: verified identity with missing state → explicit recovery, never a guess", () => {
    const dest = resolveEnterDestination({
      identity,
      state: null,
      showroomRequested: false,
    });
    expect(dest.kind).toBe("recovery");
  });

  it("case 5b: contradictory state (current chapter also completed) → recovery with named reasons", () => {
    const state = fresh();
    state.journey = { chapter: 1, step: "start", completedChapters: [1] };
    const dest = resolveEnterDestination({
      identity,
      state,
      showroomRequested: false,
    });
    expect(dest.kind).toBe("recovery");
    if (dest.kind === "recovery") {
      expect(dest.reasons.join(" ")).toContain("chapter 1");
    }
  });

  it("case 5c: journey marked complete but nothing configured → recovery, not the House", () => {
    const state = fresh();
    state.journey = null; // claims completion
    const dest = resolveEnterDestination({
      identity,
      state,
      showroomRequested: false,
    });
    expect(dest.kind).toBe("recovery");
  });
});

describe("guardrails", () => {
  it("'brain exists' alone never routes to the House", () => {
    const state = fresh(); // journey in progress, mid-chapter-1
    state.ownedBrainSlugs = ["matthew-user-brain"]; // brain exists…
    const dest = resolveEnterDestination({
      identity,
      state,
      showroomRequested: false,
    });
    // …but routing follows journey position, not brain existence.
    expect(dest.kind).toBe("journey");
  });

  it("a brain owned by someone else grants nothing to an anonymous visitor", () => {
    // The routing function cannot even express registry-wide brain facts:
    // its input is per-operator state behind a verified identity. An
    // unauthenticated visitor with no identity is a visitor, full stop.
    const dest = resolveEnterDestination({
      identity: null,
      state: settled(), // even a (wrongly supplied) rich state changes nothing
      showroomRequested: false,
    });
    expect(dest).toEqual({ kind: "visitor", path: "/" });
  });

  it("a brand-new operator lands on chapter 1's welcome book, not the bare step path", () => {
    const dest = resolveEnterDestination({
      identity,
      state: fresh(),
      showroomRequested: false,
    });
    expect(dest).toMatchObject({ kind: "journey", chapter: 1 });
    expect(dest.path).toBe("/chapter-1?book=welcome");
  });

  it("a server-authored resume URL for the current chapter wins over the generic path", () => {
    const state = fresh();
    state.journey = { chapter: 1, step: "draft-truths", completedChapters: [] };
    state.lastSafeDestination = "/chapter-1?book=the-ledger&resume=1";
    const dest = resolveEnterDestination({ identity, state, showroomRequested: false });
    expect(dest.path).toBe("/chapter-1?book=the-ledger&resume=1");
  });

  it("a stale resume URL from another chapter is ignored", () => {
    const state = fresh();
    state.journey = { chapter: 2, step: "mine-sources", completedChapters: [1] };
    state.lastSafeDestination = "/chapter-1?book=the-ledger&resume=1";
    const dest = resolveEnterDestination({ identity, state, showroomRequested: false });
    expect(dest.path).toBe("/chapter-2?step=mine-sources");
  });

  it("cleared-cookie / new-device resume: same server state → same destination", () => {
    const state = fresh();
    state.journey = { chapter: 3, step: "meet-doc", completedChapters: [1, 2] };
    const first = resolveEnterDestination({ identity, state, showroomRequested: false });
    const second = resolveEnterDestination({ identity, state, showroomRequested: false });
    expect(second).toEqual(first);
    expect(first.path).toBe("/chapter-3?step=meet-doc");
  });
});
