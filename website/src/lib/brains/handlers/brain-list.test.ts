import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableSelect: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getRegistryBaseId: vi.fn(() => "appRegistry"),
  getRegistryReadToken: vi.fn(() => "pat_registry_read"),
}));

import { airtableSelect } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryReadToken } from "../config";
import { BRAINS_SHELF } from "@/lib/platform/brains";
import { handleBrainList } from "./brain-list";

const selectMock = vi.mocked(airtableSelect);
const baseIdMock = vi.mocked(getRegistryBaseId);
const tokenMock = vi.mocked(getRegistryReadToken);

describe("handleBrainList", () => {
  beforeEach(() => {
    selectMock.mockReset();
    baseIdMock.mockReturnValue("appRegistry");
    tokenMock.mockReturnValue("pat_registry_read");
    delete process.env.BRAIN_REGISTRY_BRAINS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the seeded shelf when Registry credentials are missing", async () => {
    tokenMock.mockReturnValue(undefined);

    const result = await handleBrainList();

    expect(selectMock).not.toHaveBeenCalled();
    expect(result.source).toBe("seed");
    expect(result.brains).toEqual(BRAINS_SHELF);
    expect(result.message).toMatch(/Registry read token not configured/i);
  });

  it("falls back to seed when Registry returns no usable rows", async () => {
    selectMock.mockResolvedValue([
      { id: "recIncomplete", fields: { "Brain Slug": "  ", "Brain Name": "Missing slug" } },
    ]);

    const result = await handleBrainList();

    expect(result.source).toBe("seed");
    expect(result.brains).toEqual(BRAINS_SHELF);
    expect(result.message).toMatch(/no brains/i);
  });

  it("maps live Registry rows and appends Brain to bare maturity labels", async () => {
    selectMock.mockResolvedValue([
      {
        id: "recLive",
        fields: {
          "Brain Slug": " new-brain ",
          "Brain Name": " New Brain ",
          Purpose: " Fresh theme ",
          Maturity: "Working",
        },
      },
      {
        id: "recSeeded",
        fields: {
          "Brain Slug": "astrajax-chapter-1",
          "Brain Name": "AstraJax Chapter 1 Live",
          Purpose: "Live purpose",
          Maturity: "Working Brain",
        },
      },
    ]);

    const result = await handleBrainList();

    expect(selectMock).toHaveBeenCalledWith(
      "appRegistry",
      BRAIN_REGISTRY_TABLES.brains,
      "pat_registry_read",
      {
        maxRecords: 25,
        sortField: "Brain Name",
        sortDirection: "asc",
      },
    );
    expect(result.source).toBe("live");
    expect(result.brains).toHaveLength(2);
    expect(result.brains[0]).toMatchObject({
      slug: "new-brain",
      name: "New Brain",
      theme: "Fresh theme",
      maturityLabel: "Working Brain",
    });
    expect(result.brains[1]).toMatchObject({
      slug: "astrajax-chapter-1",
      name: "AstraJax Chapter 1 Live",
      maturityLabel: "Working Brain",
      // Seeded shelf wins health/flags for known slugs
      healthBand: "thriving",
      flagsCount: 4,
    });
  });

  it("soft-fails Airtable errors onto the seeded shelf", async () => {
    selectMock.mockRejectedValue(new Error("Airtable 503 Unavailable"));

    const result = await handleBrainList();

    expect(result.source).toBe("seed");
    expect(result.brains).toEqual(BRAINS_SHELF);
    expect(result.message).toMatch(/503/);
  });
});
