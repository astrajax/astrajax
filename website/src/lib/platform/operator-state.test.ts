import { describe, expect, it } from "vitest";
import {
  findStateContradictions,
  hasMinimumUsableHousehold,
  initialOperatorState,
  type OperatorState,
} from "./operator-state";

function base(overrides: Partial<OperatorState> = {}): OperatorState {
  return {
    ...initialOperatorState({
      operatorId: "op_test",
      email: "matthew@example.com",
      now: "2026-08-05T10:00:00.000Z",
    }),
    ...overrides,
  };
}

describe("initialOperatorState", () => {
  it("seeds chapter 1 with a welcome-book resume URL and owner role by default", () => {
    const state = initialOperatorState({
      operatorId: "op_matthew",
      email: "matthew@astrajax.com",
      now: "2026-08-05T10:00:00.000Z",
    });

    expect(state.role).toBe("owner");
    expect(state.journey).toEqual({ chapter: 1, step: "start", completedChapters: [] });
    expect(state.lastSafeDestination).toBe("/chapter-1?book=welcome");
    expect(state.ownedBrainSlugs).toEqual([]);
    expect(state.configuredFunctions).toEqual([]);
    expect(state.updatedAt).toBe("2026-08-05T10:00:00.000Z");
  });

  it("honours an explicit role override", () => {
    expect(
      initialOperatorState({
        operatorId: "op_internal",
        email: "ops@astrajax.com",
        role: "internal",
      }).role,
    ).toBe("internal");
  });
});

describe("hasMinimumUsableHousehold", () => {
  it("requires study, at least one owned brain, and a retired journey", () => {
    expect(
      hasMinimumUsableHousehold(
        base({
          journey: null,
          ownedBrainSlugs: ["matthew-user-brain"],
          configuredFunctions: ["study", "court"],
        }),
      ),
    ).toBe(true);
  });

  it("rejects when study is missing, journey is still open, or no brain is owned", () => {
    expect(
      hasMinimumUsableHousehold(
        base({
          journey: null,
          ownedBrainSlugs: ["matthew-user-brain"],
          configuredFunctions: ["court"],
        }),
      ),
    ).toBe(false);

    expect(
      hasMinimumUsableHousehold(
        base({
          journey: { chapter: 1, step: "start", completedChapters: [] },
          ownedBrainSlugs: ["matthew-user-brain"],
          configuredFunctions: ["study"],
        }),
      ),
    ).toBe(false);

    expect(
      hasMinimumUsableHousehold(
        base({
          journey: null,
          ownedBrainSlugs: [],
          configuredFunctions: ["study"],
        }),
      ),
    ).toBe(false);
  });
});

describe("findStateContradictions", () => {
  it("flags a chapter that is both current and completed", () => {
    const problems = findStateContradictions(
      base({
        journey: { chapter: 2, step: "mine", completedChapters: [1, 2] },
      }),
    );
    expect(problems.some((p) => p.includes("chapter 2"))).toBe(true);
  });

  it("flags journey-complete with nothing configured", () => {
    const problems = findStateContradictions(
      base({ journey: null, configuredFunctions: [], ownedBrainSlugs: [] }),
    );
    expect(problems).toContain("journey complete but no household function configured");
  });

  it("flags a configured household with no owned brain once the journey is retired", () => {
    const problems = findStateContradictions(
      base({
        journey: null,
        configuredFunctions: ["study"],
        ownedBrainSlugs: [],
      }),
    );
    expect(problems).toContain("household configured but operator owns no brain");
  });

  it("returns no problems for a coherent mid-journey or settled household", () => {
    expect(
      findStateContradictions(
        base({
          journey: { chapter: 1, step: "start", completedChapters: [] },
          ownedBrainSlugs: ["matthew-user-brain"],
        }),
      ),
    ).toEqual([]);

    expect(
      findStateContradictions(
        base({
          journey: null,
          ownedBrainSlugs: ["matthew-user-brain"],
          configuredFunctions: ["study"],
        }),
      ),
    ).toEqual([]);
  });
});
