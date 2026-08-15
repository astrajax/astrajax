import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/brains/handlers/receiving-wall-records", () => ({
  handleReceivingWallPortals: vi.fn(async () => ({
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
    held: [{ recordId: "recHeld1", kind: "held" }],
    proposals: [{ recordId: "recV1", kind: "proposal" }],
    reports: [{ recordId: "recReport1", title: "Daily change summary" }],
    brains: [{ slug: "astrajax-chapter-1" }],
    source: "live",
    portals: {
      judgement: { source: "live" },
      health: { source: "live" },
      reports: { source: "seed", message: "Letters are seeded." },
    },
  })),
}));

function signedInOperator() {
  return {
    operator: { operatorId: "op_test", email: "matthew@astrajax.com", role: "owner" },
    user: { email: "matthew@astrajax.com" },
    expires: new Date(Date.now() + 60_000).toISOString(),
  };
}

describe("GET /api/brains/receiving-wall auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects anonymous callers before loading Workshop drafts", async () => {
    const { auth } = await import("@/lib/auth");
    const { handleReceivingWallPortals } = await import(
      "@/lib/brains/handlers/receiving-wall-records"
    );
    vi.mocked(auth).mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Operator sign-in required/i);
    expect(handleReceivingWallPortals).not.toHaveBeenCalled();
  });

  it("returns wall records for a signed-in operator", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(
      signedInOperator() as Awaited<ReturnType<typeof auth>>,
    );

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      records?: Array<{ canonicalText?: string }>;
    };
    expect(data.records?.[0]?.canonicalText).toBe("live workshop canonical text");
  });

  it("fills all three portals from one operator read, and says which bay is seeded", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(
      signedInOperator() as Awaited<ReturnType<typeof auth>>,
    );

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      held?: unknown[];
      proposals?: unknown[];
      reports?: unknown[];
      brains?: unknown[];
      portals?: Record<string, { source?: string; message?: string }>;
    };

    expect(data.held).toHaveLength(1);
    expect(data.proposals).toHaveLength(1);
    expect(data.reports).toHaveLength(1);
    expect(data.brains).toHaveLength(1);
    expect(Object.keys(data.portals ?? {}).sort()).toEqual([
      "health",
      "judgement",
      "reports",
    ]);
    expect(data.portals?.reports?.source).toBe("seed");
    expect(data.portals?.reports?.message).toBe("Letters are seeded.");
  });
});
