import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveKeyRequest,
  createKeyRequest,
  resetMemoryStoreForTests,
} from "./grants-store";
import { handleKeyApprove } from "./handlers/key-approve";
import { BRAIN_REGISTRY_TABLES } from "./airtable-ids";

describe("Airtable grant persistence", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetMemoryStoreForTests();
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
    process.env.BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    resetMemoryStoreForTests();
  });

  it("issues grant and change log rows with chained entry hash on approve", async () => {
    const mockFetch = vi.mocked(fetch);
    const priorEntryHash = "sha256:priorhash000";

    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.keyRequests)) {
        return new Response(JSON.stringify({ id: "recReq", fields: {} }), { status: 200 });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.keyRequests)) {
        return new Response(
          JSON.stringify({
            records: [
              {
                id: "recReq",
                fields: {
                  "Request ID": "bkr_testapprove",
                  "Brain Slug": "astrajax-chapter-1",
                  Persona: "clive",
                  Purpose: "demo",
                  Scope: "read:brain-truth:positioning",
                  Reason: "test",
                  "Session ID": "session-airtable",
                  Status: "Pending",
                  "Requested At": new Date().toISOString(),
                  "Expires At": new Date(Date.now() + 600_000).toISOString(),
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "PATCH" && url.includes(BRAIN_REGISTRY_TABLES.keyRequests)) {
        return new Response(JSON.stringify({ id: "recReq", fields: {} }), { status: 200 });
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.accessGrants)) {
        return new Response(JSON.stringify({ id: "recGrant", fields: {} }), { status: 200 });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        return new Response(
          JSON.stringify({
            records: [
              {
                id: "recLogPrior",
                createdTime: "2026-06-23T10:00:00.000Z",
                fields: { "Entry Hash": priorEntryHash },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields["Previous Hash"]).toBe(priorEntryHash);
        expect(body.fields["Change Type"]).toBe("Grant Issued");
        return new Response(JSON.stringify({ id: "recLogNew", fields: body.fields }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    await createKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "test",
      sessionId: "session-airtable",
    });

    const storeModule = await import("./store/airtable-store");
    const pendingRequest = {
      requestId: "bkr_testapprove",
      brainSlug: "astrajax-chapter-1",
      persona: "clive" as const,
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "test",
      sessionId: "session-airtable",
      status: "pending" as const,
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    };
    let requestStatus: "pending" | "approved" = "pending";
    vi.spyOn(storeModule.airtableStore, "getRequest").mockImplementation(async () => ({
      ...pendingRequest,
      status: requestStatus,
    }));
    vi.spyOn(storeModule.airtableStore, "setRequestStatus").mockImplementation(
      async (_requestId, status) => {
        if (status === "approved" || status === "pending") {
          requestStatus = status;
        }
        return true;
      },
    );

    const grant = await approveKeyRequest({
      requestId: "bkr_testapprove",
      approver: "Matthew",
    });

    expect(grant).not.toBeNull();
    expect(grant?.grantId).toMatch(/^grt_/);

    const changeLogPost = mockFetch.mock.calls.find(
      ([url, init]) =>
        String(url).includes(BRAIN_REGISTRY_TABLES.changeLog) && init?.method === "POST",
    );
    expect(changeLogPost).toBeDefined();
  });
});

describe("Key approve handler", () => {
  beforeEach(() => {
    resetMemoryStoreForTests();
  });

  it("approves via memory store when configured", async () => {
    process.env.BRAIN_KEY_USE_MEMORY = "true";

    const { handleKeyRequest } = await import("./handlers/key-request");
    const req = await handleKeyRequest({
      brainSlug: "astrajax-chapter-1",
      persona: "clive",
      purpose: "demo",
      scope: "read:brain-truth:positioning",
      reason: "test",
      sessionId: "session-memory-approve",
    });

    const result = await handleKeyApprove({
      requestId: req.requestId,
      decision: "approved",
      approver: "Matthew",
    });

    expect(result.grantId).toMatch(/^grt_/);
  });
});
