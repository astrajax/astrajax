import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableCreate: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getRegistryBaseId: vi.fn(() => "appRegistry"),
  getRegistryWriteToken: vi.fn(() => "pat_registry_write"),
}));

import { airtableCreate } from "../airtable-rest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { getRegistryBaseId, getRegistryWriteToken } from "../config";
import { handleUserBrainSave } from "./user-brain-save";

const createMock = vi.mocked(airtableCreate);
const baseIdMock = vi.mocked(getRegistryBaseId);
const writeTokenMock = vi.mocked(getRegistryWriteToken);

describe("handleUserBrainSave", () => {
  beforeEach(() => {
    createMock.mockReset();
    baseIdMock.mockReturnValue("appRegistry");
    writeTokenMock.mockReturnValue("pat_registry_write");
    delete process.env.BRAIN_REGISTRY_USER_BRAINS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires sessionId", async () => {
    await expect(handleUserBrainSave({ sessionId: "  " })).rejects.toThrow(
      /sessionId is required/,
    );
  });

  it("returns fallback without writing when Registry is unwired", async () => {
    writeTokenMock.mockReturnValue(undefined);

    const result = await handleUserBrainSave({ sessionId: "sess-12345678" });

    expect(createMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "fallback",
      saved: false,
    });
    expect(result.message).toMatch(/BRAIN_REGISTRY_WRITE_TOKEN/);
  });

  it("maps confidence and guide-mode labels into Registry User Brains fields", async () => {
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
      "appRegistry",
      BRAIN_REGISTRY_TABLES.userBrains,
      "pat_registry_write",
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
      "appRegistry",
      BRAIN_REGISTRY_TABLES.userBrains,
      "pat_registry_write",
      {
        "User Label": "Session sess-xyz",
        Notes: "Chapter 1 session: sess-xyz98765",
        "Guide Mode": "Full Story",
      },
    );
  });
});
