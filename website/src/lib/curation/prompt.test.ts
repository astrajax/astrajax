import { afterEach, describe, expect, it } from "vitest";
import { buildCurationMessages, resolveCurationModel } from "./prompt";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("buildCurationMessages", () => {
  it("keeps only the last eight history turns, trims content, and appends the new user message", () => {
    const history = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: ` turn-${index} `,
    }));

    const messages = buildCurationMessages(history, "  what next?  ");

    expect(messages).toHaveLength(9);
    expect(messages[0]).toEqual({ role: "user", content: "turn-2" });
    expect(messages[7]).toEqual({ role: "assistant", content: "turn-9" });
    expect(messages[8]).toEqual({ role: "user", content: "what next?" });
  });

  it("works with empty history", () => {
    expect(buildCurationMessages([], "hello")).toEqual([{ role: "user", content: "hello" }]);
  });
});

describe("resolveCurationModel", () => {
  it("prefers CURATION_MODEL, then ASSISTANT_MODEL, then the shipped default", () => {
    process.env.CURATION_MODEL = "claude-curation";
    process.env.ASSISTANT_MODEL = "claude-assistant";
    expect(resolveCurationModel()).toBe("claude-curation");

    delete process.env.CURATION_MODEL;
    expect(resolveCurationModel()).toBe("claude-assistant");

    delete process.env.ASSISTANT_MODEL;
    expect(resolveCurationModel()).toBe("claude-sonnet-4-6");
  });
});
