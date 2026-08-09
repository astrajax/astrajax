import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { BRAIN_REGISTRY_TABLES } from "./airtable-ids";
import { appendChangeLog } from "./change-log";

describe("appendChangeLog", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("chains from the newest Created tip (not an unsorted page of 100)", async () => {
    const priorHash = "sha256:prior-tip";
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        expect(url).toContain("maxRecords=1");
        expect(url).toContain("sort%5B0%5D%5Bfield%5D=Created");
        expect(url).toContain("sort%5B0%5D%5Bdirection%5D=desc");
        expect(url).not.toContain("maxRecords=100");
        return new Response(
          JSON.stringify({
            records: [
              {
                id: "recTip",
                createdTime: "2026-08-09T00:00:00.000Z",
                fields: { "Entry Hash": priorHash },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields["Previous Hash"]).toBe(priorHash);
        // Hash input uses empty defaults from canonicalEntryJson (Source field
        // on the row may still store "Brain Key API" for display).
        const canonical = JSON.stringify({
          changeSummary: "Grant issued",
          changeType: "Access Grant",
          changedBy: "Matthew",
          approvedBy: "Matthew",
          executingAgent: "",
          source: "",
          reason: "approved",
          affectedRecords: "recGrant1",
          notes: "",
        });
        const expectedHash = `sha256:${createHash("sha256")
          .update(priorHash + canonical, "utf8")
          .digest("hex")}`;
        expect(body.fields["Entry Hash"]).toBe(expectedHash);
        return new Response(JSON.stringify({ id: "recLog", fields: body.fields }), {
          status: 200,
        });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    await appendChangeLog({
      changeSummary: "Grant issued",
      changeType: "Access Grant",
      changedBy: "Matthew",
      approvedBy: "Matthew",
      reason: "approved",
      affectedRecords: "recGrant1",
    });

    expect(mockFetch).toHaveBeenCalled();
  });
});
