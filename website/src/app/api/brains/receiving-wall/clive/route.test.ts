import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/receiving-wall-clive", () => ({
  handleReceivingWallClive: vi.fn(async () => ({
    reply: "Signed-in Clive reply",
  })),
  sanitiseReceivingWallCliveHistory: vi.fn(() => []),
}));

describe("POST /api/brains/receiving-wall/clive auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before invoking Clive", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleReceivingWallClive } = await import(
      "@/lib/brains/handlers/receiving-wall-clive"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/brains/receiving-wall/clive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "sess_1", message: "hello" }),
      }),
    );

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handleReceivingWallClive).not.toHaveBeenCalled();
  });

  it("invokes Clive for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleReceivingWallClive } = await import(
      "@/lib/brains/handlers/receiving-wall-clive"
    );
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/brains/receiving-wall/clive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "sess_1", message: "hello" }),
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { reply?: string };
    expect(data.reply).toBe("Signed-in Clive reply");
    expect(handleReceivingWallClive).toHaveBeenCalledOnce();
  });
});
