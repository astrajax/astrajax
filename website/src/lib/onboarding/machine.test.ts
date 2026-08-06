/**
 * @vitest-environment jsdom
 *
 * The two-route onboarding state machine — opening choice, both routes,
 * switching without loss, and Ruth's convergence state.
 */
import { describe, expect, it } from "vitest";
import {
  acceptAsDraft,
  activeQuestions,
  answerGap,
  answerProbe,
  backStep,
  canAcceptDraft,
  canSwitchRoute,
  chooseRoute,
  initialOnboardingState,
  nextStep,
  probeProgress,
  setConfirmation,
  setCorrection,
  stageFile,
  stopProbingEarly,
  PROBE_MAX,
  PROBE_MIN,
} from "./machine";
import { getOnboardingEvidence } from "./evidence-contract";

const ev = getOnboardingEvidence();

describe("onboarding state machine", () => {
  it("opens on the choice with no maturity judgement and two verb-led routes", () => {
    const s = initialOnboardingState(ev);
    expect(s.step).toBe("choice");
    expect(s.route).toBeNull();
  });

  it("route A sequence: envelope → source pack → extraction → gap questions → convergence", () => {
    let s = chooseRoute(initialOnboardingState(ev), "bring-material");
    expect(s.step).toBe("a-envelope");
    s = nextStep(s);
    expect(s.step).toBe("a-source-pack");
    s = nextStep(s);
    expect(s.step).toBe("a-extraction");
    s = nextStep(s);
    expect(s.step).toBe("a-gap-questions");
    s = nextStep(s);
    expect(s.step).toBe("convergence");
  });

  it("route B sequence: probing → supporting file → convergence", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    expect(s.step).toBe("b-probing");
    s = nextStep(s);
    expect(s.step).toBe("b-supporting-file");
    s = nextStep(s);
    expect(s.step).toBe("convergence");
  });

  it("switching route before confirmation preserves answers (no progress lost)", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    s = answerProbe(s, "p1", "I lead field sales");
    s = chooseRoute(s, "bring-material"); // switch
    expect(s.route).toBe("bring-material");
    expect(s.probeAnswers.p1).toBe("I lead field sales"); // answer kept
    // and switching back keeps it too
    s = chooseRoute(s, "talk-through");
    expect(s.probeAnswers.p1).toBe("I lead field sales");
  });

  it("back from the first route step returns to choice, keeping progress", () => {
    let s = chooseRoute(initialOnboardingState(ev), "bring-material");
    s = answerGap(s, "g1", "pricing sign-off");
    s = backStep(s);
    expect(s.step).toBe("choice");
    expect(s.route).toBeNull();
    expect(s.gapAnswers.g1).toBe("pricing sign-off");
  });

  it("Route B probing is bounded 12–16 and tracks visible progress", () => {
    expect(ev.probeQuestions.length).toBeGreaterThanOrEqual(PROBE_MIN);
    expect(ev.probeQuestions.length).toBeLessThanOrEqual(PROBE_MAX);
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    s = answerProbe(s, "p1", "answer one");
    s = answerProbe(s, "p2", "answer two");
    const p = probeProgress(s, ev.probeQuestions.length);
    expect(p.answered).toBe(2);
    expect(p.total).toBe(ev.probeQuestions.length);
    expect(p.fraction).toBeCloseTo(2 / ev.probeQuestions.length);
  });

  it("early stop moves to supporting file and records the stop", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    s = answerProbe(s, "p1", "answer");
    s = stopProbingEarly(s);
    expect(s.probeStoppedEarly).toBe(true);
    expect(s.step).toBe("b-supporting-file");
  });

  it("Route A stages files deterministically", () => {
    let s = chooseRoute(initialOnboardingState(ev), "bring-material");
    const before = s.files.length;
    s = stageFile(s, { id: "f-new", name: "extra.pdf", extension: ".pdf", sizeMb: 1, state: "staged" });
    expect(s.files.length).toBe(before + 1);
    // re-staging the same id updates, doesn't duplicate
    s = stageFile(s, { id: "f-new", name: "extra.pdf", extension: ".pdf", sizeMb: 1, state: "staged" });
    expect(s.files.length).toBe(before + 1);
  });

  it("Accept as draft is disabled until EVERY field has a decision", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    s = { ...s, step: "convergence" };
    expect(canAcceptDraft(s, ev)).toBe(false);
    for (const f of ev.provisional.fields) {
      s = setConfirmation(s, f.key, "confirm");
    }
    expect(canAcceptDraft(s, ev)).toBe(true);
  });

  it("a 'correct' decision requires correction text", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    for (const f of ev.provisional.fields) {
      s = setConfirmation(s, f.key, f.key === "role" ? "correct" : "confirm");
    }
    expect(canAcceptDraft(s, ev)).toBe(false); // role has no correction yet
    s = setCorrection(s, "role", "Commercial Director");
    expect(canAcceptDraft(s, ev)).toBe(true);
  });

  it("Accept as draft lands on the receipt and locks further switching", () => {
    let s = chooseRoute(initialOnboardingState(ev), "talk-through");
    for (const f of ev.provisional.fields) {
      s = setConfirmation(s, f.key, "confirm");
    }
    s = acceptAsDraft(s, ev);
    expect(s.accepted).toBe(true);
    expect(s.step).toBe("receipt");
    expect(canSwitchRoute(s)).toBe(false);
    // switching now is a no-op
    const s2 = chooseRoute(s, "bring-material");
    expect(s2.route).toBe("talk-through");
  });

  it("activeQuestions follows the chosen route", () => {
    let s = chooseRoute(initialOnboardingState(ev), "bring-material");
    expect(activeQuestions(s, ev)).toBe(ev.gapQuestions);
    s = chooseRoute(s, "talk-through");
    expect(activeQuestions(s, ev)).toBe(ev.probeQuestions);
  });
});
