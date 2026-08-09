import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/brain-health-live", () => ({
  handleBrainHealthLive: vi.fn(async () => ({
    source: "live",
    snapshot: {
      brainSlug: "astrajax-chapter-1",
      truths: [{ id: "recTrusted", summary: "live trusted summary" }],
    },
  })),
}));

describe("GET /api/brains/health auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before loading live health", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleBrainHealthLive } = await import("@/lib/brains/handlers/brain-health-live");
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/health?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handleBrainHealthLive).not.toHaveBeenCalled();
  });

  it("returns live health for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/health?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { source?: string };
    expect(data.source).toBe("live");
  });
});
