import { afterEach, describe, expect, it } from "vitest";
import {
  createPlatformSessionHandle,
  verifyPlatformSessionHandle,
} from "./signing";

const payload = {
  v: 1 as const,
  publicSessionId: "platform-session-1",
  sessionRecordId: "recSession123",
  issuedAt: "2026-07-26T10:00:00.000Z",
};

afterEach(() => {
  delete process.env.PLATFORM_SESSION_SECRET;
});

describe("signed platform session handles", () => {
  it("round-trips a valid handle", () => {
    process.env.PLATFORM_SESSION_SECRET = "test-secret-with-enough-entropy";
    const handle = createPlatformSessionHandle(payload);
    expect(verifyPlatformSessionHandle(handle)).toEqual(payload);
  });

  it("rejects a tampered handle", () => {
    process.env.PLATFORM_SESSION_SECRET = "test-secret-with-enough-entropy";
    const handle = createPlatformSessionHandle(payload);
    expect(() => verifyPlatformSessionHandle(`${handle}tampered`)).toThrow(/Invalid/);
  });
});
