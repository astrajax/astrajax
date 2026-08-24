import { afterEach, describe, expect, it } from "vitest";
import { GrantValidationError } from "./guards";
import { assertDocPromoteAuthorized, verifyBrainKeyAdmin } from "./http";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

function adminRequest(headerValue: string | null): Request {
  const headers = new Headers();
  if (headerValue !== null) {
    headers.set("x-brain-key-admin", headerValue);
  }
  return new Request("http://localhost/api/brains/key/approve", {
    method: "POST",
    headers,
  });
}

describe("verifyBrainKeyAdmin", () => {
  it("allows through in non-production when no admin secret is configured", () => {
    delete process.env.BRAIN_KEY_ADMIN_SECRET;
    process.env.NODE_ENV = "development";

    expect(() => verifyBrainKeyAdmin(adminRequest(null))).not.toThrow();
  });

  it("rejects in production when no admin secret is configured", () => {
    delete process.env.BRAIN_KEY_ADMIN_SECRET;
    process.env.NODE_ENV = "production";

    expect(() => verifyBrainKeyAdmin(adminRequest("anything"))).toThrow(
      /BRAIN_KEY_ADMIN_SECRET is not configured/,
    );
  });

  it("accepts a matching x-brain-key-admin header", () => {
    process.env.BRAIN_KEY_ADMIN_SECRET = "admin-secret";

    expect(() => verifyBrainKeyAdmin(adminRequest("admin-secret"))).not.toThrow();
  });

  it("rejects a mismatched or missing header as GrantValidationError", () => {
    process.env.BRAIN_KEY_ADMIN_SECRET = "admin-secret";

    expect(() => verifyBrainKeyAdmin(adminRequest("wrong"))).toThrow(GrantValidationError);
    expect(() => verifyBrainKeyAdmin(adminRequest(null))).toThrow(/Admin authorization required/);
  });
});

describe("assertDocPromoteAuthorized", () => {
  it("allows through in non-production when no promote secret is configured", () => {
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    delete process.env.BRAIN_KEY_ADMIN_SECRET;
    process.env.NODE_ENV = "development";

    expect(() => assertDocPromoteAuthorized(null)).not.toThrow();
  });

  it("rejects in production when no promote secret is configured", () => {
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    delete process.env.BRAIN_KEY_ADMIN_SECRET;
    process.env.NODE_ENV = "production";

    expect(() => assertDocPromoteAuthorized("anything")).toThrow(
      /BRAIN_DOC_PROMOTE_TOKEN is not configured/,
    );
  });

  it("accepts a matching BRAIN_DOC_PROMOTE_TOKEN header", () => {
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "promote-secret";
    delete process.env.BRAIN_KEY_ADMIN_SECRET;

    expect(() => assertDocPromoteAuthorized("promote-secret")).not.toThrow();
  });

  it("falls back to BRAIN_KEY_ADMIN_SECRET when promote token is unset", () => {
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    process.env.BRAIN_KEY_ADMIN_SECRET = "admin-secret";

    expect(() => assertDocPromoteAuthorized("admin-secret")).not.toThrow();
  });

  it("rejects a mismatched header as GrantValidationError", () => {
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "promote-secret";

    expect(() => assertDocPromoteAuthorized("wrong")).toThrow(GrantValidationError);
    expect(() => assertDocPromoteAuthorized(null)).toThrow(/Doc promote authorization/);
  });
});
