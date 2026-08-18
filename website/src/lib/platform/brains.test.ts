import { describe, expect, it } from "vitest";
import type { BrainMetrics } from "@/lib/platform/brain-health";
import {
  BRAINS_SHELF,
  cycleBrainSlug,
  deriveHealthBand,
  formatShrineAuditDate,
  getBrainBySlug,
  getBrainIndex,
  shrineArtForBand,
  shrineStillForBand,
  stillArtForBand,
} from "./brains";

function metrics(overrides: Partial<BrainMetrics> = {}): BrainMetrics {
  return {
    qaPassCount: 0,
    approvedRecordCount: 0,
    draftRecordCount: 0,
    staleRecordCount: 0,
    knownGaps: [],
    contradictionCount: 0,
    answerFailureRate: 0,
    answerFailureTrend: "stable",
    lastReviewed: "2026-08-01T00:00:00.000Z",
    confidenceByDomain: [],
    ...overrides,
  };
}

describe("deriveHealthBand", () => {
  it("returns thriving when the score stays at or above 85", () => {
    expect(
      deriveHealthBand(metrics(), 0, { signOffCurrent: true }),
    ).toBe("thriving");
  });

  it("drops through happy / okay / unhappy / rotten as score falls", () => {
    // 100 - (flags*5=20) - (sign-off 10) = 70 → happy
    expect(
      deriveHealthBand(metrics(), 4, { signOffCurrent: false }),
    ).toBe("happy");

    // 100 - (failure 40) - (sign-off 10) = 50 → okay
    expect(
      deriveHealthBand(metrics({ answerFailureRate: 40 }), 0, {
        signOffCurrent: false,
      }),
    ).toBe("okay");

    // 100 - (contradictions*12=48) - (sign-off 10) = 42 → unhappy
    expect(
      deriveHealthBand(metrics({ contradictionCount: 4 }), 0, {
        signOffCurrent: false,
      }),
    ).toBe("unhappy");

    // 100 - (contradictions*12=60) - (flags*5=20) - (sign-off 10) = 10 → rotten
    expect(
      deriveHealthBand(metrics({ contradictionCount: 5 }), 4, {
        signOffCurrent: false,
      }),
    ).toBe("rotten");
  });

  it("amplifies failure rate when the trend is worsening and softens when improving", () => {
    const mid = metrics({ answerFailureRate: 24 });
    expect(deriveHealthBand(mid, 0, { signOffCurrent: true })).toBe("happy"); // 100 - 24 = 76
    expect(
      deriveHealthBand(
        { ...mid, answerFailureTrend: "worsening" },
        0,
        { signOffCurrent: true },
      ),
    ).toBe("okay"); // 100 - 36 = 64
    expect(
      deriveHealthBand(
        { ...mid, answerFailureTrend: "improving" },
        0,
        { signOffCurrent: true },
      ),
    ).toBe("thriving"); // 100 - 12 = 88
  });
});

describe("shrine art maps (#161 operator portals)", () => {
  it("keeps loop, framed still, and unframed jar still paths for every band", () => {
    const bands = ["rotten", "unhappy", "okay", "happy", "thriving"] as const;
    for (const band of bands) {
      expect(shrineArtForBand(band)).toBe(`/brain/shrine-${band}.mp4`);
      expect(stillArtForBand(band)).toBe(`/brain/state-${band}.png`);
      expect(shrineStillForBand(band)).toBe(`/brain/shrine-${band}.jpg`);
    }
  });
});

describe("brain shelf navigation", () => {
  it("looks up seeded shelves and cycles wrap-around", () => {
    expect(getBrainBySlug("astrajax-chapter-1")?.name).toBe("AstraJax Chapter 1");
    expect(getBrainIndex("missing")).toBe(0);
    const first = BRAINS_SHELF[0]!.slug;
    const last = BRAINS_SHELF[BRAINS_SHELF.length - 1]!.slug;
    expect(cycleBrainSlug(first, -1)).toBe(last);
    expect(cycleBrainSlug(last, 1)).toBe(first);
  });

  it("formats shrine audit dates as dd/mm/yy without UTC day shift", () => {
    expect(formatShrineAuditDate(null)).toBe("Never");
    expect(formatShrineAuditDate("2026-07-01")).toBe("01/07/26");
    expect(formatShrineAuditDate("not-a-date")).toBe("not-a-date");
  });
});
