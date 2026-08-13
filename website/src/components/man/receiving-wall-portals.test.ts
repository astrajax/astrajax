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

  it("owns up to a bay that is standing in even without a message", () => {
    const payload = mergeOperatorWallPayload({
      source: "live",
      portals: {
        judgement: { source: "live" },
        health: { source: "live" },
        reports: { source: "seed" },
      },
    });
    expect(wallHonestyNote(payload)).toBe(SEED_HONESTY_LINE);
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

describe("mergeOperatorWallPayload", () => {
  it("leaves a live-but-empty letters bay empty instead of inventing one", () => {
    const payload = mergeOperatorWallPayload({
      source: "live",
      records: [],
      held: [],
      proposals: [],
      reports: [],
      brains: [],
      portals: {
        judgement: { source: "live" },
        health: { source: "live" },
        reports: { source: "live", message: "No written reports filed yet." },
      },
    });

    expect(payload.reports).toEqual([]);
    expect(payload.brains).toEqual([]);
  });

  it("stands in for a letters bay that could not be read", () => {
    const payload = mergeOperatorWallPayload({
      source: "live",
      reports: [],
      portals: {
        judgement: { source: "live" },
        health: { source: "live" },
        reports: { source: "seed" },
      },
    });

    expect(payload.reports).toHaveLength(1);
  });
});
