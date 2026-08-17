import { describe, expect, it } from "vitest";
import { getModelFailureNotice } from "./model-failure";

describe("getModelFailureNotice", () => {
  it("admits failure in Clive's voice instead of inventing an answer", () => {
    const notice = getModelFailureNotice("clive");
    expect(notice).toMatch(/can't reach my reasoning/i);
    expect(notice).toMatch(/rather say so than invent/i);
  });

  it("uses Pam's refusal-to-fake-a-verdict wording", () => {
    const notice = getModelFailureNotice("pam");
    expect(notice).toMatch(/won't hand you a verdict/i);
  });

  it("falls back to Clive when the persona is unknown at runtime", () => {
    // Cast: production only types ClivePersona, but callers may pass broader strings.
    expect(getModelFailureNotice("unknown" as "clive")).toBe(getModelFailureNotice("clive"));
  });
});
