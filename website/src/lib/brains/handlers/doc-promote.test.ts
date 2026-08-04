import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleDocPromote, clearMemoryPromotionsForTests } from "./doc-promote";
import {
  BRAIN_REGISTRY_TABLES,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";

describe("Doc promote (airtable mode)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearMemoryPromotionsForTests();
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_DOC_PROMOTE_TOKEN = "patDocPromote";
    process.env.BRAIN_WORKSHOP_BASE_ID = "appL2fdnGmhA02WXd";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";
    process.env.BRAIN_KEY_ADMIN_TOKEN = "patRegistryWrite";
    process.env.BRAIN_REGISTRY_BASE_ID = "appbdTVHevH6Bl5ZZ";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
    clearMemoryPromotionsForTests();
  });

  it("promotes draft to trusted, quarantines draft, writes change log, requires approval id", async () => {
    await expect(
      handleDocPromote({
        approvalDecisionId: "",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "approved brief",
      }),
    ).rejects.toThrow(/approval decision/);

    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        return new Response(
          JSON.stringify({
            records: [
              {
                id: "recDraft1",
                fields: {
                  Title: "Draft title",
                  "Canonical Text": "Draft canonical body",
                  "Brain Slug": "astrajax-chapter-1",
                  Status: "Draft",
                  "Proposed Category": "Positioning",
                  "Proposed By Agent": "Clive Curator",
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "POST" && url.includes(BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth)) {
        return new Response(JSON.stringify({ id: "recTrusted1", fields: {} }), { status: 200 });
      }

      if (method === "PATCH" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields.Status).toBe("Quarantined");
        return new Response(JSON.stringify({ id: "recDraft1", fields: body.fields }), {
          status: 200,
        });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields["Change Type"]).toBe("Truth Promote");
        expect(body.fields["Executing Agent"]).toBe("Doc");
        return new Response(JSON.stringify({ id: "recLog", fields: body.fields }), { status: 200 });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.accessGrants)) {
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    const result = await handleDocPromote({
      approvalDecisionId: "apd_test123",
      brainSlug: "astrajax-chapter-1",
      promotions: [
        {
          draftRecordId: "recDraft1",
          category: "Positioning",
          scope: "read:brain-truth:positioning",
        },
      ],
      approver: "Matthew",
      reason: "approved brief",
    });

    expect(result.mode).toBe("airtable");
    expect(result.promotedRecordIds).toEqual(["recTrusted1"]);

    const trustedCreate = mockFetch.mock.calls.find(
      ([url, init]) =>
        String(url).includes(BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth) && init?.method === "POST",
    );
    expect(trustedCreate).toBeDefined();

    const createBody = JSON.parse(String(trustedCreate?.[1]?.body)) as {
      fields: Record<string, string>;
    };
    expect(createBody.fields.Category).toBe("Positioning");
    expect(createBody.fields.Scope).toBe("read:brain-truth:positioning");
    expect(createBody.fields.Authority).toBe("Matthew");
  });

  it("rejects promote when category or scope missing from payload", async () => {
    await expect(
      handleDocPromote({
        approvalDecisionId: "apd_test123",
        brainSlug: "astrajax-chapter-1",
        promotions: [{ draftRecordId: "recDraft1", category: "", scope: "read:brain-truth:positioning" }],
        approver: "Matthew",
        reason: "approved brief",
      }),
    ).rejects.toThrow(/category/);
  });

  it("rejects promote when the draft belongs to another brain", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recDraft1",
              fields: {
                Title: "Draft title",
                "Canonical Text": "Draft canonical body",
                "Brain Slug": "astrajax-brand",
                Status: "Draft",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      handleDocPromote({
        approvalDecisionId: "apd_test123",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "approved brief",
      }),
    ).rejects.toThrow(/Brain does not match/);
  });

  it("rejects promote when the draft is already terminal", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recDraft1",
              fields: {
                Title: "Draft title",
                "Canonical Text": "Draft canonical body",
                "Brain Slug": "astrajax-chapter-1",
                Status: "Quarantined",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(
      handleDocPromote({
        approvalDecisionId: "apd_test123",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "approved brief",
      }),
    ).rejects.toThrow(/not eligible to promote/);
  });

  it("promotes a wall-Approved draft to Trusted then quarantines it", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (method === "GET" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        return new Response(
          JSON.stringify({
            records: [
              {
                id: "recDraftApproved",
                fields: {
                  Title: "Wall-accepted title",
                  "Canonical Text": "Human confirmed on the Receiving Wall.",
                  "Brain Slug": "astrajax-chapter-1",
                  Status: "Approved",
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "POST" && url.includes(BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth)) {
        return new Response(JSON.stringify({ id: "recTrustedApproved", fields: {} }), {
          status: 200,
        });
      }

      if (method === "PATCH" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields.Status).toBe("Quarantined");
        return new Response(
          JSON.stringify({ id: "recDraftApproved", fields: body.fields }),
          { status: 200 },
        );
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        return new Response(JSON.stringify({ id: "recLog" }), { status: 200 });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.accessGrants)) {
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    const result = await handleDocPromote({
      approvalDecisionId: "apd_wall_accept",
      brainSlug: "astrajax-chapter-1",
      promotions: [
        {
          draftRecordId: "recDraftApproved",
          category: "Positioning",
          scope: "read:brain-truth:positioning",
        },
      ],
      approver: "Matthew",
      reason: "accepted on the Receiving Wall",
    });

    expect(result.status).toBe("promoted");
    expect(result.promotedRecordIds).toEqual(["recTrustedApproved"]);
  });
});
