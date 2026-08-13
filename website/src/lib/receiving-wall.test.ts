import { describe, expect, it } from "vitest";
import {
  CAPTURE_SOURCE_BLURB,
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_ORDER,
  CAPTURE_SOURCE_TINT,
  RECEIVING_CATEGORY_ORDER,
  RECEIVING_UNCATEGORISED_KEY,
  isReceivingRecordActioned,
  listPopulatedReceivingCategories,
  receivingCategoryKey,
  receivingCategoryLabel,
  receivingCategoryTint,
  RECEIVING_PORTAL_IDS,
  formatReportPeriod,
  isReceivingPortalId,
  weakestBaySource,
  type CaptureSource,
  type ReceivingRecord,
} from "./receiving-wall";

describe("Receiving Wall capture-source maps", () => {
  it("keeps label, blurb, and tint entries for every ordered source", () => {
    expect(CAPTURE_SOURCE_ORDER).toEqual(["external", "user-guided", "chat"]);

    for (const source of CAPTURE_SOURCE_ORDER) {
      expect(CAPTURE_SOURCE_LABEL[source].length).toBeGreaterThan(0);
      expect(CAPTURE_SOURCE_BLURB[source].length).toBeGreaterThan(0);
      expect(CAPTURE_SOURCE_TINT[source]).toMatch(/^#[0-9a-f]{6}$/i);
    }

    const keys = Object.keys(CAPTURE_SOURCE_LABEL) as CaptureSource[];
    expect(keys.sort()).toEqual([...CAPTURE_SOURCE_ORDER].sort());
  });
});

describe("Receiving Wall Proposed Category helpers", () => {
  it("uses the Airtable single-select choice order", () => {
    expect(RECEIVING_CATEGORY_ORDER).toEqual([
      "Business Definition",
      "Positioning",
      "Method",
      "Offers",
      "Proof",
      "Workflow Rule",
      "Governance",
      "Goals & Priorities",
      "Definition",
      "Open Questions",
    ]);
  });

  it("routes blank category to the uncategorised sentinel", () => {
    expect(receivingCategoryKey({})).toBe(RECEIVING_UNCATEGORISED_KEY);
    expect(receivingCategoryKey({ category: "  " })).toBe(RECEIVING_UNCATEGORISED_KEY);
    expect(receivingCategoryLabel(RECEIVING_UNCATEGORISED_KEY)).toBe("Uncategorised");
  });

  it("lists only populated categories, appends unknown before uncategorised", () => {
    const records: ReceivingRecord[] = [
      {
        recordId: "a",
        title: "A",
        snippet: "A",
        provenance: "x",
        captureSource: "chat",
        category: "Open Questions",
      },
      {
        recordId: "b",
        title: "B",
        snippet: "B",
        provenance: "x",
        captureSource: "external",
        category: "Governance",
      },
      {
        recordId: "c",
        title: "C",
        snippet: "C",
        provenance: "x",
        captureSource: "user-guided",
      },
      {
        recordId: "d",
        title: "D",
        snippet: "D",
        provenance: "x",
        captureSource: "chat",
        category: "Brand Voice",
      },
    ];

    expect(listPopulatedReceivingCategories(records)).toEqual([
      "Governance",
      "Open Questions",
      "Brand Voice",
      RECEIVING_UNCATEGORISED_KEY,
    ]);
    expect(listPopulatedReceivingCategories(records)).not.toContain(
      "Business Definition",
    );
  });

  it("returns a tint for known and unknown categories", () => {
    expect(receivingCategoryTint("Governance")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(receivingCategoryTint("Brand Voice")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(receivingCategoryTint(RECEIVING_UNCATEGORISED_KEY)).toMatch(
      /^#[0-9a-f]{6}$/i,
    );
  });
});

describe("isReceivingRecordActioned", () => {
  it("treats Approved / Promoted / Quarantined / Rejected as already acted on", () => {
    expect(isReceivingRecordActioned("Approved", undefined)).toBe(true);
    expect(isReceivingRecordActioned("Promoted", undefined)).toBe(true);
    expect(isReceivingRecordActioned("Quarantined", undefined)).toBe(true);
    expect(isReceivingRecordActioned("Rejected", undefined)).toBe(true);
    expect(isReceivingRecordActioned("Draft", undefined)).toBe(false);
  });

  it("ignores blank status and respects a custom accept status from the server", () => {
    expect(isReceivingRecordActioned(undefined, undefined)).toBe(false);
    expect(isReceivingRecordActioned("   ", undefined)).toBe(false);
    expect(isReceivingRecordActioned("Wall Accepted", "Wall Accepted")).toBe(true);
    expect(isReceivingRecordActioned("Wall Accepted", "Something Else")).toBe(false);
    expect(isReceivingRecordActioned(" Wall Accepted ", "Wall Accepted")).toBe(true);
  });
});

describe("operator portals", () => {
  it("names exactly three doors and guards the ids", () => {
    expect(RECEIVING_PORTAL_IDS).toEqual(["judgement", "health", "reports"]);
    expect(isReceivingPortalId("judgement")).toBe(true);
    expect(isReceivingPortalId("reports")).toBe(true);
    expect(isReceivingPortalId("Business Definition")).toBe(false);
    expect(isReceivingPortalId(null)).toBe(false);
    expect(isReceivingPortalId(undefined)).toBe(false);
  });

  it("labels the wall by its least-live bay", () => {
    expect(weakestBaySource(["live", "live"])).toBe("live");
    expect(weakestBaySource(["live", "derived"])).toBe("derived");
    expect(weakestBaySource(["live", "derived", "seed"])).toBe("seed");
    expect(weakestBaySource([])).toBe("live");
  });
});

describe("formatReportPeriod", () => {
  it("shows one date for a single day and a range across days", () => {
    expect(formatReportPeriod("2026-08-13", "2026-08-13")).toBe("13 Aug 2026");
    expect(formatReportPeriod("2026-07-28", "2026-08-03")).toBe(
      "28 Jul 2026 – 3 Aug 2026",
    );
  });

  it("copes with one side missing, blank values, and unparseable dates", () => {
    expect(formatReportPeriod(undefined, "2026-08-13")).toBe("13 Aug 2026");
    expect(formatReportPeriod("2026-08-13", undefined)).toBe("13 Aug 2026");
    expect(formatReportPeriod("  ", "  ")).toBeUndefined();
    expect(formatReportPeriod(undefined, undefined)).toBeUndefined();
    expect(formatReportPeriod(undefined, "this morning")).toBe("this morning");
  });
});
