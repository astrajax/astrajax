import { describe, expect, it } from "vitest";
import { HOUSEHOLD_ACTIVITY_FIELDS } from "./ids";
import { codeManifest } from "./manifest";
import { mapEnvelopeToActivityFields } from "./record-mapper";
import type { PlatformActivityEnvelope } from "./types";

const fields = HOUSEHOLD_ACTIVITY_FIELDS;

function baseEnvelope(
  overrides: Partial<PlatformActivityEnvelope> = {},
): PlatformActivityEnvelope {
  return {
    eventId: "evt-platform-test-turn-1",
    sequence: 3,
    publicSessionId: "platform-test",
    sessionRecordId: "recSession123",
    eventType: "Turn",
    timestamp: "2026-08-03T10:00:00.000Z",
    summary: "Ask Clive exchange",
    model: "claude-sonnet-4-6",
    manifest: codeManifest({ source: "ask-clive", promptVersion: "ask-clive-v1" }),
    ...overrides,
  };
}

describe("mapEnvelopeToActivityFields", () => {
  it("maps required Household Activity fields and defaults review/outcome", () => {
    const mapped = mapEnvelopeToActivityFields(baseEnvelope());

    expect(mapped[fields.summary]).toBe("Ask Clive exchange");
    expect(mapped[fields.eventId]).toBe("evt-platform-test-turn-1");
    expect(mapped[fields.sequence]).toBe(3);
    expect(mapped[fields.sessionId]).toBe("platform-test");
    expect(mapped[fields.sessionLink]).toEqual(["recSession123"]);
    expect(mapped[fields.eventType]).toBe("Turn");
    expect(mapped[fields.timestamp]).toBe("2026-08-03T10:00:00.000Z");
    expect(mapped[fields.model]).toBe("claude-sonnet-4-6");
    expect(mapped[fields.outcome]).toBe("Completed");
    expect(mapped[fields.reviewStatus]).toBe("Unreviewed");
    expect(mapped[fields.detail]).toBe("{}");
    expect(mapped[fields.contextReferenced]).toContain("prompt:ask-clive-v1");
    expect(mapped).not.toHaveProperty(fields.userMessage);
    expect(mapped).not.toHaveProperty(fields.tokensIn);
    expect(mapped).not.toHaveProperty(fields.costUsd);
  });

  it("includes optional prompt, usage, cost, and target fields when present", () => {
    const mapped = mapEnvelopeToActivityFields(
      baseEnvelope({
        userMessage: "What is the thesis?",
        replyDigest: "Domain experts become architects.",
        outcome: "fallback",
        targetUrl: "https://example.test/ask-clive",
        detail: { surface: "ask-clive" },
        usage: { inputTokens: 120, outputTokens: 40 },
        costUsd: 0.012,
      }),
    );

    expect(mapped[fields.userMessage]).toBe("What is the thesis?");
    expect(mapped[fields.replyDigest]).toBe("Domain experts become architects.");
    expect(mapped[fields.outcome]).toBe("fallback");
    expect(mapped[fields.targetUrl]).toBe("https://example.test/ask-clive");
    expect(mapped[fields.detail]).toBe(JSON.stringify({ surface: "ask-clive" }));
    expect(mapped[fields.tokensIn]).toBe(120);
    expect(mapped[fields.tokensOut]).toBe(40);
    expect(mapped[fields.costUsd]).toBe(0.012);
  });
});
