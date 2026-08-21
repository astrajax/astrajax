import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
  getDocPromoteToken: vi.fn(() => undefined),
  useMemoryStore: vi.fn(() => false),
}));

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>(
    "../airtable-rest",
  );
  return {
    ...actual,
    airtableCreate: vi.fn(),
    airtableFindOne: vi.fn(),
  };
});

import { airtableCreate, airtableFindOne } from "../airtable-rest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import {
  getWorkshopBaseId,
  getWorkshopWriteToken,
  useMemoryStore,
} from "../config";
import { clearBrainRegistryCacheForTests } from "../draft-truth-write";
import { createDraftTruth } from "./draft-propose";

const createMock = vi.mocked(airtableCreate);
const findOneMock = vi.mocked(airtableFindOne);
const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryModeMock = vi.mocked(useMemoryStore);

describe("createDraftTruth (Airtable path)", () => {
  beforeEach(() => {
    clearBrainRegistryCacheForTests();
    createMock.mockReset();
    findOneMock.mockReset();
    memoryModeMock.mockReturnValue(false);
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
  });

  afterEach(() => {
    clearBrainRegistryCacheForTests();
    vi.clearAllMocks();
  });

  it("refuses create when Brain Registry has no row for the slug", async () => {
    findOneMock.mockResolvedValue(null);

    await expect(
      createDraftTruth({
        brainSlug: "missing-brain",
        title: "Pricing guardrail",
        canonicalText: "External numbers stay capped.",
        proposedCategory: "Rules & Guardrails",
      }),
    ).rejects.toThrow(/slug alone is not a destination/i);

    expect(createMock).not.toHaveBeenCalled();
  });

  it("writes a Draft with the live Brain Registry link when the slug resolves", async () => {
    findOneMock.mockResolvedValue({
      id: "recBrainRegistry9",
      fields: { "Brain Slug": "astrajax-chapter-1" },
    });
    createMock.mockResolvedValue({ id: "recDraftCreated9", fields: {} });

    const result = await createDraftTruth({
      brainSlug: "astrajax-chapter-1",
      title: "Booth line",
      canonicalText: "Direct Sales is the field channel.",
      proposedCategory: "Definition",
    });

    expect(result).toEqual({
      recordId: "recDraftCreated9",
      destination: "workshop-draft-truth",
      mode: "airtable",
    });
    expect(createMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.draftBrainTruth,
      "pat_workshop_write",
      expect.objectContaining({
        [BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainRegistry]: ["recBrainRegistry9"],
        [BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug]: "astrajax-chapter-1",
        [BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title]: "Booth line",
      }),
    );
  });
});
