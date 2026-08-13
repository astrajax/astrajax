import { describe, expect, it } from "vitest";
import {
  SEED_HONESTY_LINE,
  mergeOperatorWallPayload,
  wallHonestyNote,
} from "./receiving-wall-portals";

describe("wallHonestyNote", () => {
  it("returns the plain stand-in line for seed walls", () => {
    const payload = mergeOperatorWallPayload({ source: "seed" });
    expect(wallHonestyNote(payload)).toBe(SEED_HONESTY_LINE);
  });

  it("hides engineer jargon behind the stand-in line", () => {
    const payload = mergeOperatorWallPayload({
      source: "derived",
      message: "Draft Brain Truth PAT missing — cannot read Workshop V1.",
    });
    expect(wallHonestyNote(payload)).toBe(SEED_HONESTY_LINE);
  });

  it("keeps a plain live message", () => {
    const payload = mergeOperatorWallPayload({
      source: "live",
      message: "The shelf is a little behind this morning.",
      portals: {
        judgement: { source: "live" },
        health: { source: "live" },
        reports: { source: "live" },
      },
    });
    expect(wallHonestyNote(payload)).toBe("The shelf is a little behind this morning.");
  });

  it("stays quiet when live portals are fully live", () => {
    const payload = mergeOperatorWallPayload({
      source: "live",
      portals: {
        judgement: { source: "live" },
        health: { source: "live" },
        reports: { source: "live" },
      },
    });
    expect(wallHonestyNote(payload)).toBeNull();
  });
});
