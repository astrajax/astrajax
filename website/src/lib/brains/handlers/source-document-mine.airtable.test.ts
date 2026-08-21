import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
  useMemoryStore: vi.fn(() => false),
}));

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>(
    "../airtable-rest",
  );
  return {
    ...actual,
    airtableSelect: vi.fn(),
    airtableCreate: vi.fn(),
    airtableUpdate: vi.fn(),
    airtableFindOne: vi.fn(),
  };
});

import {
  airtableCreate,
  airtableFindOne,
  airtableSelect,
  airtableUpdate,
} from "../airtable-rest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import {
  getWorkshopBaseId,
  getWorkshopWriteToken,
  useMemoryStore,
} from "../config";
import { clearBrainRegistryCacheForTests } from "../draft-truth-write";
import { handleSourceDocumentMine } from "./source-document-mine";

const selectMock = vi.mocked(airtableSelect);
const createMock = vi.mocked(airtableCreate);
const updateMock = vi.mocked(airtableUpdate);
const findOneMock = vi.mocked(airtableFindOne);
const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryModeMock = vi.mocked(useMemoryStore);

const SUMMARY =
  "Direct Sales is the field channel that acquires customers face to face.";

function eligibleRecord(overrides: { id?: string; slug?: string; summary?: string } = {}) {
  return {
    id: overrides.id ?? "recSourceDoc1",
    fields: {
      Title: "Ops handbook",
      "Attachment Summary": overrides.summary ?? SUMMARY,
      "Mine Status": BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.summarised,
      "Brain Slug": overrides.slug ?? "astrajax-chapter-1",
    },
  };
}

describe("handleSourceDocumentMine (Airtable path)", () => {
  beforeEach(() => {
    clearBrainRegistryCacheForTests();
    selectMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    findOneMock.mockReset();
    memoryModeMock.mockReturnValue(false);
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
    delete process.env.BRAIN_WORKSHOP_SOURCE_DOCUMENTS_TABLE_ID;
    delete process.env.BRAIN_WORKSHOP_DRAFT_TRUTH_TABLE_ID;
  });

  afterEach(() => {
    clearBrainRegistryCacheForTests();
    vi.clearAllMocks();
  });

  it("requires a brain slug before touching Workshop", async () => {
    await expect(handleSourceDocumentMine({ brainSlug: "  " })).rejects.toThrow(
      /brainSlug is required/,
    );
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("refuses when Workshop write credentials are missing", async () => {
    writeTokenMock.mockReturnValue(undefined);
    await expect(
      handleSourceDocumentMine({ brainSlug: "astrajax-chapter-1" }),
    ).rejects.toThrow(/not configured/);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("clamps limit onto the eligibility select and escapes formula quotes", async () => {
    selectMock.mockResolvedValue([]);
    await handleSourceDocumentMine({ brainSlug: "o'brien-brain", limit: 99 });

    expect(selectMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "pat_workshop_write",
      expect.objectContaining({
        maxRecords: 20,
        filterByFormula: expect.stringContaining("o''brien-brain"),
      }),
    );
  });

  it("dryRun returns proposals without creating drafts or flipping Mine Status", async () => {
    selectMock.mockResolvedValue([eligibleRecord()]);

    const result = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
      dryRun: true,
    });

    expect(result.mode).toBe("airtable");
    expect(result.dryRun).toBe(true);
    expect(result.eligibleCount).toBe(1);
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.draftRecordIds).toEqual([]);
    expect(result.minedSourceDocumentIds).toEqual([]);
    expect(findOneMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("refuses to mint drafts when Brain Registry has no row for the slug", async () => {
    selectMock.mockResolvedValue([eligibleRecord()]);
    findOneMock.mockResolvedValue(null);

    await expect(
      handleSourceDocumentMine({ brainSlug: "astrajax-chapter-1" }),
    ).rejects.toThrow(/slug alone is not a destination/i);

    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("creates External drafts linked to the source, then marks the source Proposed", async () => {
    selectMock.mockResolvedValue([eligibleRecord({ id: "recSrcMine" })]);
    findOneMock.mockResolvedValue({
      id: "recBrainRegistry1",
      fields: { "Brain Slug": "astrajax-chapter-1" },
    });
    createMock.mockResolvedValue({ id: "recDraftMine1", fields: {} });
    updateMock.mockResolvedValue({ id: "recSrcMine", fields: {} });

    const result = await handleSourceDocumentMine({
      brainSlug: "astrajax-chapter-1",
      limit: 3,
    });

    expect(result.mode).toBe("airtable");
    expect(result.draftRecordIds).toEqual(["recDraftMine1"]);
    expect(result.minedSourceDocumentIds).toEqual(["recSrcMine"]);

    expect(createMock).toHaveBeenCalledTimes(1);
    const createFields = createMock.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(createFields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainRegistry]).toEqual([
      "recBrainRegistry1",
    ]);
    expect(createFields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.captureSource]).toBe(
      "External Context Capture",
    );
    expect(createFields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent]).toBe(
      "clive-man",
    );
    expect(createFields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.sourceDocuments]).toEqual([
      "recSrcMine",
    ]);

    expect(updateMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "pat_workshop_write",
      "recSrcMine",
      {
        "Mine Status": BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.proposed,
        "Linked Drafts": ["recDraftMine1"],
      },
    );
  });
});
