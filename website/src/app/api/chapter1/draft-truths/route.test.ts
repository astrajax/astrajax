import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/draft-truth-list", () => ({
  handleDraftTruthList: vi.fn(async () => ({
    mode: "airtable",
    drafts: [
      {
        recordId: "recDraft1",
        title: "Secret draft",
        canonicalText: "live workshop canonical text",
        proposedCategory: "Definition",
        status: "Draft",
        scope: "read:brain-truth:core",
        source: "workshop",
      },
    ],
  })),
}));

describe("GET /api/chapter1/draft-truths Workshop gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty fallback for anonymous callers without loading Workshop", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleDraftTruthList } = await import(
      "@/lib/brains/handlers/draft-truth-list"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/chapter1/draft-truths?brainSlug=chapter-1"),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      mode?: string;
      drafts?: unknown[];
      message?: string;
    };
    expect(data.mode).toBe("fallback");
    expect(data.drafts).toEqual([]);
    expect(data.message).toMatch(/Operator sign-in required/i);
    expect(handleDraftTruthList).not.toHaveBeenCalled();
  });

  it("loads live Workshop drafts for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/chapter1/draft-truths?brainSlug=chapter-1"),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      mode?: string;
      drafts?: Array<{ canonicalText?: string }>;
    };
    expect(data.mode).toBe("airtable");
    expect(data.drafts?.[0]?.canonicalText).toBe("live workshop canonical text");
  });
});
