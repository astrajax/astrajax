import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableSelect: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
}));

import { airtableSelect } from "../airtable-rest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import { handleDraftTruthList } from "./draft-truth-list";

const selectMock = vi.mocked(airtableSelect);
const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);

describe("handleDraftTruthList", () => {
  beforeEach(() => {
    selectMock.mockReset();
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
    delete process.env.BRAIN_WORKSHOP_DRAFT_TRUTH_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("escapes quotes in brainSlug before building the Workshop filter", async () => {
    selectMock.mockResolvedValue([]);

    await handleDraftTruthList("o'brien");

    expect(selectMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.draftBrainTruth,
      "pat_workshop_write",
      {
        filterByFormula: "AND({Brain Slug}='o''brien', {Status}='Draft')",
        maxRecords: 20,
        sortField: "Title",
        sortDirection: "asc",
      },
    );
  });

  it("returns fallback without calling Airtable when Workshop is unwired", async () => {
    writeTokenMock.mockReturnValue(undefined);

    const result = await handleDraftTruthList("astrajax-chapter-1");

    expect(selectMock).not.toHaveBeenCalled();
    expect(result.mode).toBe("fallback");
    expect(result.drafts).toEqual([]);
    expect(result.message).toMatch(/not wired/i);
  });

  it("maps complete Draft rows and skips incomplete ones", async () => {
    selectMock.mockResolvedValue([
      {
        id: "recComplete",
        fields: {
          Title: " Trusted write gate ",
          "Canonical Text": " Humans approve before execute. ",
          "Proposed Category": "Principle",
          "Brain Theme": "Governance ",
          Status: "Draft",
          "Proposed By Agent": "Clive",
        },
      },
      {
        id: "recIncomplete",
        fields: {
          Title: "Missing body",
          Status: "Draft",
        },
      },
    ]);

    const result = await handleDraftTruthList("astrajax-chapter-1");

    expect(result.mode).toBe("airtable");
    expect(result.drafts).toEqual([
      {
        recordId: "recComplete",
        title: "Trusted write gate",
        canonicalText: "Humans approve before execute.",
        proposedCategory: "Principle",
        brainTheme: "Governance",
        status: "Draft",
        proposedByAgent: "Clive",
        scope: "read:brain-truth:governance",
        source: "workshop",
      },
    ]);
  });

  it("falls back with the error message when Workshop select throws", async () => {
    selectMock.mockRejectedValue(new Error("Airtable API error 429: rate limited"));

    const result = await handleDraftTruthList("astrajax-chapter-1");

    expect(result).toEqual({
      mode: "fallback",
      drafts: [],
      message: "Airtable API error 429: rate limited",
    });
  });
});
