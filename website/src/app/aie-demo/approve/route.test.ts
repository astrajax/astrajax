import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /aie-demo/approve auth gate", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("allows anonymous approve when the memory store is active", async () => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";
    delete process.env.BRAIN_KEY_ADMIN_SECRET;

    const { handleKeyRequest } = await import("@/lib/brains/handlers/key-request");
    const { resetMemoryStoreForTests } = await import("@/lib/brains/grants-store");
    resetMemoryStoreForTests();

    const req = await handleKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "booth",
      scope: "read:brain-truth:pricing",
      reason: "demo",
      sessionId: "session-approve-memory",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/aie-demo/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: req.requestId,
          decision: "approved",
          approver: "Matthew",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const data = (await response.json()) as { grantId?: string; status?: string };
    expect(data.grantId).toMatch(/^grt_/);
    expect(data.status).toBe("active");
  });

  it("rejects anonymous live-registry approve without admin secret", async () => {
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.NODE_ENV = "production";
    process.env.BRAIN_KEY_ADMIN_SECRET = "live-admin-secret";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
    process.env.BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/aie-demo/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: "bkr_any",
          decision: "approved",
          approver: "Attacker",
        }),
      }),
    );

    // GrantValidationError maps to 403 via jsonError (same as /api/brains/key/approve).
    expect(response.status).toBe(403);
    const data = (await response.json()) as { error?: string };
    expect(data.error).toMatch(/Admin authorization required/i);
  });

  it("accepts live-registry approve when admin secret header matches", async () => {
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.NODE_ENV = "production";
    process.env.BRAIN_KEY_ADMIN_SECRET = "live-admin-secret";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
    process.env.BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";

    const { BRAIN_REGISTRY_TABLES } = await import("@/lib/brains/airtable-ids");
    const pendingFields = {
      "Request ID": "bkr_live",
      "Brain Slug": "astrajax-chapter-1",
      Persona: "clive",
      Purpose: "booth",
      Scope: "read:brain-truth:pricing",
      Reason: "demo",
      "Session ID": "session-live",
      Status: "Pending",
      "Requested At": new Date().toISOString(),
      "Expires At": new Date(Date.now() + 60_000).toISOString(),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        const href = String(url);
        if (href.includes(BRAIN_REGISTRY_TABLES.keyRequests) && method === "GET") {
          return new Response(
            JSON.stringify({
              records: [{ id: "recReq1", fields: pendingFields }],
            }),
            { status: 200 },
          );
        }
        if (href.includes(BRAIN_REGISTRY_TABLES.keyRequests) && method === "PATCH") {
          return new Response(
            JSON.stringify({ id: "recReq1", fields: { ...pendingFields, Status: "Approved" } }),
            { status: 200 },
          );
        }
        if (href.includes(BRAIN_REGISTRY_TABLES.accessGrants) && method === "POST") {
          return new Response(
            JSON.stringify({
              id: "recGrant1",
              fields: {
                "Grant ID": "grt_live",
                "Request ID": "bkr_live",
                "Brain Slug": "astrajax-chapter-1",
                Persona: "clive",
                Scope: "read:brain-truth:pricing",
                "Session ID": "session-live",
                "Approved By": "Matthew",
                "Approved At": new Date().toISOString(),
                "Expires At": new Date(Date.now() + 60_000).toISOString(),
                "Max Uses": 3,
                "Use Count": 0,
                Status: "Active",
              },
            }),
            { status: 200 },
          );
        }
        if (href.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
          return new Response(JSON.stringify({ records: [], id: "recLog1" }), { status: 200 });
        }
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/aie-demo/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-brain-key-admin": "live-admin-secret",
        },
        body: JSON.stringify({
          requestId: "bkr_live",
          decision: "approved",
          approver: "Matthew",
        }),
      }),
    );

    if (response.status !== 200) {
      throw new Error(`Unexpected status ${response.status}: ${await response.text()}`);
    }
    expect(response.status).toBe(200);
  });
});
