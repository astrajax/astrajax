import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  actionHouseholdInteraction,
  scoreHouseholdInteraction,
} from "./interaction-household-review";

const originalEnv = { ...process.env };

function householdTurn(fields: Record<string, unknown> = {}) {
  return {
    id: "recHouse1",
    createdTime: "2026-08-01T10:00:00.000Z",
    fields: {
      "Event Type": "Turn",
      "Event ID": "evt-1",
      "Session ID": "platform-1",
      "User Message": "Should we keep this?",
      "Reply Digest": "Only if evidence holds.",
      "Review Status": "Needs review",
      Detail: JSON.stringify({
        surface: "ask-clive",
        persona: "clive",
        brainSlug: "astrajax-chapter-1",
        manifest: { recordIds: ["recTruth1"] },
        keep: "existing-detail",
      }),
      ...fields,
    },
  };
}

function mockSelectThenPatch(selectBody: unknown, patchBody: unknown) {
  const mockFetch = vi.mocked(fetch);
  mockFetch
    .mockResolvedValueOnce(
      new Response(JSON.stringify(selectBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify(patchBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  return mockFetch;
}

describe("Household Activity review writes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.HOUSEHOLD_ACTIVITY_BASE_ID = "appHousehold";
    process.env.HOUSEHOLD_ACTIVITY_TABLE_ID = "tblActivity";
    process.env.HOUSEHOLD_ACTIVITY_READ_TOKEN = "patRead";
    process.env.HOUSEHOLD_ACTIVITY_REVIEW_TOKEN = "patReview";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("refuses to score or action a Turn that belongs to another brain", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ records: [householdTurn()] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      scoreHouseholdInteraction({
        recordId: "recHouse1",
        brainSlug: "other-brain",
        qualityScore: 2,
        reviewer: "Matthew",
        suspectedContextIssue: false,
        reviewStatus: "Reviewed",
        contextFlagged: "None",
      }),
    ).rejects.toThrow(/Brain does not match this Household interaction/);

    await expect(
      actionHouseholdInteraction({
        recordId: "recHouse1",
        brainSlug: "other-brain",
        reviewStatus: "No action",
        contextFlagged: "None",
      }),
    ).rejects.toThrow(/Brain does not match this Household interaction/);

    // Ownership failure must not reach the reviewer PATCH path.
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("escapes apostrophes in the lookup formula and PATCHes with the review token", async () => {
    const mockFetch = mockSelectThenPatch(
      { records: [householdTurn()] },
      {
        id: "recHouse1",
        fields: {
          "Review Status": "No action",
          Detail: JSON.stringify({
            surface: "ask-clive",
            persona: "clive",
            brainSlug: "astrajax-chapter-1",
            keep: "existing-detail",
            review: {
              reviewer: "Matthew",
              notes: undefined,
              reviewedAt: undefined,
              suspectedContextIssue: false,
              contextFlagged: "None",
            },
          }),
        },
      },
    );

    const result = await actionHouseholdInteraction({
      recordId: "recO'Brien",
      brainSlug: "astrajax-chapter-1",
      reviewer: "Matthew",
      reviewStatus: "No action",
      contextFlagged: "None",
    });

    const selectUrl = decodeURIComponent(String(mockFetch.mock.calls[0]?.[0]));
    expect(selectUrl).toContain("RECORD_ID()='recO\\'Brien'");
    expect(
      (mockFetch.mock.calls[0]?.[1] as RequestInit | undefined)?.headers,
    ).toMatchObject({ Authorization: "Bearer patRead" });

    const patchInit = mockFetch.mock.calls[1]?.[1] as RequestInit;
    expect(String(mockFetch.mock.calls[1]?.[0])).toContain(
      "/appHousehold/tblActivity/recHouse1",
    );
    expect(patchInit.method).toBe("PATCH");
    expect(patchInit.headers).toMatchObject({
      Authorization: "Bearer patReview",
    });

    const patchBody = JSON.parse(String(patchInit.body)) as {
      fields: { Detail: string; "Review Status": string };
    };
    expect(patchBody.fields["Review Status"]).toBe("No action");
    const detail = JSON.parse(patchBody.fields.Detail) as {
      keep?: string;
      review?: { reviewer?: string; contextFlagged?: string };
    };
    expect(detail.keep).toBe("existing-detail");
    expect(detail.review?.reviewer).toBe("Matthew");
    expect(detail.review?.contextFlagged).toBe("None");
    expect(result.reviewStatus).toBe("No action");
  });

  it("writes Agent Quality on score and rejects non-Turn household rows", async () => {
    const mockFetch = mockSelectThenPatch(
      { records: [householdTurn()] },
      {
        id: "recHouse1",
        fields: {
          "Agent Quality": 4,
          "Review Status": "Reviewed",
        },
      },
    );

    const scored = await scoreHouseholdInteraction({
      recordId: "recHouse1",
      brainSlug: "astrajax-chapter-1",
      qualityScore: 4,
      humanQuality: 5,
      reviewer: "Matthew",
      reviewNotes: "Solid",
      suspectedContextIssue: true,
      reviewStatus: "Reviewed",
      contextFlagged: "Flagged for review",
    });

    const patchBody = JSON.parse(
      String((mockFetch.mock.calls[1]?.[1] as RequestInit).body),
    ) as {
      fields: {
        "Agent Quality": number;
        "Human Quality": number;
        Detail: string;
      };
    };
    expect(patchBody.fields["Agent Quality"]).toBe(4);
    expect(patchBody.fields["Human Quality"]).toBe(5);
    const detail = JSON.parse(patchBody.fields.Detail) as {
      review?: { suspectedContextIssue?: boolean; notes?: string };
    };
    expect(detail.review?.suspectedContextIssue).toBe(true);
    expect(detail.review?.notes).toBe("Solid");
    expect(scored.agentQuality).toBe(4);

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recSession",
              fields: { "Event Type": "Session" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      actionHouseholdInteraction({
        recordId: "recSession",
        brainSlug: "astrajax-chapter-1",
        reviewStatus: "No action",
        contextFlagged: "None",
      }),
    ).rejects.toThrow(/Household interaction not found/);
  });
});
