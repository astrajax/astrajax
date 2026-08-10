import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/curation/knowledge", () => ({
  loadCurationDocket: vi.fn(async () => ({
    brainSlug: "astrajax-chapter-1",
    mode: "memory",
    drafts: [],
    flaggedInteractions: [],
    pendingSourceDocuments: [],
    trustedTruths: [
      {
        recordId: "recTrusted",
        title: "Secret positioning",
        canonicalText: "live trusted canonical text",
        scope: "read:brain-truth:positioning",
      },
    ],
  })),
}));

describe("GET /api/brains/curation/docket auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before loading Trusted Brain text", async () => {
    const { auth } = await import("@/lib/auth");
    const { loadCurationDocket } = await import("@/lib/curation/knowledge");
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/curation/docket?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(loadCurationDocket).not.toHaveBeenCalled();
  });

  it("returns the docket for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/brains/curation/docket?brainSlug=astrajax-chapter-1"),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      trustedTruths?: Array<{ canonicalText?: string }>;
    };
    expect(data.trustedTruths?.[0]?.canonicalText).toBe("live trusted canonical text");
  });
});
