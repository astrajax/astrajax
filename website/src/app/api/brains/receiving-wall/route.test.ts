import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/receiving-wall-records", () => ({
  handleReceivingWallRecords: vi.fn(async () => ({
    mode: "airtable",
    records: [
      {
        recordId: "recDraft1",
        title: "Secret draft",
        snippet: "live workshop canonical…",
        provenance: "Clive's Man",
        captureSource: "chat",
        canonicalText: "live workshop canonical text",
      },
    ],
  })),
}));

describe("GET /api/brains/receiving-wall auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before loading Workshop drafts", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleReceivingWallRecords } = await import(
      "@/lib/brains/handlers/receiving-wall-records"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handleReceivingWallRecords).not.toHaveBeenCalled();
  });

  it("returns wall records for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
      user: { email: "matthew@astrajax.com" },
      expires: new Date(Date.now() + 60_000).toISOString(),
    } as Awaited<ReturnType<typeof auth>>);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      records?: Array<{ canonicalText?: string }>;
    };
    expect(data.records?.[0]?.canonicalText).toBe("live workshop canonical text");
  });
});
