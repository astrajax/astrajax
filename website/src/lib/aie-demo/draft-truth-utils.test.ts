import { describe, expect, it } from "vitest";
import { categoryForPromote, scopeForDraft } from "./draft-truth-utils";
import { resolveLoopStep } from "./types";

describe("scopeForDraft", () => {
  it("keeps a valid Trusted scope and rejects malformed ones", () => {
    expect(
      scopeForDraft({ scope: "read:brain-truth:positioning", brainTheme: "govern" }),
    ).toBe("read:brain-truth:positioning");
    expect(scopeForDraft({ scope: "read:brain-truth:Not-Valid", brainTheme: "core" })).toBe(
      "read:brain-truth:positioning",
    );
    expect(scopeForDraft({ scope: "write:brain-truth:positioning" })).toBe(
      "read:brain-truth:positioning",
    );
  });

  it("maps governance-themed drafts to the governance scope", () => {
    expect(scopeForDraft({ brainTheme: "Governance rules" })).toBe("read:brain-truth:governance");
    expect(scopeForDraft({ brainTheme: "people" })).toBe("read:brain-truth:positioning");
  });
});

describe("categoryForPromote", () => {
  it("normalises empty/Knowledge/Open Questions to Definition and preserves others", () => {
    expect(categoryForPromote(undefined)).toBe("Definition");
    expect(categoryForPromote("  ")).toBe("Definition");
    expect(categoryForPromote("Knowledge")).toBe("Definition");
    expect(categoryForPromote("Open Questions")).toBe("Definition");
    expect(categoryForPromote("Guardrail")).toBe("Guardrail");
    expect(categoryForPromote("  Guardrail  ")).toBe("Guardrail");
  });
});

describe("resolveLoopStep", () => {
  it("maps legacy step ids and rejects unknown ones", () => {
    expect(resolveLoopStep("guide", "welcome")).toBe("brains_intro");
    expect(resolveLoopStep("clive_interview", "welcome")).toBe("brains_intro");
    expect(resolveLoopStep("truth_approval", "welcome")).toBe("truth_approval");
    expect(resolveLoopStep("pam_challenge", "welcome")).toBe("pam_challenge");
    expect(resolveLoopStep("removed_step", "welcome")).toBe("welcome");
    expect(resolveLoopStep(undefined, "user_brain")).toBe("user_brain");
  });
});
