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
  scoreHouseholdInteraction: vi.fn(),
}));

import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopBaseId, getWorkshopWriteToken, useMemoryStore } from "../config";
import { assertBrainInteractionBelongsToBrain } from "./interaction-brain-guard";
import { scoreHouseholdInteraction } from "./interaction-household-review";
import { handleInteractionScore } from "./interaction-score";

const baseIdMock = vi.mocked(getWorkshopBaseId);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryMock = vi.mocked(useMemoryStore);
const guardMock = vi.mocked(assertBrainInteractionBelongsToBrain);
const householdMock = vi.mocked(scoreHouseholdInteraction);

function workshopRecord(fields: Record<string, unknown> = {}) {
  return {
    id: "recIx1",
    createdTime: "2026-08-15T10:00:00.000Z",
    fields: {
      "Interaction ID": "ix-1",
      "Session ID": "sess-1",
      Persona: "clive",
      "Brain Slug": "astrajax-chapter-1",
      "User Message": "What is the thesis?",
      "Assistant Reply": "Domain experts become architects.",
      Channel: "website",
      ...fields,
    },
  };
}

function stubOwnershipLookup(fields: Record<string, unknown> = {}) {
  guardMock.mockResolvedValue(workshopRecord(fields));
}

describe("handleInteractionScore (Workshop Airtable path)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T12:00:00.000Z"));
    baseIdMock.mockReturnValue("appWorkshop");
    writeTokenMock.mockReturnValue("pat_workshop_write");
    memoryMock.mockReturnValue(false);
    guardMock.mockReset();
    stubOwnershipLookup();
    householdMock.mockReset();
    delete process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects Human Quality on Brain Interaction rows", async () => {
    await expect(
      handleInteractionScore({
        recordId: "recIx1",
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        qualityScore: 4,
        humanQuality: 5,
        reviewer: "Matthew",
      }),
    ).rejects.toThrow(/Human Quality is available only on Household Activity/);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("PATCHes score + auto-propose fields after ownership check", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ records: [workshopRecord()] }), { status: 200 }),
    );

    const result = await handleInteractionScore({
      recordId: "recIx1",
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 2,
      reviewer: "Matthew",
      reviewNotes: "Thin evidence",
      suspectedContextIssue: true,
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
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      records: [
        {
          id: "recIx1",
          fields: {
            "Quality Score": 2,
            Reviewer: "Matthew",
            "Review Notes": "Thin evidence",
            "Reviewed At": "2026-08-15T12:00:00.000Z",
            "Suspected Context Issue": true,
            "Review Status": "Action proposed",
            "Context Flagged": "Flagged for review",
          },
        },
      ],
    });
    expect(result.autoProposed).toBe(true);
    expect(result.interaction.reviewStatus).toBe("Action proposed");
    expect(result.interaction.qualityScore).toBe(2);
  });

  it("keeps Question/Answer when Airtable PATCH returns only changed fields", async () => {
    stubOwnershipLookup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recIx1",
              fields: {
                "Quality Score": 4,
                Reviewer: "Matthew",
                "Review Notes": "",
                "Reviewed At": "2026-08-15T12:00:00.000Z",
                "Suspected Context Issue": false,
                "Review Status": "Reviewed",
                "Context Flagged": "None",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await handleInteractionScore({
      recordId: "recIx1",
      source: "brain_interactions",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 4,
      reviewer: "Matthew",
    });

    expect(result.interaction.userMessage).toBe("What is the thesis?");
    expect(result.interaction.assistantReply).toBe("Domain experts become architects.");
    expect(result.interaction.sessionId).toBe("sess-1");
    expect(result.interaction.createdAt).toBe("2026-08-15T10:00:00.000Z");
    expect(result.interaction.qualityScore).toBe(4);
  });

  it("throws when Workshop rejects the score PATCH", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("forbidden", { status: 403 }));

    await expect(
      handleInteractionScore({
        recordId: "recIx1",
        source: "brain_interactions",
        brainSlug: "astrajax-chapter-1",
        qualityScore: 4,
        reviewer: "Matthew",
      }),
    ).rejects.toThrow(/Workshop interaction score failed \(403\)/);
  });
});
