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
  getWorkshopReadToken: vi.fn(() => "pat_workshop_read"),
  useMemoryStore: vi.fn(() => false),
  getInteractionReadMode: vi.fn(() => "brain_only"),
}));

vi.mock("./interaction-household", () => ({
  listHouseholdInteractions: vi.fn(),
}));

import { airtableSelect } from "../airtable-rest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import {
  getInteractionReadMode,
  getWorkshopBaseId,
  getWorkshopReadToken,
  useMemoryStore,
} from "../config";
import { listHouseholdInteractions } from "./interaction-household";
import { handleInteractionList } from "./interaction-list";

const selectMock = vi.mocked(airtableSelect);
const baseIdMock = vi.mocked(getWorkshopBaseId);
const readTokenMock = vi.mocked(getWorkshopReadToken);
const memoryMock = vi.mocked(useMemoryStore);
const modeMock = vi.mocked(getInteractionReadMode);
const householdMock = vi.mocked(listHouseholdInteractions);

describe("handleInteractionList", () => {
  beforeEach(() => {
    selectMock.mockReset();
    householdMock.mockReset();
    baseIdMock.mockReturnValue("appWorkshop");
    readTokenMock.mockReturnValue("pat_workshop_read");
    memoryMock.mockReturnValue(false);
    modeMock.mockReturnValue("brain_only");
    delete process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires brainSlug", async () => {
    await expect(handleInteractionList({})).rejects.toThrow(/brainSlug is required/);
  });

  it("escapes quotes in brainSlug for the default Workshop filter", async () => {
    selectMock.mockResolvedValue([]);

    await handleInteractionList({ brainSlug: "brain's-slug" });

    expect(selectMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.brainInteractions,
      "pat_workshop_read",
      expect.objectContaining({
        filterByFormula: "{Brain Slug}='brain\\'s-slug'",
        maxRecords: 25,
      }),
    );
  });

  it("soft-fails auth errors with a read-token warning instead of throwing", async () => {
    selectMock.mockRejectedValue(new Error("Airtable 403 NOT_AUTHORIZED"));

    const result = await handleInteractionList({ brainSlug: "astrajax-chapter-1" });

    expect(result.interactions).toEqual([]);
    expect(result.warning).toMatch(/BRAIN_WORKSHOP_READ_TOKEN/);
  });

  it("merges dual-mode sources and keeps the newest row per stableId", async () => {
    modeMock.mockReturnValue("dual");
    selectMock.mockResolvedValue([
      {
        id: "recBrainOld",
        createdTime: "2026-08-01T10:00:00.000Z",
        fields: {
          "Interaction ID": "ix-brain",
          "Session ID": "sess-1",
          Persona: "clive",
          "Brain Slug": "astrajax-chapter-1",
          "User Message": "older brain row",
          "Assistant Reply": "…",
          Channel: "website",
        },
      },
    ]);
    householdMock.mockResolvedValue({
      interactions: [
        {
          recordId: "recHouse",
          source: "household_activity",
          stableId: "household_activity:recHouse",
          interactionId: "evt-1",
          sessionId: "platform-1",
          persona: "clive",
          brainSlug: "astrajax-chapter-1",
          userMessage: "household row",
          assistantReply: "…",
          channel: "website",
          createdAt: "2026-08-02T10:00:00.000Z",
          manifestRecordIds: [],
          contentComplete: false,
        },
        {
          // Same stable id as brain row would collide only if sources matched;
          // include a second brain-shaped id to prove Map overwrite by stableId.
          recordId: "recBrainOld",
          source: "brain_interactions",
          stableId: "brain_interactions:recBrainOld",
          interactionId: "ix-brain",
          sessionId: "sess-1",
          persona: "clive",
          brainSlug: "astrajax-chapter-1",
          userMessage: "newer brain projection from household path",
          assistantReply: "…",
          channel: "website",
          createdAt: "2026-08-03T10:00:00.000Z",
          manifestRecordIds: [],
          contentComplete: true,
        },
      ],
    });

    const result = await handleInteractionList({
      brainSlug: "astrajax-chapter-1",
      limit: 10,
    });

    expect(result.interactions).toHaveLength(2);
    expect(result.interactions[0]?.userMessage).toBe(
      "newer brain projection from household path",
    );
    expect(result.interactions.map((row) => row.stableId)).toEqual([
      "brain_interactions:recBrainOld",
      "household_activity:recHouse",
    ]);
  });

  it("clamps maxRecords to 50", async () => {
    selectMock.mockResolvedValue([]);

    await handleInteractionList({ brainSlug: "astrajax-chapter-1", limit: 999 });

    expect(selectMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.brainInteractions,
      "pat_workshop_read",
      expect.objectContaining({ maxRecords: 50 }),
    );
  });
});
