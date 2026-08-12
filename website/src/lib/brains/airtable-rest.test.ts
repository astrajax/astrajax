import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AIRTABLE_MAX_PAGES,
  airtableCreate,
  airtableFindOne,
  airtableSelect,
  escapeAirtableString,
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

  it("follows offset when paginate is true", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            records: [{ id: "rec1", fields: {} }],
            offset: "page2",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ records: [{ id: "rec2", fields: {} }] }), {
          status: 200,
        }),
      );

    const records = await airtableSelect("appTest", "tblTest", "patToken", {
      paginate: true,
    });
    expect(records.map((row) => row.id)).toEqual(["rec1", "rec2"]);
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain("pageSize=100");
    expect(String(mockFetch.mock.calls[0]?.[0])).not.toContain("maxRecords=");
    expect(String(mockFetch.mock.calls[1]?.[0])).toContain("offset=page2");
  });

  it("stops paginating at AIRTABLE_MAX_PAGES even when offset continues", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);
      const offset = new URL(url).searchParams.get("offset");
      const page = offset ? Number.parseInt(offset.replace("p", ""), 10) : 0;
      return new Response(
        JSON.stringify({
          records: [{ id: `rec${page}`, fields: {} }],
          offset: `p${page + 1}`,
        }),
        { status: 200 },
      );
    });

    const records = await airtableSelect("appTest", "tblTest", "patToken", {
      paginate: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(AIRTABLE_MAX_PAGES);
    expect(records).toHaveLength(AIRTABLE_MAX_PAGES);
    expect(records[0]?.id).toBe("rec0");
    expect(records[AIRTABLE_MAX_PAGES - 1]?.id).toBe(
      `rec${AIRTABLE_MAX_PAGES - 1}`,
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

  it("escapes single quotes for Airtable formula literals", () => {
    expect(escapeAirtableString("plain")).toBe("plain");
    expect(escapeAirtableString("o'brien")).toBe("o''brien");
    expect(escapeAirtableString("a'b'c")).toBe("a''b''c");
  });
});
