import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assertBrainInteractionBelongsToBrain } from "./interaction-brain-guard";

describe("assertBrainInteractionBelongsToBrain", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("accepts a record owned by the requested brain", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recIx1",
              fields: { "Brain Slug": "astrajax-chapter-1" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      assertBrainInteractionBelongsToBrain({
        baseId: "appWorkshop",
        tableId: "tblInteractions",
        token: "test-token",
        recordId: "recIx1",
        brainSlug: "astrajax-chapter-1",
      }),
    ).resolves.toBeUndefined();

    const url = String(mockFetch.mock.calls[0]?.[0]);
    expect(url).toContain("appWorkshop");
    expect(url).toContain("tblInteractions");
    expect(decodeURIComponent(url)).toContain("RECORD_ID()='recIx1'");
  });

  it("refuses missing records and cross-brain ownership", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ records: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      assertBrainInteractionBelongsToBrain({
        baseId: "appWorkshop",
        tableId: "tblInteractions",
        token: "test-token",
        recordId: "recMissing",
        brainSlug: "astrajax-chapter-1",
      }),
    ).rejects.toThrow(/Interaction not found/);

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recIx2",
              fields: { "Brain Slug": "astrajax-brand" },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await expect(
      assertBrainInteractionBelongsToBrain({
        baseId: "appWorkshop",
        tableId: "tblInteractions",
        token: "test-token",
        recordId: "recIx2",
        brainSlug: "astrajax-chapter-1",
      }),
    ).rejects.toThrow(/Brain does not match/);
  });

  it("escapes apostrophes in record ids before querying Airtable", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ records: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      assertBrainInteractionBelongsToBrain({
        baseId: "appWorkshop",
        tableId: "tblInteractions",
        token: "test-token",
        recordId: "recO'Brien",
        brainSlug: "astrajax-chapter-1",
      }),
    ).rejects.toThrow(/Interaction not found/);

    expect(decodeURIComponent(String(mockFetch.mock.calls[0]?.[0]))).toContain(
      "RECORD_ID()='recO\\'Brien'",
    );
  });
});
