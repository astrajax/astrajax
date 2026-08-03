import { afterEach, describe, expect, it } from "vitest";
import { calculateModelCost } from "./rate-card";

afterEach(() => {
  delete process.env.PLATFORM_MODEL_RATE_CARD_JSON;
});

describe("calculateModelCost", () => {
  it("returns an empty object when no rate card is configured", () => {
    expect(calculateModelCost("claude-sonnet-4-6", { inputTokens: 100 })).toEqual({});
  });

  it("throws on invalid rate-card JSON", () => {
    process.env.PLATFORM_MODEL_RATE_CARD_JSON = "{not-json";
    expect(() =>
      calculateModelCost("claude-sonnet-4-6", { inputTokens: 100 }),
    ).toThrow(/invalid JSON/);
  });

  it("returns version without cost when the model is missing from the card", () => {
    process.env.PLATFORM_MODEL_RATE_CARD_JSON = JSON.stringify({
      version: "2026-07-26",
      models: {
        "other-model": { inputPerMillion: 1, outputPerMillion: 2 },
      },
    });

    expect(
      calculateModelCost("claude-sonnet-4-6", {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      }),
    ).toEqual({ rateCardVersion: "2026-07-26" });
  });

  it("returns version without cost when usage tokens are both absent", () => {
    process.env.PLATFORM_MODEL_RATE_CARD_JSON = JSON.stringify({
      version: "2026-07-26",
      models: {
        "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15 },
      },
    });

    expect(calculateModelCost("claude-sonnet-4-6", {})).toEqual({
      rateCardVersion: "2026-07-26",
    });
  });

  it("treats missing input or output token counts as zero", () => {
    process.env.PLATFORM_MODEL_RATE_CARD_JSON = JSON.stringify({
      version: "2026-07-26",
      models: {
        "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15 },
      },
    });

    expect(
      calculateModelCost("claude-sonnet-4-6", { outputTokens: 2_000_000 }),
    ).toEqual({ rateCardVersion: "2026-07-26", costUsd: 30 });
  });
});
