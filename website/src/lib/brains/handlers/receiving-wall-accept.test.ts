import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAIN_WORKSHOP_TABLES, DRAFT_TRUTH_STATUS } from "../airtable-ids";
import { handleReceivingWallAccept } from "./receiving-wall-accept";

const originalEnv = { ...process.env };
const VALID_RECORD_ID = "recC5G6cQ1l3lHHkh";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  process.env.BRAIN_WORKSHOP_BASE_ID = "appWorkshopTest";
  process.env.BRAIN_WORKSHOP_READ_TOKEN = "patReadTest";
  process.env.BRAIN_WORKSHOP_WRITE_TOKEN = "patWriteTest";
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

function mockFetchSequence(
  responses: Array<{ status: number; body: unknown }>,
) {
  const mockFetch = vi.mocked(fetch);
  for (const response of responses) {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return mockFetch;
}

describe("handleReceivingWallAccept", () => {
  it("uses the read token for the draft lookup, not only the write token", async () => {
    const mockFetch = mockFetchSequence([
      {
        status: 200,
        body: {
          records: [
            {
              id: VALID_RECORD_ID,
              fields: { Title: "Test draft", Status: DRAFT_TRUTH_STATUS.draft },
            },
          ],
        },
      },
      {
        status: 200,
        body: {
          id: VALID_RECORD_ID,
          fields: { Title: "Test draft", Status: DRAFT_TRUTH_STATUS.approved },
        },
      },
      {
        status: 200,
        body: {
          id: "recApproval1234567",
          fields: { "Decision ID": "apd_rw_test" },
        },
      },
    ]);

    await handleReceivingWallAccept({ recordId: VALID_RECORD_ID });

    const lookupUrl = String(mockFetch.mock.calls[0]?.[0]);
    expect(lookupUrl).toContain(BRAIN_WORKSHOP_TABLES.draftBrainTruth);
    expect(
      (mockFetch.mock.calls[0]?.[1] as RequestInit | undefined)?.headers,
    ).toMatchObject({ Authorization: "Bearer patReadTest" });
  });

  it("maps Airtable 403 on lookup into a user-facing error", async () => {
    mockFetchSequence([
      {
        status: 403,
        body: {
          error: {
            type: "INVALID_PERMISSIONS",
            message:
              "Invalid permissions, or the requested model was not found.",
          },
        },
      },
    ]);

    await expect(
      handleReceivingWallAccept({ recordId: VALID_RECORD_ID }),
    ).rejects.toThrow(/Workshop read token/i);
  });

  it("names the write token on lookup 403 when read token falls back", async () => {
    delete process.env.BRAIN_WORKSHOP_READ_TOKEN;
    mockFetchSequence([
      {
        status: 403,
        body: {
          error: {
            type: "INVALID_PERMISSIONS",
            message:
              "Invalid permissions, or the requested model was not found.",
          },
        },
      },
    ]);

    await expect(
      handleReceivingWallAccept({ recordId: VALID_RECORD_ID }),
    ).rejects.toThrow(/BRAIN_WORKSHOP_WRITE_TOKEN/);
  });

  it("rejects seeded demo record ids", async () => {
    await expect(
      handleReceivingWallAccept({ recordId: "seed-core-definition" }),
    ).rejects.toThrow(/stand-in letter/i);
  });

  it("maps the wall record when PATCH returns only Status (partial Airtable body)", async () => {
    mockFetchSequence([
      {
        status: 200,
        body: {
          records: [
            {
              id: VALID_RECORD_ID,
              fields: {
                Title: "Partial patch draft",
                Status: DRAFT_TRUTH_STATUS.draft,
                "Canonical Text for Agents": "Body that must survive accept.",
                "Proposed By Agent": "Clive's Man",
                "Proposed Category": "Definition",
                "System Brain Slug": "astrajax-chapter-1",
              },
            },
          ],
        },
      },
      {
        status: 200,
        // Realistic Airtable PATCH: only the fields written come back.
        body: {
          id: VALID_RECORD_ID,
          fields: { Status: DRAFT_TRUTH_STATUS.approved },
        },
      },
      {
        status: 200,
        body: {
          id: "recApprovalPartial01",
          fields: { "Decision ID": "apd_rw_partial" },
        },
      },
    ]);

    const result = await handleReceivingWallAccept({
      recordId: VALID_RECORD_ID,
      actor: "Matthew",
    });

    expect(result.record.title).toBe("Partial patch draft");
    expect(result.record.status).toBe(DRAFT_TRUTH_STATUS.approved);
    expect(result.record.canonicalText).toBe("Body that must survive accept.");
    expect(result.record.systemBrainSlug).toBe("astrajax-chapter-1");
    expect(result.record.category).toBe("Definition");
    expect(result.approvalDecisionId).toMatch(/^apd_rw_/);
  });
});
