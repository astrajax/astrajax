/**
 * @vitest-environment jsdom
 *
 * The two-route onboarding state machine — opening choice, both routes,
 * switching without loss, and Ruth's convergence state (V1.0.0 signatures).
 */
import { describe, expect, it } from "vitest";
import {
  acceptAsDraft,
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
  canAddFile,
  stageFile,
  stopProbingEarly,
} from "./machine";

const INF_IDS = ["inf_role_v1", "inf_competency_v1"];

describe("onboarding state machine", () => {
  it("opens on the choice with no maturity judgement and two verb-led routes", () => {
    const s = initialOnboardingState();
    expect(s.step).toBe("choice");
    expect(s.route).toBeNull();
  });

  it("route A sequence: envelope → source pack → extraction → gap questions → convergence", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
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
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    expect(s.step).toBe("b-probing");
    s = nextStep(s);
    expect(s.step).toBe("b-supporting-file");
    s = nextStep(s);
    expect(s.step).toBe("convergence");
  });

  it("switching route before confirmation preserves answers (no progress lost)", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    s = answerProbe(s, "q1", "I lead field sales");
    s = chooseRoute(s, "bring-material");
    expect(s.route).toBe("bring-material");
    expect(s.probeAnswers.q1).toBe("I lead field sales");
    s = chooseRoute(s, "talk-through");
    expect(s.probeAnswers.q1).toBe("I lead field sales");
  });

  it("back from the first route step returns to choice, keeping progress", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
    s = answerGap(s, "g1", "pricing sign-off");
    s = backStep(s);
    expect(s.step).toBe("choice");
    expect(s.route).toBeNull();
    expect(s.gapAnswers.g1).toBe("pricing sign-off");
  });

  it("Route B probing tracks visible progress against the cap", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    s = answerProbe(s, "q1", "answer one");
    s = answerProbe(s, "q2", "answer two");
    const p = probeProgress(s, 16);
    expect(p.answered).toBe(2);
    expect(p.total).toBe(16);
    expect(p.fraction).toBeCloseTo(2 / 16);
  });

  it("early stop moves to supporting file and records the stop", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    s = answerProbe(s, "q1", "answer");
    s = stopProbingEarly(s);
    expect(s.probeStoppedEarly).toBe(true);
    expect(s.step).toBe("b-supporting-file");
  });

  it("Route A stages files deterministically (upsert by id, no duplicates)", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
    s = stageFile(s, { id: "f-new", name: "extra.pdf", extension: ".pdf", sizeBytes: 1024 * 1024, state: "uploaded" });
    expect(s.files.length).toBe(1);
    s = stageFile(s, { id: "f-new", name: "extra.pdf", extension: ".pdf", sizeBytes: 1024 * 1024, state: "uploaded" });
    expect(s.files.length).toBe(1);
  });

  it("failed validation rows do not consume Source Pack file slots", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
    for (let i = 0; i < 5; i += 1) {
      s = stageFile(s, {
        id: `fail-${i}`,
        name: `bad-${i}.exe`,
        extension: ".exe",
        sizeBytes: 1024,
        state: "failed",
        error: "File type not allowed: .exe",
      });
    }
    expect(s.files.length).toBe(5);
    expect(canAddFile(s, 1024).ok).toBe(true);
  });

  it("Accept as draft is disabled until EVERY inference has a decision", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    expect(canAcceptDraft(s, INF_IDS)).toBe(false);
    for (const id of INF_IDS) {
      s = setConfirmation(s, id, "confirm");
    }
    expect(canAcceptDraft(s, INF_IDS)).toBe(true);
  });

  it("a 'correct' decision requires correction text", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    s = setConfirmation(s, "inf_role_v1", "correct");
    s = setConfirmation(s, "inf_competency_v1", "confirm");
    expect(canAcceptDraft(s, INF_IDS)).toBe(false);
    s = setCorrection(s, "inf_role_v1", "Commercial Director");
    expect(canAcceptDraft(s, INF_IDS)).toBe(true);
  });

  it("Accept as draft lands on the receipt and locks further switching", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    for (const id of INF_IDS) {
      s = setConfirmation(s, id, "confirm");
    }
    s = acceptAsDraft(s);
    expect(s.accepted).toBe(true);
    expect(s.step).toBe("receipt");
    expect(canSwitchRoute(s)).toBe(false);
    const s2 = chooseRoute(s, "bring-material");
    expect(s2.route).toBe("talk-through");
  });
});
