/**
 * Fixed-window rate limiter for Brain Key request endpoint.
 * Production should swap to Upstash/Vercel KV — see TODO below.
 */

const WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS = 5;

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

function bucketKey(sessionId: string, ip?: string): string {
  return ip ? `${sessionId}:${ip}` : sessionId;
}

export function checkBrainKeyRequestRateLimit(input: {
  sessionId: string;
  ip?: string;
}): { allowed: boolean; retryAfterSeconds?: number } {
  const key = bucketKey(input.sessionId, input.ip);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (existing.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true };
}

/** Reset limiter state — tests only */
export function resetRateLimitForTests(): void {
  buckets.clear();
}
