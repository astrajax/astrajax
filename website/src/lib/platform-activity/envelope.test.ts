import { afterEach, describe, expect, it } from "vitest";
import { createEnvelope } from "./envelope";
import { codeManifest } from "./manifest";

const session = {
  v: 1 as const,
  publicSessionId: "platform-test",
  sessionRecordId: "recSession123",
  issuedAt: "2026-07-26T10:00:00.000Z",
};

afterEach(() => {
  delete process.env.PLATFORM_MODEL_RATE_CARD_JSON;
});

describe("platform activity envelope", () => {
  it("keeps the visitor prompt verbatim while abbreviating only Reply Digest", () => {
    const userMessage = "Please compare these two operating models, including the awkward trade-off.";
    const envelope = createEnvelope({
      session,
      sequence: 1,
      eventType: "Turn",
      summary: "Ask Clive exchange",
      model: "claude-sonnet-4-6",
      manifest: codeManifest({ source: "test", promptVersion: "test-v1" }),
      userMessage,
      replyDigest: "x".repeat(700),
    });

    expect(envelope.userMessage).toBe(userMessage);
    expect(envelope.replyDigest).toHaveLength(500);
  });

  it("calculates model cost from the configured versioned rate card", () => {
    process.env.PLATFORM_MODEL_RATE_CARD_JSON = JSON.stringify({
      version: "2026-07-26",
      models: {
        "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15 },
      },
    });
    const envelope = createEnvelope({
      session,
      sequence: 2,
      eventType: "Model Call",
      summary: "Model call",
      model: "claude-sonnet-4-6",
      manifest: codeManifest({ source: "test", promptVersion: "test-v1" }),
      usage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
    });

    expect(envelope.rateCardVersion).toBe("2026-07-26");
    expect(envelope.costUsd).toBe(18);
  });
});
