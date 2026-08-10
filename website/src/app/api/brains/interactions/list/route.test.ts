import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/interaction-list", () => ({
  handleInteractionList: vi.fn(async () => ({
    interactions: [
      {
        interactionId: "int_1",
        recordId: "recInt1",
        brainSlug: "astrajax-chapter-1",
        persona: "clive",
        userMessage: "secret user question",
        assistantReply: "secret assistant reply",
        createdAt: new Date().toISOString(),
      },
    ],
  })),
}));

describe("GET /api/brains/interactions/list auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before listing interactions", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleInteractionList } = await import(
      "@/lib/brains/handlers/interaction-list"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/brains/interactions/list?brainSlug=astrajax-chapter-1",
      ),
    );

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handleInteractionList).not.toHaveBeenCalled();
  });

  it("returns interactions for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/brains/interactions/list?brainSlug=astrajax-chapter-1",
      ),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      interactions?: Array<{ userMessage?: string }>;
    };
    expect(data.interactions?.[0]?.userMessage).toBe("secret user question");
  });
});
