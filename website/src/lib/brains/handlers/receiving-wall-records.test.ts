import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import {
  RECEIVING_WALL_DRAFT_FILTER,
  buildReceivingWallFieldIds,
  handleReceivingWallRecords,
  mapDraftTruthToReceivingRecord,
} from "./receiving-wall-records";
import {
  RECEIVING_UNCATEGORISED_KEY,
  receivingCategoryKey,
} from "@/lib/receiving-wall";

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

function expectDraftOnlyRequest(requestedUrl: string) {
  expect(requestedUrl).toContain(BRAIN_WORKSHOP_TABLES.draftBrainTruth);
  expect(requestedUrl).toContain("pageSize=100");
  expect(requestedUrl).not.toContain("maxRecords=");
  expect(decodeURIComponent(requestedUrl)).toContain(
    `filterByFormula=${RECEIVING_WALL_DRAFT_FILTER}`,
  );
  expect(requestedUrl).not.toContain("Capture%20Source");
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
    expect(result.records.map((row) => row.category).sort()).toEqual([
      "Definition",
      "Goals & Priorities",
      "Open Questions",
    ]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requests only Draft rows and omits Capture Source until its field id is configured", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    const mockFetch = mockAirtableRecords([
      {
        id: "recDraft1",
        fields: {
          Title: "Core · Definition",
          "Canonical Text": "A working definition.",
          Status: "Draft",
          "Proposed By Agent": "Clive",
          "Brain Slug": "astrajax-chapter-1",
        },
      },
    ]);

    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("derived");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].recordId).toBe("recDraft1");
    expectDraftOnlyRequest(String(mockFetch.mock.calls[0]?.[0]));
    expect(buildReceivingWallFieldIds()).toEqual([
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.systemBrainName,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.systemBrainSlug,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
    ]);
  });

  it("includes Capture Source only when the field id env is set", () => {
    process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID = "fldCaptureSource";
    expect(buildReceivingWallFieldIds()).toContain("fldCaptureSource");
  });

  it("maps live Capture Source values and reports source as live", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID = "fldCaptureSource";
    const mockFetch = mockAirtableRecords([
      {
        id: "recExternal",
        fields: {
          Title: " Sentinel finding ",
          "Canonical Text": "A short canonical body.",
          "Brain Slug": "astrajax-chapter-1",
          Status: "Draft",
          "Proposed By Agent": "External Context Scanner",
          "Capture Source": "External Context Capture",
        },
      },
      {
        id: "recGuided",
        fields: {
          Title: "Manual note",
          "Canonical Text": "Human asked for this.",
          Status: "Draft",
          "Created By": "Matthew",
          "Capture Source": "User Guided Capture",
        },
      },
      {
        id: "recChat",
        fields: {
          Title: "Chat extract",
          "Canonical Text": "From a reviewed session.",
          Status: "Draft",
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
      status: "Draft",
    });
    expect(result.records[1].captureSource).toBe("user-guided");
    expect(result.records[2].captureSource).toBe("chat");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const requestedUrl = String(mockFetch.mock.calls[0][0]);
    expect(requestedUrl).toContain(BRAIN_WORKSHOP_TABLES.draftBrainTruth);
    expect(requestedUrl).toContain("pageSize=100");
    expect(requestedUrl).not.toContain("maxRecords=");
    expect(decodeURIComponent(requestedUrl)).toContain(
      `filterByFormula=${RECEIVING_WALL_DRAFT_FILTER}`,
    );
    expect(requestedUrl).toContain("fldCaptureSource");
  });

  it("paginates through an Airtable offset cursor and returns every page", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            records: [
              {
                id: "recPage1",
                fields: {
                  Title: "Page one",
                  "Canonical Text": "First page body.",
                  Status: "Draft",
                  "Proposed Category": "Governance",
                  "Proposed By Agent": "Clive",
                },
              },
            ],
            offset: "offsetPage2",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            records: [
              {
                id: "recPage2",
                fields: {
                  Title: "Page two",
                  "Canonical Text": "Second page body.",
                  Status: "Draft",
                  "Proposed Category": "Method",
                  "Proposed By Agent": "Clive",
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    const result = await handleReceivingWallRecords();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain("pageSize=100");
    expect(String(mockFetch.mock.calls[0]?.[0])).not.toContain("maxRecords=");
    expect(String(mockFetch.mock.calls[0]?.[0])).not.toContain("offset=");
    expect(String(mockFetch.mock.calls[1]?.[0])).toContain("offset=offsetPage2");
    expect(result.records.map((row) => row.recordId)).toEqual([
      "recPage1",
      "recPage2",
    ]);
    expect(result.records.map((row) => row.category)).toEqual([
      "Governance",
      "Method",
    ]);
  });

  it("maps Proposed Category onto record.category and leaves empty as undefined", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    mockAirtableRecords([
      {
        id: "recCategorised",
        fields: {
          Title: "Governance note",
          "Canonical Text": "A governance draft.",
          Status: "Draft",
          "Proposed Category": "Governance",
          "Proposed By Agent": "Clive's Man",
        },
      },
      {
        id: "recUncategorised",
        fields: {
          Title: "Loose note",
          "Canonical Text": "No category yet.",
          Status: "Draft",
          "Proposed Category": "   ",
          "Proposed By Agent": "Clive's Man",
        },
      },
    ]);

    const result = await handleReceivingWallRecords();

    expect(result.records).toHaveLength(2);
    expect(result.records[0].category).toBe("Governance");
    expect(result.records[1].category).toBeUndefined();
    expect(receivingCategoryKey(result.records[1])).toBe(RECEIVING_UNCATEGORISED_KEY);
  });

  it("infers capture source from proposer when Capture Source is absent or non-string", async () => {
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "patRead";
    mockAirtableRecords([
      {
        id: "recInferredExternal",
        fields: {
          Title: "Intake scrape",
          "Canonical Text": "Found by the scanner.",
          Status: "Draft",
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
          Status: "Draft",
          "Created By": "Chat Interaction Logger",
          "Capture Source": 12,
        },
      },
      {
        id: "recDefaultGuided",
        fields: {
          Title: "Untitled human ask",
          "Canonical Text": "Someone submitted this.",
          Status: "Draft",
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
    process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID = "fldCaptureSource";
    const longBody = "x".repeat(200);
    mockAirtableRecords([
      {
        id: "recNoTitle",
        fields: {
          Title: "   ",
          "Canonical Text": "Should be ignored.",
          Status: "Draft",
          "Capture Source": "External",
        },
      },
      {
        id: "recLong",
        fields: {
          Title: "Long truth",
          "Canonical Text": longBody,
          Status: "Draft",
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
        fields: { Title: "", "Canonical Text": "No title means drop.", Status: "Draft" },
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
          Status: "Draft",
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

describe("mapDraftTruthToReceivingRecord — Proposed Category", () => {
  it("maps a Proposed Category string onto category", () => {
    const mapped = mapDraftTruthToReceivingRecord({
      id: "recCat",
      fields: {
        Title: "Positioning draft",
        "Canonical Text": "Body.",
        Status: "Draft",
        "Proposed Category": "Positioning",
        "Proposed By Agent": "Clive's Man",
      },
    });
    expect(mapped?.category).toBe("Positioning");
  });

  it("leaves category undefined when the field is empty so the wall can bucket it", () => {
    const mapped = mapDraftTruthToReceivingRecord({
      id: "recNone",
      fields: {
        Title: "Loose draft",
        "Canonical Text": "Body.",
        Status: "Draft",
        "Proposed Category": "",
        "Proposed By Agent": "Clive's Man",
      },
    });
    expect(mapped?.category).toBeUndefined();
    expect(receivingCategoryKey(mapped!)).toBe(RECEIVING_UNCATEGORISED_KEY);
  });
});

describe("mapDraftTruthToReceivingRecord — System Brain destination", () => {
  it("surfaces name and slug when lookup arrays are populated", () => {
    const mapped = mapDraftTruthToReceivingRecord({
      id: "recLinked",
      fields: {
        Title: "Linked draft",
        "Canonical Text": "Body.",
        "Brain Slug": "legacy-slug",
        "System Brain Name": ["AstraJax Chapter 1"],
        "System Brain Slug": ["astrajax-chapter-1"],
        Status: "Draft",
        "Proposed By Agent": "Clive's Man",
      },
    });

    expect(mapped).toMatchObject({
      recordId: "recLinked",
      brainSlug: "legacy-slug",
      systemBrainName: "AstraJax Chapter 1",
      systemBrainSlug: "astrajax-chapter-1",
    });
  });

  it("falls back to legacy Brain Slug text when lookup is empty", () => {
    const mapped = mapDraftTruthToReceivingRecord({
      id: "recLegacy",
      fields: {
        Title: "Unlinked draft",
        "Canonical Text": "Body.",
        "Brain Slug": "astrajax-chapter-1",
        "System Brain Name": [],
        "System Brain Slug": [],
        Status: "Draft",
        "Proposed By Agent": "Clive's Man",
      },
    });

    expect(mapped).toMatchObject({
      recordId: "recLegacy",
      brainSlug: "astrajax-chapter-1",
      systemBrainSlug: "astrajax-chapter-1",
    });
    expect(mapped?.systemBrainName).toBeUndefined();
  });

  it("leaves both System Brain fields undefined when lookup and legacy are absent", () => {
    const mapped = mapDraftTruthToReceivingRecord({
      id: "recBare",
      fields: {
        Title: "Bare draft",
        "Canonical Text": "Body.",
        Status: "Draft",
        "Proposed By Agent": "Clive's Man",
      },
    });

    expect(mapped).toMatchObject({
      recordId: "recBare",
    });
    expect(mapped?.brainSlug).toBeUndefined();
    expect(mapped?.systemBrainName).toBeUndefined();
    expect(mapped?.systemBrainSlug).toBeUndefined();
  });
});
