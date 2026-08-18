import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableCreate: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
}));

import { airtableCreate } from "../airtable-rest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import { handleUserBrainSave } from "./user-brain-save";

const createMock = vi.mocked(airtableCreate);
const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);

describe("handleUserBrainSave", () => {
  beforeEach(() => {
    createMock.mockReset();
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
    delete process.env.BRAIN_WORKSHOP_USER_BRAINS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires sessionId", async () => {
    await expect(handleUserBrainSave({ sessionId: "  " })).rejects.toThrow(
      /sessionId is required/,
    );
  });

  it("returns fallback without writing when Workshop is unwired", async () => {
    writeTokenMock.mockReturnValue(undefined);

    const result = await handleUserBrainSave({ sessionId: "sess-12345678" });

    expect(createMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "fallback",
      saved: false,
    });
    expect(result.message).toMatch(/BRAIN_WORKSHOP_WRITE_TOKEN/);
  });

  it("maps confidence and guide-mode labels into Workshop User Brains fields", async () => {
    createMock.mockResolvedValue({ id: "recUserBrain", fields: {} });

    const result = await handleUserBrainSave({
      sessionId: "sess-abcdef12",
      name: " Matthew ",
      role: " Founder ",
      goal: " Build the boring layer ",
      profileLabel: " Balanced leader ",
      aiConfidence: "new",
      contextConfidence: "expert",
      classificationSummary: " Commercial ops + AI fluency ",
      guideMode: "light_story",
    });

    expect(createMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.userBrains,
      "pat_workshop_write",
      {
        "User Label": "Matthew",
        Notes:
          "Commercial ops + AI fluency\n\nRole: Founder\n\nChapter 1 session: sess-abcdef12",
        "Guide Mode": "Light Story",
        "One Line Remit": "Build the boring layer",
        "Development Notes": "Balanced leader",
        "AI Confidence": "New",
        "Context Environment Confidence": "Expert",
      },
    );
    expect(result).toEqual({
      mode: "airtable",
      saved: true,
      recordId: "recUserBrain",
      userLabel: "Matthew",
    });
  });

  it("defaults label and guide mode when optional fields are omitted", async () => {
    createMock.mockResolvedValue({ id: "recDefault", fields: {} });

    await handleUserBrainSave({ sessionId: "sess-xyz98765" });

    expect(createMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.userBrains,
      "pat_workshop_write",
      {
        "User Label": "Session sess-xyz",
        Notes: "Chapter 1 session: sess-xyz98765",
        "Guide Mode": "Full Story",
      },
    );
  });
});
