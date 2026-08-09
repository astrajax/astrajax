import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GrantValidationError } from "@/lib/brains/guards";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { isAuthFailure, requireOperatorOrDocPromote } from "./require-operator";

const authMock = vi.mocked(auth);
const originalEnv = { ...process.env };

beforeEach(() => {
  authMock.mockReset();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("requireOperatorOrDocPromote", () => {
  it("returns the signed-in operator without checking the promote header", async () => {
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "promote-secret";
    authMock.mockResolvedValue({
      operator: {
        operatorId: "op_matthew",
        email: "matthew@example.com",
        role: "owner",
      },
    } as never);

    await expect(requireOperatorOrDocPromote("wrong-header")).resolves.toEqual({
      operatorId: "op_matthew",
      email: "matthew@example.com",
      role: "owner",
    });
  });

  it("accepts a matching Doc-promote header when there is no session", async () => {
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "promote-secret";
    authMock.mockResolvedValue(null as never);

    await expect(requireOperatorOrDocPromote("promote-secret")).resolves.toBeNull();
  });

  it("rejects anonymous callers with a bad promote header", async () => {
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "promote-secret";
    authMock.mockResolvedValue(null as never);

    await expect(requireOperatorOrDocPromote("nope")).rejects.toThrow(
      GrantValidationError,
    );
  });

  it("rejects anonymous callers in production when the promote secret is unset", async () => {
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    delete process.env.BRAIN_KEY_ADMIN_SECRET;
    process.env.NODE_ENV = "production";
    authMock.mockResolvedValue(null as never);

    await expect(requireOperatorOrDocPromote(null)).rejects.toThrow(
      /BRAIN_DOC_PROMOTE_TOKEN is not configured/,
    );
  });
});

describe("isAuthFailure", () => {
  it("recognises GrantValidationError and configuration/authorization messages", () => {
    expect(
      isAuthFailure(
        new GrantValidationError(
          "Doc promote authorization required.",
          "GRANT_NOT_FOUND",
        ),
      ),
    ).toBe(true);
    expect(
      isAuthFailure(new Error("BRAIN_DOC_PROMOTE_TOKEN is not configured.")),
    ).toBe(true);
    expect(isAuthFailure(new Error("authorization required"))).toBe(true);
    expect(isAuthFailure(new Error("Draft is missing Title"))).toBe(false);
    expect(isAuthFailure("string")).toBe(false);
  });
});
