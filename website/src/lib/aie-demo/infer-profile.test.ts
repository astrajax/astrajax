import { describe, expect, it } from "vitest";
import { createEmptyIntake, inferProfileFromIntake } from "./user-brain-intake";
import type { UserBrainIntake } from "./types";

function intake(overrides: Partial<UserBrainIntake>): UserBrainIntake {
  return {
    ...createEmptyIntake(),
    ...overrides,
  };
}

describe("inferProfileFromIntake", () => {
  it("classifies multiple zero/confused signals as starting-fresh", () => {
    const result = inferProfileFromIntake(
      intake({
        aiComfort: "never used AI",
        contextFamiliarity: "no idea",
        devExperience: "starting from scratch",
      }),
    );

    expect(result.profileId).toBe("starting-fresh");
    expect(result.reasoning).toMatch(/starting fresh/i);
  });

  it("classifies AI-comfortable commercial operators new to context systems", () => {
    const result = inferProfileFromIntake(
      intake({
        name: "Sam",
        role: "Sales operator",
        businessSector: "revenue ops",
        aiComfort: "comfortable with ChatGPT for daily work",
        contextFamiliarity: "never heard of context systems",
        // Avoid "non-coder" / leadership words that also boost balanced-leader.
        devExperience: "build with AI, not technical",
        goal: "clean the ops layer before agents",
      }),
    );

    expect(result.profileId).toBe("commercial-new-context");
    expect(result.reasoning).toMatch(/new to context/i);
  });

  it("classifies strong engineering signals as systems-expert", () => {
    const result = inferProfileFromIntake(
      intake({
        role: "Platform architect",
        aiComfort: "deep expert, ship production agents",
        contextFamiliarity: "built governed operating layers",
        devExperience: "hands-on software engineer, write code",
        goal: "agent platform architecture",
      }),
    );

    expect(result.profileId).toBe("systems-expert");
    expect(result.reasoning).toMatch(/systems or engineering/i);
  });
});
