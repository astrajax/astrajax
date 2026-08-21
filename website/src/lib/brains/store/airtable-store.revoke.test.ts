import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAIN_REGISTRY_TABLES } from "../airtable-ids";
import { airtableStore } from "./airtable-store";

describe("airtableStore.revokeGrantsForBrain", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_REGISTRY_BASE_ID = "appRegistry";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("paginates Active grants and revokes every page (not just the first 100)", async () => {
    const mockFetch = vi.mocked(fetch);
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: `recGrant${String(i).padStart(3, "0")}`,
      fields: { "Grant ID": `grant_${i}` },
    }));
    const page2 = [
      { id: "recGrant100", fields: { "Grant ID": "grant_100" } },
      { id: "recGrant101", fields: { "Grant ID": "grant_101" } },
    ];

    const selectUrls: string[] = [];
    const revokedIds: string[] = [];

    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.accessGrants)) {
        selectUrls.push(url);
        if (url.includes("offset=")) {
          return new Response(JSON.stringify({ records: page2 }), { status: 200 });
        }
        return new Response(
          JSON.stringify({ records: page1, offset: "page2offset" }),
          { status: 200 },
        );
      }

      if (method === "PATCH" && url.includes(BRAIN_REGISTRY_TABLES.accessGrants)) {
        const id = url.split("/").pop() ?? "";
        revokedIds.push(id);
        const body = JSON.parse(String(init?.body)) as { fields: { Status: string } };
        expect(body.fields.Status).toBe("Revoked");
        return new Response(JSON.stringify({ id, fields: body.fields }), { status: 200 });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    const count = await airtableStore.revokeGrantsForBrain("astrajax-chapter-1");

    expect(count).toBe(102);
    expect(selectUrls.length).toBe(2);
    expect(selectUrls[0]).not.toContain("offset=");
    expect(selectUrls[1]).toContain("offset=page2offset");
    // Without paginate:true, maxRecords=100 would leave grant_100/101 active.
    expect(revokedIds).toContain("recGrant100");
    expect(revokedIds).toContain("recGrant101");
    expect(revokedIds).toHaveLength(102);
  });
});
