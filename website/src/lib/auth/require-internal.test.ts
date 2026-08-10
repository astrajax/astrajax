import { beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { requireInternalOperator } from "./require-internal";

const authMock = vi.mocked(auth);

beforeEach(() => {
  authMock.mockReset();
  notFound.mockClear();
});

describe("requireInternalOperator", () => {
  it("allows an internal operator through", async () => {
    authMock.mockResolvedValue({
      operator: {
        operatorId: "op_internal",
        email: "matthew@astrajax.com",
        role: "internal",
      },
    } as never);

    await expect(requireInternalOperator()).resolves.toBeUndefined();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("404s for a signed-in non-internal role", async () => {
    authMock.mockResolvedValue({
      operator: {
        operatorId: "op_owner",
        email: "owner@example.com",
        role: "owner",
      },
    } as never);

    await expect(requireInternalOperator()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("404s when there is no session", async () => {
    authMock.mockResolvedValue(null as never);

    await expect(requireInternalOperator()).rejects.toThrow(/NEXT_NOT_FOUND/);
    expect(notFound).toHaveBeenCalledOnce();
  });
});
