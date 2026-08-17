import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateAirtableReview } from "./airtable-review";

describe("updateAirtableReview", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("PATCHes with the review token and typecast, never a write-token path", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "recActivity1",
          fields: { "Review Status": "Reviewed" },
        }),
        { status: 200 },
      ),
    );

    const result = await updateAirtableReview({
      baseId: "appHousehold",
      tableId: "tblActivity",
      recordId: "recActivity1",
      reviewToken: "pat_review_only",
      fields: { "Review Status": "Reviewed", "Human Quality": 4 },
    });

    expect(result.id).toBe("recActivity1");
    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe(
      "https://api.airtable.com/v0/appHousehold/tblActivity/recActivity1?typecast=true",
    );
    expect(init?.method).toBe("PATCH");
    expect(init?.headers).toMatchObject({
      Authorization: "Bearer pat_review_only",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      fields: { "Review Status": "Reviewed", "Human Quality": 4 },
    });
  });

  it("throws a clear error when Airtable rejects the review update", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("forbidden", { status: 403 }));

    await expect(
      updateAirtableReview({
        baseId: "appHousehold",
        tableId: "tblActivity",
        recordId: "recActivity1",
        reviewToken: "pat_review_only",
        fields: { "Review Status": "Reviewed" },
      }),
    ).rejects.toThrow(/review update failed \(403\)/);
  });
});
