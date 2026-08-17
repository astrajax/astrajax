import { describe, expect, it } from "vitest";

import {
  buildDraftTruthCreateFields,
  containsRecordId,
  deriveHumanText,
  DRAFT_TRUTH_CAPTURE_SOURCE,
} from "./draft-truth-write";

const base = {
  title: "Agents write Draft only",
  canonicalTextForAgents: "Promotion to Trusted is a human gate.",
  brainSlug: "astrajax-core",
  captureSource: DRAFT_TRUTH_CAPTURE_SOURCE.chatSession,
  proposedByAgent: "clive-man",
};

describe("buildDraftTruthCreateFields", () => {
  it("always writes both registers", () => {
    const fields = buildDraftTruthCreateFields(base);
    expect(fields["Canonical Text for Agents"]).toBe(
      "Promotion to Trusted is a human gate.",
    );
    expect(fields["Canonical Text for Humans"]).toBeTruthy();
  });

  it("keeps a supplied human register instead of deriving one", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      canonicalTextForHumans: "Only a person can make a draft canon.",
    });
    expect(fields["Canonical Text for Humans"]).toBe(
      "Only a person can make a draft canon.",
    );
  });

  it("links a live brain when the registry record is known", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      brainRegistryRecordId: "rec7njkkYBWzZbe4n",
    });
    expect(fields["Brain Registry"]).toEqual(["rec7njkkYBWzZbe4n"]);
    expect(fields["Brain Slug"]).toBe("astrajax-core");
  });

  it("links source documents and amendment versions when supplied", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      sourceDocumentRecordIds: ["recSourceDoc00001"],
      contextAmendmentVersionRecordIds: ["recAmendment00001"],
    });
    expect(fields["Source Documents"]).toEqual(["recSourceDoc00001"]);
    expect(fields["Context Amendment Versions"]).toEqual(["recAmendment00001"]);
  });

  it("refuses any status a human owns", () => {
    expect(() =>
      buildDraftTruthCreateFields({
        ...base,
        status: "Promoted" as never,
      }),
    ).toThrow(/Draft or Quarantined/);
  });

  it("refuses a row with no destination", () => {
    expect(() => buildDraftTruthCreateFields({ ...base, brainSlug: "  " })).toThrow(
      /brain slug/,
    );
  });

  it("defaults Created By to Agent and Status to Draft", () => {
    const fields = buildDraftTruthCreateFields(base);
    expect(fields["Created By"]).toBe("Agent");
    expect(fields.Status).toBe("Draft");
  });
});

describe("deriveHumanText", () => {
  it("strips record IDs so the human register stays readable", () => {
    const agent =
      "The overlay was recorded on the control-plane row (rec7CebyrzBHYzELy) for review.";
    const human = deriveHumanText(agent);
    expect(containsRecordId(agent)).toBe(true);
    expect(containsRecordId(human)).toBe(false);
    expect(human).toContain("The overlay was recorded on the control-plane row");
  });

  it("leaves plain text untouched", () => {
    expect(deriveHumanText("Humans approve; agents propose.")).toBe(
      "Humans approve; agents propose.",
    );
  });
});
