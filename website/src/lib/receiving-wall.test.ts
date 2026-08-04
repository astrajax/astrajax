import { describe, expect, it } from "vitest";
import {
  CAPTURE_SOURCE_BLURB,
  CAPTURE_SOURCE_LABEL,
  CAPTURE_SOURCE_ORDER,
  CAPTURE_SOURCE_TINT,
  isReceivingRecordActioned,
  type CaptureSource,
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
