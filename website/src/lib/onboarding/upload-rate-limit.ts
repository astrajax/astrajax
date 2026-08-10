/**
 * Fixed-window rate limiter for anonymous onboarding uploads.
 * Caps per-IP file count and total bytes so client-side Source Pack
 * limits cannot be bypassed by direct API calls.
 *
 * Production should swap to Upstash/Vercel KV — same pattern as Brain Key.
 */

import { SOURCE_PACK_LIMITS } from "./machine";

const WINDOW_MS = 60 * 60_000; // 1 hour

type Bucket = {
  count: number;
  bytes: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

function clientKey(ip?: string): string {
  return ip?.trim() || "unknown";
}

export function checkOnboardingUploadRateLimit(input: {
  ip?: string;
  sizeBytes: number;
}): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
  const key = clientKey(input.ip);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    if (input.sizeBytes > SOURCE_PACK_LIMITS.maxBytesTotal) {
      return {
        allowed: false,
        reason: `Would exceed ${SOURCE_PACK_LIMITS.maxBytesTotal / 1024 / 1024} MiB total limit`,
      };
    }
    buckets.set(key, { count: 1, bytes: input.sizeBytes, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= SOURCE_PACK_LIMITS.maxFiles) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      reason: `Maximum ${SOURCE_PACK_LIMITS.maxFiles} uploads per hour`,
    };
  }

  if (existing.bytes + input.sizeBytes > SOURCE_PACK_LIMITS.maxBytesTotal) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      reason: `Would exceed ${SOURCE_PACK_LIMITS.maxBytesTotal / 1024 / 1024} MiB total limit`,
    };
  }

  existing.count += 1;
  existing.bytes += input.sizeBytes;
  buckets.set(key, existing);
  return { allowed: true };
}

/**
 * Undo a prior allowed check when the upload does not complete
 * (blob misconfig, put failure, client abort). Retries must not burn quota.
 */
export function refundOnboardingUploadRateLimit(input: {
  ip?: string;
  sizeBytes: number;
}): void {
  const key = clientKey(input.ip);
  const existing = buckets.get(key);
  if (!existing) return;

  existing.count = Math.max(0, existing.count - 1);
  existing.bytes = Math.max(0, existing.bytes - input.sizeBytes);

  if (existing.count === 0) {
    buckets.delete(key);
  } else {
    buckets.set(key, existing);
  }
}

/** Reset limiter state — tests only */
export function resetOnboardingUploadRateLimitForTests(): void {
  buckets.clear();
}
