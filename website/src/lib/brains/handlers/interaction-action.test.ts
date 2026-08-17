import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
  useMemoryStore: vi.fn(() => false),
}));

vi.mock("./interaction-brain-guard", () => ({
  assertBrainInteractionBelongsToBrain: vi.fn(),
}));

vi.mock("./interaction-household-review", () => ({
  actionHouseholdInteraction: vi.fn(),
}));

import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { assertBrainInteractionBelongsToBrain } from "./interaction-brain-guard";
import { actionHouseholdInteraction } from "./interaction-household-review";
import { handleInteractionAction } from "./interaction-action";

const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryMock = vi.mocked(useMemoryStore);
const guardMock = vi.mocked(assertBrainInteractionBelongsToBrain);
const householdMock = vi.mocked(actionHouseholdInteraction);

function workshopRecord(fields: Record<string, unknown> = {}) {
  return {
    id: "recIx1",
    createdTime: "2026-08-15T10:00:00.000Z",
    fields: {
      "Interaction ID": "ix-1",
      "Session ID": "sess-1",
      Persona: "clive",
      "Brain Slug": "astrajax-chapter-1",
      "User Message": "Should we quarantine this?",
      "Assistant Reply": "Only with evidence.",
      Channel: "website",
      ...fields,
    },
  };
}

describe("handleInteractionAction (Workshop Airtable path)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
    memoryMock.mockReturnValue(false);
    guardMock.mockReset();
    guardMock.mockResolvedValue(undefined);
    householdMock.mockReset();
    delete process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("requires recordId, brainSlug, a valid action, and a known source", async () => {
    await expect(
      handleInteractionAction({
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        action: "propose",
      } as never),
    ).rejects.toThrow(/recordId is required/);

    await expect(
      handleInteractionAction({
        recordId: "recIx1",
        source: "brain_interactions",
        action: "propose",
      } as never),
    ).rejects.toThrow(/brainSlug is required/);

    await expect(
      handleInteractionAction({
        recordId: "recIx1",
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        action: "archive" as never,
      }),
    ).rejects.toThrow(/propose" or "dismiss/);

    await expect(
      handleInteractionAction({
        recordId: "recIx1",
        source: "unknown" as never,
        brainSlug: "astrajax-chapter-1",
        action: "propose",
      }),
    ).rejects.toThrow(/valid interaction source/);
  });

  it("refuses to mutate when Workshop write credentials are missing", async () => {
    writeTokenMock.mockReturnValue(undefined);

    await expect(
      handleInteractionAction({
        recordId: "recIx1",
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        action: "propose",
      }),
    ).rejects.toThrow(/not configured/);

    expect(guardMock).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("PATCHes propose with quarantine flag after ownership check", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ records: [workshopRecord()] }), { status: 200 }),
    );

    const result = await handleInteractionAction({
      recordId: "recIx1",
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      action: "propose",
      quarantine: true,
      actor: "Matthew",
    });

    expect(guardMock).toHaveBeenCalledWith({
      baseId: "appWorkshop",
      tableId: BRAIN_WORKSHOP_TABLES.brainInteractions,
      token: "pat_workshop_write",
      recordId: "recIx1",
      brainSlug: "astrajax-chapter-1",
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(
      `https://api.airtable.com/v0/appWorkshop/${BRAIN_WORKSHOP_TABLES.brainInteractions}`,
    );
    expect(init?.method).toBe("PATCH");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer pat_workshop_write",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      records: [
        {
          id: "recIx1",
          fields: {
            "Review Status": "Action proposed",
            "Context Flagged": "Quarantine proposed",
            Reviewer: "Matthew",
          },
        },
      ],
    });
    expect(result.interaction.reviewStatus).toBe("Action proposed");
    expect(result.interaction.contextFlagged).toBe("Quarantine proposed");
    expect(result.interaction.reviewer).toBe("Matthew");
  });

  it("PATCHes dismiss to No action / None without inventing a reviewer", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ records: [workshopRecord()] }), { status: 200 }),
    );

    const result = await handleInteractionAction({
      recordId: "recIx1",
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      action: "dismiss",
    });

    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))).toEqual({
      records: [
        {
          id: "recIx1",
          fields: {
            "Review Status": "No action",
            "Context Flagged": "None",
          },
        },
      ],
    });
    expect(result.interaction.reviewStatus).toBe("No action");
    expect(result.interaction.contextFlagged).toBe("None");
  });

  it("throws when Workshop rejects the action PATCH", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("forbidden", { status: 403 }));

    await expect(
      handleInteractionAction({
        recordId: "recIx1",
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        action: "propose",
      }),
    ).rejects.toThrow(/Workshop interaction action failed \(403\)/);
  });

  it("delegates household_activity rows to the Household review writer", async () => {
    householdMock.mockResolvedValue({
      recordId: "recHouse1",
      source: "household_activity",
      stableId: "household_activity:recHouse1",
      interactionId: "evt-1",
      sessionId: "platform-1",
      persona: "clive",
      brainSlug: "astrajax-chapter-1",
      userMessage: "Keep?",
      assistantReply: "If evidence holds.",
      channel: "website",
      createdAt: "2026-08-15T10:00:00.000Z",
      reviewStatus: "Action proposed",
      contextFlagged: "Flagged for review",
      contentComplete: true,
    });

    const result = await handleInteractionAction({
      recordId: "recHouse1",
      source: "household_activity",
      brainSlug: "astrajax-chapter-1",
      action: "propose",
      actor: "Matthew",
    });

    expect(householdMock).toHaveBeenCalledWith({
      recordId: "recHouse1",
      brainSlug: "astrajax-chapter-1",
      reviewer: "Matthew",
      reviewStatus: "Action proposed",
      contextFlagged: "Flagged for review",
    });
    expect(guardMock).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(result.interaction.recordId).toBe("recHouse1");
  });
});
