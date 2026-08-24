import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SOURCE_PACK_LIMITS } from "./machine";
import {
  checkOnboardingFilingRateLimit,
  checkOnboardingUploadRateLimit,
  refundOnboardingUploadRateLimit,
  resetOnboardingUploadRateLimitForTests,
} from "./upload-rate-limit";

/** Filing allowance is deliberately 3× the upload file cap so honest retries survive. */
const FILING_MAX_PER_WINDOW = SOURCE_PACK_LIMITS.maxFiles * 3;

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

describe("onboarding filing rate limit", () => {
  beforeEach(() => {
    resetOnboardingUploadRateLimitForTests();
  });

  afterEach(() => {
    resetOnboardingUploadRateLimitForTests();
  });

  it(`allows ${FILING_MAX_PER_WINDOW} filings then blocks the next from the same IP`, () => {
    const ip = "203.0.113.20";

    for (let i = 0; i < FILING_MAX_PER_WINDOW; i += 1) {
      expect(checkOnboardingFilingRateLimit({ ip }).allowed).toBe(true);
    }

    const blocked = checkOnboardingFilingRateLimit({ ip });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.reason).toMatch(/filings per hour/);
  });

  it("keeps filing quota independent of the upload byte/file bucket", () => {
    const ip = "203.0.113.21";
    const sizeBytes = 1024;

    for (let i = 0; i < SOURCE_PACK_LIMITS.maxFiles; i += 1) {
      expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(true);
    }
    expect(checkOnboardingUploadRateLimit({ ip, sizeBytes }).allowed).toBe(false);

    expect(checkOnboardingFilingRateLimit({ ip }).allowed).toBe(true);
  });

  it("treats a blank IP as the shared unknown bucket", () => {
    for (let i = 0; i < FILING_MAX_PER_WINDOW; i += 1) {
      expect(checkOnboardingFilingRateLimit({ ip: "  " }).allowed).toBe(true);
    }
    expect(checkOnboardingFilingRateLimit({}).allowed).toBe(false);
  });
});

