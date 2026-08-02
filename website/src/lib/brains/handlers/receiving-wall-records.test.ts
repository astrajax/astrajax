import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import {
  RECEIVING_WALL_DRAFT_FILTER,
  buildReceivingWallFieldIds,
  handleReceivingWallRecords,
} from "./receiving-wall-records";

describe("Receiving wall draft reads", () => {
  beforeEach(() => {
    process.env.BRAIN_WORKSHOP_BASE_ID = "appWorkshop";
    process.env.BRAIN_WORKSHOP_READ_TOKEN = "read-token";
    delete process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BRAIN_WORKSHOP_BASE_ID;
    delete process.env.BRAIN_WORKSHOP_READ_TOKEN;
    delete process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID;
  });

  it("requests only Draft rows and omits Capture Source until its field id is configured", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
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
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", mockFetch);

    const result = await handleReceivingWallRecords();

    expect(result.source).toBe("derived");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].recordId).toBe("recDraft1");

    const requestedUrl = String(mockFetch.mock.calls[0]?.[0]);
    expect(decodeURIComponent(requestedUrl)).toContain(
      `filterByFormula=${RECEIVING_WALL_DRAFT_FILTER}`,
    );
    expect(requestedUrl).toContain(BRAIN_WORKSHOP_TABLES.draftBrainTruth);
    expect(buildReceivingWallFieldIds()).toEqual([
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.title,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.canonicalText,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.brainSlug,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedCategory,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.proposedByAgent,
      BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.createdBy,
    ]);
    expect(requestedUrl).not.toContain("Capture%20Source");
  });

  it("includes Capture Source only when the field id env is set", () => {
    process.env.BRAIN_WORKSHOP_CAPTURE_SOURCE_FIELD_ID = "fldCaptureSource";
    expect(buildReceivingWallFieldIds()).toContain("fldCaptureSource");
  });
});
