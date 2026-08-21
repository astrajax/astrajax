import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("./airtable-rest")>("./airtable-rest");
  return {
    ...actual,
    airtableFindOne: vi.fn(),
  };
});

import { airtableFindOne } from "./airtable-rest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "./airtable-ids";
import {
  assertNoBuilderReviewFields,
  buildDraftTruthCreateFields,
  clearBrainRegistryCacheForTests,
  containsRecordId,
  deriveHumanText,
  DRAFT_TRUTH_CAPTURE_SOURCE,
  DRAFT_TRUTH_FIELD_IDS,
  resolveBrainRegistryRecordId,
} from "./draft-truth-write";

const F = BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS;
const findOneMock = vi.mocked(airtableFindOne);

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
    expect(fields[F.canonicalText]).toBe("Promotion to Trusted is a human gate.");
    expect(fields[F.canonicalTextForHumans]).toBeTruthy();
    expect(fields[DRAFT_TRUTH_FIELD_IDS.canonicalTextForAgents]).toBe(
      fields[F.canonicalText],
    );
  });

  it("keeps a supplied human register instead of deriving one", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      canonicalTextForHumans: "Only a person can make a draft canon.",
    });
    expect(fields[F.canonicalTextForHumans]).toBe("Only a person can make a draft canon.");
  });

  it("requires a live Brain Registry link", () => {
    expect(buildDraftTruthCreateFields(base)[F.brainRegistry]).toEqual([
      "rec7njkkYBWzZbe4n",
    ]);
    expect(buildDraftTruthCreateFields(base)[F.brainSlug]).toBe("astrajax-core");
    expect(() =>
      buildDraftTruthCreateFields({
        ...base,
        brainRegistryRecordId: "  ",
      }),
    ).toThrow(/Brain Registry link/);
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

  it("allows Quarantined as an agent-writable status", () => {
    const fields = buildDraftTruthCreateFields({
      ...base,
      status: "Quarantined",
    });
    expect(fields[F.status]).toBe("Quarantined");
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

  it("refuses blank title, agent text, or proposed-by", () => {
    expect(() => buildDraftTruthCreateFields({ ...base, title: "  " })).toThrow(/Title/);
    expect(() =>
      buildDraftTruthCreateFields({ ...base, canonicalTextForAgents: "\n" }),
    ).toThrow(/Canonical Text for Agents/);
    expect(() =>
      buildDraftTruthCreateFields({ ...base, proposedByAgent: "   " }),
    ).toThrow(/Proposed By Agent/);
  });

  it("refuses an unknown Capture Source", () => {
    expect(() =>
      buildDraftTruthCreateFields({
        ...base,
        captureSource: "Nightly scrape" as never,
      }),
    ).toThrow(/Unknown Capture Source/);
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

  it("refuses builder-review fields keyed by ID or name", () => {
    expect(() =>
      assertNoBuilderReviewFields({ [F.humanReviewed]: true }),
    ).toThrow(/builder-review/);
    expect(() =>
      assertNoBuilderReviewFields({ "Human Reviewed": true }),
    ).toThrow(/builder-review/);
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

describe("resolveBrainRegistryRecordId", () => {
  beforeEach(() => {
    findOneMock.mockReset();
    clearBrainRegistryCacheForTests();
  });

  afterEach(() => {
    clearBrainRegistryCacheForTests();
  });

  it("returns null for a blank slug without calling Airtable", async () => {
    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "   "),
    ).resolves.toBeNull();
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("escapes quotes in the Brain Slug formula and returns the live record id", async () => {
    findOneMock.mockResolvedValue({
      id: "recBrainRegistry01",
      fields: { "Brain Slug": "o'brien" },
    });

    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "o'brien"),
    ).resolves.toBe("recBrainRegistry01");

    expect(findOneMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.brainRegistry,
      "pat",
      "{Brain Slug}='o''brien'",
      expect.any(Array),
    );
  });

  it("caches misses and hits so a second resolve does not re-hit Airtable", async () => {
    findOneMock.mockResolvedValue(null);

    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "missing-brain"),
    ).resolves.toBeNull();
    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "missing-brain"),
    ).resolves.toBeNull();
    expect(findOneMock).toHaveBeenCalledTimes(1);

    clearBrainRegistryCacheForTests();
    findOneMock.mockResolvedValue({
      id: "recLiveBrain00001",
      fields: { "Brain Slug": "astrajax-core" },
    });

    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "astrajax-core"),
    ).resolves.toBe("recLiveBrain00001");
    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "astrajax-core"),
    ).resolves.toBe("recLiveBrain00001");
    expect(findOneMock).toHaveBeenCalledTimes(2);
  });

  it("does not cache Airtable failures — a warm instance must retry after a blip", async () => {
    findOneMock
      .mockRejectedValueOnce(new Error("Airtable API error 503: unavailable"))
      .mockResolvedValueOnce({
        id: "recLiveBrain00001",
        fields: { "Brain Slug": "astrajax-core" },
      });

    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "astrajax-core"),
    ).rejects.toThrow(/503/);

    await expect(
      resolveBrainRegistryRecordId("appWorkshop", "pat", "astrajax-core"),
    ).resolves.toBe("recLiveBrain00001");
    expect(findOneMock).toHaveBeenCalledTimes(2);
  });
});
