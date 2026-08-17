import { describe, expect, it } from "vitest";

import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS as F,
} from "./airtable-ids";
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
  brainRegistryRecordId: "rec7njkkYBWzZbe4n",
  captureSource: DRAFT_TRUTH_CAPTURE_SOURCE.chatSession,
  proposedByAgent: "clive-man",
};

describe("buildDraftTruthCreateFields", () => {
  it("always writes both registers by field ID", () => {
    const fields = buildDraftTruthCreateFields(base);
    expect(fields[F.canonicalTextForAgents]).toBe(
      "Promotion to Trusted is a human gate.",
    );
    expect(fields[F.canonicalTextForHumans]).toBeTruthy();
    expect(fields["Canonical Text for Agents"]).toBeUndefined();
    expect(fields["Canonical Text for Humans"]).toBeUndefined();
  });

  it("keeps a supplied human register instead of deriving one", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      canonicalTextForHumans: "Only a person can make a draft canon.",
    });
    expect(fields[F.canonicalTextForHumans]).toBe(
      "Only a person can make a draft canon.",
    );
  });

  it("links a live brain when the registry record is known", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      brainRegistryRecordId: "rec7njkkYBWzZbe4n",
    });
    expect(fields[F.brainRegistry]).toEqual(["rec7njkkYBWzZbe4n"]);
    expect(fields[F.brainSlug]).toBe("astrajax-core");
  });

  it("links source documents and amendment versions when supplied", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      sourceDocumentRecordIds: ["recSourceDoc00001"],
      contextAmendmentVersionRecordIds: ["recAmendment00001"],
    });
    expect(fields[F.sourceDocuments]).toEqual(["recSourceDoc00001"]);
    expect(fields[F.contextAmendmentVersions]).toEqual(["recAmendment00001"]);
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
    expect(fields[F.createdBy]).toBe("Agent");
    expect(fields[F.status]).toBe("Draft");
  });

  it("leaves Related Projects blank unless live IDs are passed", () => {
    const blank = buildDraftTruthCreateFields(base);
    expect(blank[F.relatedProjects]).toBeUndefined();

    const empty = buildDraftTruthCreateFields({ ...base, relatedProjectRecordIds: [] });
    expect(empty[F.relatedProjects]).toBeUndefined();

    const linked = buildDraftTruthCreateFields({
      ...base,
      relatedProjectRecordIds: ["rec9deYmfHS8s39za"],
    });
    expect(linked[F.relatedProjects]).toEqual(["rec9deYmfHS8s39za"]);
  });

  it("writes Related Projects from IDs even when the claim does not name the project", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      title: "Context should live on the platform",
      canonicalTextForAgents: "Durable context belongs in Workshop, not chat.",
      relatedProjectRecordIds: ["rechmkpaan4o4R6CT"],
    });
    expect(fields[F.relatedProjects]).toEqual(["rechmkpaan4o4R6CT"]);
  });

  it("refuses a guessed project name in place of a record ID", () => {
    expect(() =>
      buildDraftTruthCreateFields({
        ...base,
        relatedProjectRecordIds: ["Manage AstraJax Context On-Platform"],
      }),
    ).toThrow(/live record IDs only/);
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
