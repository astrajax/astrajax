import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkBrainKeyRequestRateLimit, resetRateLimitForTests } from "./rate-limit";

describe("Brain Key rate limit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  afterEach(() => {
    resetRateLimitForTests();
  });

  it("rejects the 6th rapid request from one session", () => {
    const sessionId = "rate-limit-session";

    for (let i = 0; i < 5; i += 1) {
      const result = checkBrainKeyRequestRateLimit({ sessionId });
      expect(result.allowed).toBe(true);
    }

    const sixth = checkBrainKeyRequestRateLimit({ sessionId });
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });
});
