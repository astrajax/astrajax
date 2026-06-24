import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  airtableCreate,
  airtableFindOne,
  airtableSelect,
} from "./airtable-rest";

describe("airtable-rest", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a record via POST", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "recNew", fields: { Name: "Test" } }), {
        status: 200,
      }),
    );

    const record = await airtableCreate("appTest", "tblTest", "patToken", { Name: "Test" });
    expect(record.id).toBe("recNew");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.airtable.com/v0/appTest/tblTest"),
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });

  it("selects records via GET", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ records: [{ id: "rec1", fields: {} }] }), {
        status: 200,
      }),
    );

    const records = await airtableSelect("appTest", "tblTest", "patToken", {
      filterByFormula: "{Status}='Active'",
    });
    expect(records).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("filterByFormula"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("throws on non-2xx without echoing response body", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response("secret error body with patToken1234567890", { status: 403 }),
    );

    await expect(
      airtableFindOne("appTest", "tblTest", "patToken", "{ID}='x'"),
    ).rejects.toThrow("Airtable API error 403");
  });
});
