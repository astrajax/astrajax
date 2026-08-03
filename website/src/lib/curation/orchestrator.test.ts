import { describe, expect, it } from "vitest";
import { sanitiseCurationHistory } from "./orchestrator";

describe("sanitiseCurationHistory", () => {
  it("returns an empty list for non-arrays and empty content", () => {
    expect(sanitiseCurationHistory(undefined)).toEqual([]);
    expect(sanitiseCurationHistory({ role: "user" })).toEqual([]);
    expect(
      sanitiseCurationHistory([{ role: "user", content: "   " }, { role: "system", content: "x" }]),
    ).toEqual([]);
  });

  it("keeps only the last ten trimmed user/assistant turns and caps length", () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: ` turn-${index} `,
    }));
    const sanitised = sanitiseCurationHistory(history);

    expect(sanitised).toHaveLength(10);
    expect(sanitised[0]).toEqual({ role: "user", content: "turn-2" });
    expect(sanitised[9]).toEqual({ role: "assistant", content: "turn-11" });

    const long = "x".repeat(900);
    expect(sanitiseCurationHistory([{ role: "user", content: long }])[0]?.content).toHaveLength(
      800,
    );
  });
});
