import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./index", () => ({
  auth: vi.fn(),
}));

describe("requireOperatorSession", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns the signed-in operator", async () => {
    const { auth } = await import("./index");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { requireOperatorSession } = await import("./require-operator");
    await expect(requireOperatorSession()).resolves.toEqual({
      operatorId: "op_test",
      email: "matthew@astrajax.com",
      role: "owner",
    });
  });

  it("rejects anonymous callers", async () => {
    const { auth } = await import("./index");
    vi.mocked(auth).mockResolvedValue(null);

    const { requireOperatorSession } = await import("./require-operator");
    await expect(requireOperatorSession()).rejects.toMatchObject({
      name: "GrantValidationError",
      message: expect.stringMatching(/Operator sign-in required/i),
      code: "GRANT_NOT_FOUND",
    });
  });
});
