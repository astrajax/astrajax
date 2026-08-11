import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { issueEmailCode, verifyEmailCode } from "./email-code";

const email = "matthew@astrajax.com";

describe("email one-time codes", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-not-for-production";
  });
  afterEach(() => {
    delete process.env.AUTH_SECRET;
  });

  it("verifies a freshly issued code", () => {
    const { code, proof } = issueEmailCode(email);
    expect(verifyEmailCode({ email, code, proof })).toBe(true);
  });

  it("verifies a code pasted with spaces", () => {
    const { code, proof } = issueEmailCode(email);
    const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
    expect(verifyEmailCode({ email, code: spaced, proof })).toBe(true);
  });

  it("rejects a wrong code", () => {
    const { code, proof } = issueEmailCode(email);
    const wrong = code === "000000" ? "000001" : "000000";
    expect(verifyEmailCode({ email, code: wrong, proof })).toBe(false);
  });

  it("rejects a code for a different email", () => {
    const { code, proof } = issueEmailCode(email);
    expect(verifyEmailCode({ email: "someone@else.com", code, proof })).toBe(false);
  });

  it("rejects an expired code", () => {
    const issuedAt = Date.now();
    const { code, proof } = issueEmailCode(email, issuedAt);
    expect(
      verifyEmailCode({ email, code, proof, now: issuedAt + 11 * 60 * 1000 }),
    ).toBe(false);
  });

  it("rejects a tampered proof", () => {
    const { code, proof } = issueEmailCode(email);
    const [expiry] = proof.split(".");
    expect(
      verifyEmailCode({ email, code, proof: `${expiry}.${"0".repeat(64)}` }),
    ).toBe(false);
  });
});
