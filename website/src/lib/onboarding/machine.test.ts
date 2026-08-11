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
  canAddFile,
  canContinueSourcePack,
  canContinueSupportingFile,
  canSwitchRoute,
  chooseRoute,
  initialOnboardingState,
  nextStep,
  probeProgress,
  setConfirmation,
  setCorrection,
  sourcePackContinueLabel,
  sourcePackLimitsSummary,
  SOURCE_PACK_LIMITS,
  stageFile,
  stopProbingEarly,
  supportingFileContinueLabel,
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

  it("batch add cannot exceed the 50 MiB total when validated against a working snapshot", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
    const chunk = 20 * 1024 * 1024;
    let working = s.files;
    const accepted: number[] = [];
    for (const size of [chunk, chunk, chunk]) {
      const check = canAddFile({ ...s, files: working }, size);
      if (!check.ok) break;
      const staged = {
        id: `f-${accepted.length}`,
        name: `big-${accepted.length}.pdf`,
        extension: ".pdf",
        sizeBytes: size,
        state: "uploading" as const,
      };
      working = [...working, staged];
      accepted.push(size);
    }
    expect(accepted.length).toBe(2);
    expect(working.reduce((sum, f) => sum + f.sizeBytes, 0)).toBeLessThanOrEqual(
      SOURCE_PACK_LIMITS.maxBytesTotal,
    );
  });

  it("Route A continue is blocked while uploading or failed", () => {
    let s = chooseRoute(initialOnboardingState(), "bring-material");
    expect(canContinueSourcePack(s)).toBe(false);
    expect(sourcePackContinueLabel(s)).toBe("Add files to continue");

    s = stageFile(s, {
      id: "f1",
      name: "a.pdf",
      extension: ".pdf",
      sizeBytes: 100,
      state: "uploading",
    });
    expect(canContinueSourcePack(s)).toBe(false);
    expect(sourcePackContinueLabel(s)).toBe("Uploading…");

    s = stageFile(s, {
      id: "f1",
      name: "a.pdf",
      extension: ".pdf",
      sizeBytes: 100,
      state: "failed",
      error: "server",
    });
    expect(canContinueSourcePack(s)).toBe(false);
    expect(sourcePackContinueLabel(s)).toBe("Fix failed uploads to continue");

    s = stageFile(s, {
      id: "f1",
      name: "a.pdf",
      extension: ".pdf",
      sizeBytes: 100,
      state: "uploaded",
      blobUrl: "https://example.private.blob.vercel-storage.com/x",
    });
    expect(canContinueSourcePack(s)).toBe(true);
    expect(sourcePackContinueLabel(s)).toBe("See what Clive found");
  });

  it("Route B continue is blocked when the supporting file failed", () => {
    let s = chooseRoute(initialOnboardingState(), "talk-through");
    expect(canContinueSupportingFile(s)).toBe(true);
    expect(supportingFileContinueLabel(s)).toBe("See what Clive has drafted");

    s = {
      ...s,
      supportingFile: {
        id: "sf1",
        name: "note.pdf",
        extension: ".pdf",
        sizeBytes: 100,
        state: "failed",
        error: "upload failed",
      },
    };
    expect(canContinueSupportingFile(s)).toBe(false);
    expect(supportingFileContinueLabel(s)).toBe("Fix failed uploads to continue");

    s = {
      ...s,
      supportingFile: {
        id: "sf1",
        name: "note.pdf",
        extension: ".pdf",
        sizeBytes: 100,
        state: "uploaded",
        blobUrl: "https://example.private.blob.vercel-storage.com/y",
      },
    };
    expect(canContinueSupportingFile(s)).toBe(true);
  });

  it("Source Pack limits summary reads from the single SOURCE_PACK_LIMITS source", () => {
    expect(sourcePackLimitsSummary()).toBe("Up to 5 files · 50 MB total · 20 MB each.");
    expect(SOURCE_PACK_LIMITS.uploadPrefix).toBe("onboarding-uploads/");
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
