import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/paper-trail-list", () => ({
  handlePaperTrailList: vi.fn(async () => ({
    mode: "airtable",
    entries: [
      {
        id: "recLog1",
        action: "Grant issued for astrajax-chapter-1",
        actor: "Matthew",
        reason: "demo",
        timestamp: new Date().toISOString(),
        destination: "registry-change-log",
      },
    ],
  })),
}));

describe("GET /api/brains/paper-trail auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before loading the Registry change log", async () => {
    const { auth } = await import("@/lib/auth");
    const { handlePaperTrailList } = await import(
      "@/lib/brains/handlers/paper-trail-list"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/paper-trail?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handlePaperTrailList).not.toHaveBeenCalled();
  });

  it("returns paper-trail entries for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/paper-trail?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      entries?: Array<{ action?: string }>;
    };
    expect(data.entries?.[0]?.action).toMatch(/Grant issued/i);
  });
});
