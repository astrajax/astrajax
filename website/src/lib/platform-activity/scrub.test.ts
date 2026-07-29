import { describe, expect, it } from "vitest";
import { scrubObviousSecrets } from "./scrub";

describe("scrubObviousSecrets", () => {
  it("preserves ordinary prompt wording verbatim", () => {
    const prompt = "Help me rewrite this sales brief, but keep the dry joke in paragraph two.";
    expect(scrubObviousSecrets(prompt)).toBe(prompt);
  });

  it("redacts common pasted credentials without dropping the rest of the prompt", () => {
    const prompt = "Use api_key=sk-abcdefghijklmnopqrstuvwxyz123456 to inspect this request.";
    expect(scrubObviousSecrets(prompt)).toBe(
      "Use api_key=[REDACTED_CREDENTIAL] to inspect this request.",
    );
  });

  it("does not treat Airtable base identifiers as credentials", () => {
    expect(scrubObviousSecrets("Read base appF7jQD4ZKrDC7e1")).toBe(
      "Read base appF7jQD4ZKrDC7e1",
    );
  });
});
