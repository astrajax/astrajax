import { describe, expect, it } from "vitest";
import {
  HOUSEHOLD_ACTIVITY_DAILY_SUMMARY,
  HOUSEHOLD_ACTIVITY_REPORT_FIELD_NAMES,
  HOUSEHOLD_ACTIVITY_REPORT_FIELDS,
  HOUSEHOLD_ACTIVITY_TABLES,
} from "./airtable-ids";

/**
 * Locks Household Activity Reports IDs used by Clive's Reading (#183) and the
 * daily-summary portal. A drifted field ID would silently write the weekly
 * reading pass to the wrong cell (or miss it).
 */
describe("household activity Reports Airtable IDs", () => {
  it("keeps the Reports table on the household activity set", () => {
    expect(HOUSEHOLD_ACTIVITY_TABLES.reports).toBe("tblFzWUIPSiIGZPln");
  });

  it("locks Clive's Reading as the only weekly-pass write cell", () => {
    expect(HOUSEHOLD_ACTIVITY_REPORT_FIELDS.clivesReading).toBe("fld8sWV4YYI8oJ0o1");
    expect(HOUSEHOLD_ACTIVITY_REPORT_FIELD_NAMES.clivesReading).toBe("Clive's Reading");
    expect(HOUSEHOLD_ACTIVITY_REPORT_FIELDS.body).toBe("fldt5UAqRVsm0mICy");
    expect(HOUSEHOLD_ACTIVITY_REPORT_FIELD_NAMES.body).toBe("Body");
  });

  it("locks the canonical daily summary example row", () => {
    expect(HOUSEHOLD_ACTIVITY_DAILY_SUMMARY).toEqual({
      exampleRecordId: "recSmDfozEz98ZTH2",
      agentSlug: "summarize-changes-daily",
      reportType: "Handoff",
    });
  });
});
