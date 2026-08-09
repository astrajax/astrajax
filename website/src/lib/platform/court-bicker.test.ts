import { describe, expect, it } from "vitest";
import { DEFAULT_BENCH } from "./court";
import {
  extractJsonFromText,
  filterSeatedBickerTurns,
  isOpeningFlurry,
  parseAttendees,
  seedBickerRotation,
} from "./court-bicker";

describe("parseAttendees", () => {
  it("falls back to the default bench when raw is not an array", () => {
    expect(parseAttendees(null)).toEqual(DEFAULT_BENCH);
    expect(parseAttendees("clive")).toEqual(DEFAULT_BENCH);
  });

  it("keeps valid unique attendants and drops unknowns", () => {
    expect(parseAttendees(["pam", "judge", "pam", "halvard", "ghost"])).toEqual([
      "pam",
      "halvard",
    ]);
  });

  it("rejects an empty or oversized bench", () => {
    expect(parseAttendees([])).toEqual(DEFAULT_BENCH);
    expect(
      parseAttendees(["clive", "pam", "doc", "lazlo", "clive-man", "kate"]),
    ).toEqual(DEFAULT_BENCH);
  });
});

describe("extractJsonFromText", () => {
  it("parses the first JSON object even when wrapped in prose", () => {
    const parsed = extractJsonFromText(
      'Here you go:\n{"turns":[{"roleId":"pam","line":"Evidence?"}]}\nThanks.',
    );
    expect(parsed.turns).toEqual([{ roleId: "pam", line: "Evidence?" }]);
  });

  it("returns empty turns for missing or broken JSON", () => {
    expect(extractJsonFromText("no json here")).toEqual({ turns: [] });
    expect(extractJsonFromText("{not-json")).toEqual({ turns: [] });
  });
});

describe("isOpeningFlurry", () => {
  it("honours an explicit client flag", () => {
    expect(isOpeningFlurry(true, 12, 99)).toBe(true);
    expect(isOpeningFlurry(false, 0, 5)).toBe(true);
  });

  it("opens a flurry only on an empty transcript inside the call window", () => {
    expect(isOpeningFlurry(undefined, 0, 6)).toBe(true);
    expect(isOpeningFlurry(undefined, 0, 7)).toBe(false);
    expect(isOpeningFlurry(undefined, 1, 1)).toBe(false);
  });
});

describe("seedBickerRotation", () => {
  it("never quotes attendants who are not seated", () => {
    const turns = seedBickerRotation(0, ["clive", "pam"], true);
    expect(turns.length).toBeGreaterThan(0);
    expect(turns.every((turn) => turn.roleId === "clive" || turn.roleId === "pam")).toBe(
      true,
    );
  });

  it("uses a larger batch for flurry / empty transcript, smaller for continues", () => {
    const flurry = seedBickerRotation(0, DEFAULT_BENCH, true);
    const continueBatch = seedBickerRotation(3, DEFAULT_BENCH, false);
    expect(flurry.length).toBeGreaterThan(5);
    expect(flurry.length).toBeLessThanOrEqual(10);
    expect(continueBatch.length).toBeLessThanOrEqual(5);
    expect(continueBatch.length).toBeGreaterThan(0);
  });

  it("returns an empty list when the seat filter empties the pool", () => {
    // Every seeded line uses pool members; an impossible filter is empty seats.
    expect(seedBickerRotation(0, [], false)).toEqual([]);
  });
});

describe("filterSeatedBickerTurns", () => {
  it("keeps seated attendants, judge, and user; drops absentees and junk", () => {
    const turns = filterSeatedBickerTurns(
      [
        { roleId: "pam", line: "Evidence?" },
        { roleId: "kate", line: "I am not seated." },
        { roleId: "judge", line: "The chair is yours." },
        { roleId: "user", line: "What about cost?" },
        { roleId: "pam", line: "x".repeat(400) },
        { roleId: "pam" },
        null,
        "noise",
      ],
      ["clive", "pam", "doc"],
    );

    expect(turns.map((turn) => turn.roleId)).toEqual([
      "pam",
      "judge",
      "user",
      "pam",
    ]);
    expect(turns[3].line).toHaveLength(300);
  });
});
