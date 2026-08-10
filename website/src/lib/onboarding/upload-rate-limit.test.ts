import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SOURCE_PACK_LIMITS } from "./machine";
import {
  checkOnboardingUploadRateLimit,
  refundOnboardingUploadRateLimit,
  resetOnboardingUploadRateLimitForTests,
} from "./upload-rate-limit";

describe("onboarding upload rate limit", () => {
  beforeEach(() => {
    resetOnboardingUploadRateLimitForTests();
  });

  afterEach(() => {
    resetOnboardingUploadRateLimitForTests();
  });

  it("rejects the 6th upload from one IP within the window", () => {
    const ip = "203.0.113.10";
    const sizeBytes = 1024;

    for (let i = 0; i < SOURCE_PACK_LIMITS.maxFiles; i += 1) {
      expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(true);
    }

    const blocked = checkOnboardingUploadRateLimit({ ip, sizeBytes });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("rejects when total bytes would exceed the Source Pack cap", () => {
    const ip = "203.0.113.11";
    const almostFull = SOURCE_PACK_LIMITS.maxBytesTotal - 1024;
    expect(checkOnboardingUploadRateLimit({ ip, sizeBytes: almostFull }).allowed).toBe(true);

    const blocked = checkOnboardingUploadRateLimit({ ip, sizeBytes: 2048 });
    expect(blocked.allowed).toBe(false);
  });

  it("refund restores quota so a failed upload can retry", () => {
    const ip = "203.0.113.12";
    const sizeBytes = 1024;

    for (let i = 0; i < SOURCE_PACK_LIMITS.maxFiles; i += 1) {
      expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(true);
    }
    expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(false);

    refundOnboardingUploadRateLimit({ ip, sizeBytes });
    expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(true);
  });
});
