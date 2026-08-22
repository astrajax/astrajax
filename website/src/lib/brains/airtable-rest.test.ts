import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AIRTABLE_MAX_PAGES,
  AIRTABLE_URL_ATTACH_TIMEOUT_MS,
  airtableAttachFromUrl,
  airtableCreate,
  airtableFindOne,
  airtableSelect,
  airtableUploadAttachment,
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

  it("attaches from a URL with the longer URL-attach timeout budget", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "recAttach1",
          fields: { Attachment: [{ url: "https://cdn.example/f.pdf" }] },
        }),
        { status: 200 },
      ),
    );

    const record = await airtableAttachFromUrl(
      "appTest",
      "tblTest",
      "recAttach1",
      "Attachment",
      "patToken",
      {
        url: "https://signed.example/onboarding-uploads/f.pdf?sig=1",
        filename: "f.pdf",
      },
    );

    expect(record.id).toBe("recAttach1");
    expect(AIRTABLE_URL_ATTACH_TIMEOUT_MS).toBe(60_000);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.airtable.com/v0/appTest/tblTest/recAttach1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          fields: {
            Attachment: [
              {
                url: "https://signed.example/onboarding-uploads/f.pdf?sig=1",
                filename: "f.pdf",
              },
            ],
          },
        }),
      }),
    );
  });

  describe("airtableUploadAttachment host fallback", () => {
    const file = {
      filename: "brief.pdf",
      contentType: "application/pdf",
      base64: "cGRmLWJ5dGVz",
    };

    it("posts to content.airtable.com first", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "recUp1", fields: {} }), { status: 200 }),
      );

      const record = await airtableUploadAttachment(
        "appTest",
        "recUp1",
        "fldAttach",
        "patToken",
        file,
      );

      expect(record.id).toBe("recUp1");
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(String(mockFetch.mock.calls[0]?.[0])).toBe(
        "https://content.airtable.com/v0/appTest/recUp1/fldAttach/uploadAttachment",
      );
      expect(mockFetch.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            contentType: file.contentType,
            file: file.base64,
            filename: file.filename,
          }),
        }),
      );
    });

    it("falls back to api.airtable.com when content host answers 404", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(new Response("gone", { status: 404 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "recUp2", fields: {} }), {
            status: 200,
          }),
        );

      const record = await airtableUploadAttachment(
        "appTest",
        "recUp2",
        "fldAttach",
        "patToken",
        file,
      );

      expect(record.id).toBe("recUp2");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(String(mockFetch.mock.calls[0]?.[0])).toContain("content.airtable.com");
      expect(String(mockFetch.mock.calls[1]?.[0])).toBe(
        "https://api.airtable.com/v0/appTest/recUp2/fldAttach/uploadAttachment",
      );
    });

    it("falls back when content host answers 405", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(new Response("method not allowed", { status: 405 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "recUp3", fields: {} }), {
            status: 200,
          }),
        );

      await expect(
        airtableUploadAttachment("appTest", "recUp3", "fldAttach", "patToken", file),
      ).resolves.toMatchObject({ id: "recUp3" });
      expect(String(mockFetch.mock.calls[1]?.[0])).toContain("api.airtable.com");
    });

    it("does not retry a non-host-missing failure (e.g. 403)", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "forbidden" } }), {
          status: 403,
        }),
      );

      await expect(
        airtableUploadAttachment("appTest", "recUp4", "fldAttach", "patToken", file),
      ).rejects.toThrow(/Airtable API error 403/);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("rethrows the last host-missing error when both hosts fail", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(new Response("missing", { status: 404 }))
        .mockResolvedValueOnce(new Response("still missing", { status: 404 }));

      await expect(
        airtableUploadAttachment("appTest", "recUp5", "fldAttach", "patToken", file),
      ).rejects.toThrow(/Airtable API error 404/);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it("escapes single quotes for Airtable formula literals", () => {
    expect(escapeAirtableString("plain")).toBe("plain");
    expect(escapeAirtableString("o'brien")).toBe("o''brien");
    expect(escapeAirtableString("a'b'c")).toBe("a''b''c");
  });
});
