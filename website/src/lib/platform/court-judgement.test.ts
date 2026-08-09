import { describe, expect, it, vi } from "vitest";
import {
  conveneMatter,
  createJudgementPaperTrail,
  DEFAULT_BENCH,
  docExecutionLine,
} from "./court";

describe("Court judgement helpers", () => {
  it("maps each judgement to a paper-trail action and only executes Doc on approve", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-06T10:00:00.000Z"));

    expect(createJudgementPaperTrail("approve", "Matthew")).toMatchObject({
      action: "Court judgement: approved for Doc execution",
      actor: "Matthew",
      timestamp: "2026-08-06T10:00:00.000Z",
    });
    expect(createJudgementPaperTrail("not-yet", "Matthew").action).toMatch(
      /not yet/,
    );
    expect(createJudgementPaperTrail("escalate", "Matthew").action).toMatch(
      /escalated/,
    );

    expect(docExecutionLine("approve")).toMatch(/Doc will execute/);
    expect(docExecutionLine("not-yet")).toBeNull();
    expect(docExecutionLine("escalate")).toBeNull();

    vi.useRealTimers();
  });

  it("lets Pam convene when seated, otherwise the first seat", () => {
    const withPam = conveneMatter(
      {
        title: "Ship the claim?",
        context: "Context",
        stakes: "Stakes",
      },
      DEFAULT_BENCH,
    );
    expect(withPam.convenerId).toBe("pam");
    expect(withPam.dialogue[0]?.line).toMatch(/I convene; I do not preside/);
    expect(withPam.dialogue).toHaveLength(DEFAULT_BENCH.length + 2);

    const withoutPam = conveneMatter(
      {
        title: "Ship the claim!!!",
        context: "Context",
        stakes: "Stakes",
      },
      ["clive", "doc"],
    );
    expect(withoutPam.convenerId).toBe("clive");
    expect(withoutPam.dialogue[0]?.line).toContain('"Ship the claim"');
    expect(withoutPam.dialogue[0]?.line).not.toMatch(/This door is always open/);
  });
});
