import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { handleReceivingWallRecords } from "./receiving-wall-records";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  delete process.env.BRAIN_WORKSHOP_READ_TOKEN;
  delete process.env.BRAIN_WORKSHOP_WRITE_TOKEN;
  delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
  delete process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID;
  process.env.BRAIN_WORKSHOP_BASE_ID = "appWorkshopTest";
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

function mockAirtableRecords(
  records: Array<{ id: string; fields: Record<string, unknown> }>,
) {
  const mockFetch = vi.mocked(fetch);
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ records }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  return mockFetch;
}

describe("handleReceivingWallRecords", () => {
  it("returns seeded records when the Workshop read token is missing", async () => {
    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("seed");
    expect(result.message).toMatch(/not configured/i);
    expect(result.records).toHaveLength(3);
    expect(result.records.map((row) => row.captureSource).sort()).toEqual([
      "chat",
      "external",
      "user-guided",
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps live Capture Source values and reports source as live", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    mockAirtableRecords([
      {
        id: "recExternal",
        fields: {
          Title: " Sentinel finding ",
          "Canonical Text": "A short canonical body.",
          "Brain Slug": "astrajax-chapter-1",
          Status: "Ready for review",
          "Proposed By Agent": "External Context Scanner",
          "Capture Source": "External Context Capture",
        },
      },
      {
        id: "recGuided",
        fields: {
          Title: "Manual note",
          "Canonical Text": "Human asked for this.",
          "Created By": "Matthew",
          "Capture Source": "User Guided Capture",
        },
      },
      {
        id: "recChat",
        fields: {
          Title: "Chat extract",
          "Canonical Text": "From a reviewed session.",
          "Proposed By Agent": "Clive's Man",
          "Capture Source": "Chat Session",
        },
      },
    ]);

    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("live");
    expect(result.records).toHaveLength(3);
    expect(result.records[0]).toMatchObject({
      recordId: "recExternal",
      title: "Sentinel finding",
      snippet: "A short canonical body.",
      provenance: "External Context Scanner",
      captureSource: "external",
      brainSlug: "astrajax-chapter-1",
      status: "Ready for review",
    });
    expect(result.records[1].captureSource).toBe("user-guided");
    expect(result.records[2].captureSource).toBe("chat");

    const mockFetch = vi.mocked(fetch);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestedUrl = String(mockFetch.mock.calls[0][0]);
    expect(requestedUrl).toContain(BRAIN_WORKSHOP_TABLES.draftBrainTruth);
    expect(requestedUrl).toContain("maxRecords=10");
  });

  it("infers capture source from proposer when Capture Source is absent or non-string", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    mockAirtableRecords([
      {
        id: "recInferredExternal",
        fields: {
          Title: "Intake scrape",
          "Canonical Text": "Found by the scanner.",
          "Proposed By Agent": "Context Sentinel",
          // Airtable can surface unexpected types; the PR #43 fix must not throw.
          "Capture Source": ["not", "a", "string"],
        },
      },
      {
        id: "recInferredChat",
        fields: {
          Title: "Session note",
          "Canonical Text": "From Clive.",
          "Created By": "Chat Interaction Logger",
          "Capture Source": 12,
        },
      },
      {
        id: "recDefaultGuided",
        fields: {
          Title: "Untitled human ask",
          "Canonical Text": "Someone submitted this.",
          "Created By": "Matthew",
          "Capture Source": null,
        },
      },
    ]);

    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("derived");
    expect(result.records.map((row) => [row.recordId, row.captureSource])).toEqual([
      ["recInferredExternal", "external"],
      ["recInferredChat", "chat"],
      ["recDefaultGuided", "user-guided"],
    ]);
  });

  it("skips untitled rows, truncates long snippets, and falls back to seed on empty mapping", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    const longBody = "x".repeat(200);
    mockAirtableRecords([
      {
        id: "recNoTitle",
        fields: {
          Title: "   ",
          "Canonical Text": "Should be ignored.",
          "Capture Source": "External",
        },
      },
      {
        id: "recLong",
        fields: {
          Title: "Long truth",
          "Canonical Text": longBody,
          "Proposed By Agent": "Doc Brain Base Builder",
          "Capture Source": "external sentinel",
        },
      },
    ]);

    const withContent = await handleReceivingWallRecords();
    expect(withContent.source).toBe("live");
    expect(withContent.records).toHaveLength(1);
    expect(withContent.records[0].snippet).toBe(`${"x".repeat(160)}…`);
    expect(withContent.records[0].snippet).toHaveLength(161);

    mockAirtableRecords([
      {
        id: "recBlank",
        fields: { Title: "", "Canonical Text": "No title means drop." },
      },
    ]);
    const emptyMapped = await handleReceivingWallRecords();
    expect(emptyMapped.source).toBe("seed");
    expect(emptyMapped.message).toMatch(/no pending draft truths/i);
    expect(emptyMapped.records).toHaveLength(3);
  });

  it("falls back to seed records when Airtable read fails", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "FORBIDDEN" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("seed");
    expect(result.records).toHaveLength(3);
    expect(result.message).toBeTruthy();
  });

  it("uses title as snippet when canonical text is missing", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    mockAirtableRecords([
      {
        id: "recTitleOnly",
        fields: {
          Title: "Title stands in",
          "Proposed By Agent": "Manual intake",
          "Capture Source": "guided manual",
        },
      },
    ]);

    const result = await handleReceivingWallRecords();

    expect(result.records).toHaveLength(1);
    expect(result.records[0].snippet).toBe("Title stands in");
    expect(result.records[0].canonicalText).toBe("");
    expect(result.records[0].provenance).toBe("Manual intake");
    expect(result.records[0].captureSource).toBe("user-guided");
  });
});
