import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleDocPromote, clearMemoryPromotionsForTests } from "./doc-promote";
import {
  BRAIN_REGISTRY_CHANGE_LOG_FIELDS,
  BRAIN_REGISTRY_TABLES,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
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

  it("quarantines draft before Trusted create, writes change log, requires approval id", async () => {
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
    const callOrder: string[] = [];
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
        callOrder.push("trusted-create");
        return new Response(JSON.stringify({ id: "recTrusted1", fields: {} }), { status: 200 });
      }

      if (method === "PATCH" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        callOrder.push("draft-quarantine");
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status]).toBe("Quarantined");
        return new Response(JSON.stringify({ id: "recDraft1", fields: body.fields }), {
          status: 200,
        });
      }

      if (method === "GET" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        return new Response(JSON.stringify({ records: [] }), { status: 200 });
      }

      if (method === "POST" && url.includes(BRAIN_REGISTRY_TABLES.changeLog)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields[BRAIN_REGISTRY_CHANGE_LOG_FIELDS.changeType]).toBe("Truth Promote");
        expect(body.fields[BRAIN_REGISTRY_CHANGE_LOG_FIELDS.executingAgent]).toBe("Doc");
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
    expect(callOrder).toEqual(["draft-quarantine", "trusted-create"]);

    const trustedCreate = mockFetch.mock.calls.find(
      ([url, init]) =>
        String(url).includes(BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth) && init?.method === "POST",
    );
    expect(trustedCreate).toBeDefined();

    const createBody = JSON.parse(String(trustedCreate?.[1]?.body)) as {
      fields: Record<string, string>;
    };
    const tf = BRAIN_TRUSTED_CHAPTER1_TRUTH_FIELDS;
    expect(createBody.fields[tf.category]).toBe("Positioning");
    expect(createBody.fields[tf.scope]).toBe("read:brain-truth:positioning");
    expect(createBody.fields[tf.authority]).toBe("Matthew");
    expect(createBody.fields[tf.canonicalText]).toBe("Draft canonical body");
    expect(createBody.fields[tf.canonicalTextForHumans]).toBeTruthy();
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

  it("quarantines a wall-Approved draft before Trusted create", async () => {
    const mockFetch = vi.mocked(fetch);
    const callOrder: string[] = [];
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
        callOrder.push("trusted-create");
        return new Response(JSON.stringify({ id: "recTrustedApproved", fields: {} }), {
          status: 200,
        });
      }

      if (method === "PATCH" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        callOrder.push("draft-quarantine");
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        expect(body.fields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status]).toBe("Quarantined");
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
    expect(callOrder).toEqual(["draft-quarantine", "trusted-create"]);
  });

  it("restores prior draft status when Trusted create fails after quarantine", async () => {
    const mockFetch = vi.mocked(fetch);
    const patchStatuses: string[] = [];
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
                  Status: "Approved",
                },
              },
            ],
          }),
          { status: 200 },
        );
      }

      if (method === "PATCH" && url.includes(BRAIN_WORKSHOP_TABLES.draftBrainTruth)) {
        const body = JSON.parse(String(init?.body)) as { fields: Record<string, string> };
        patchStatuses.push(body.fields[BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status]);
        return new Response(JSON.stringify({ id: "recDraft1", fields: body.fields }), {
          status: 200,
        });
      }

      if (method === "POST" && url.includes(BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth)) {
        return new Response(JSON.stringify({ error: "Airtable unavailable" }), { status: 503 });
      }

      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });

    await expect(
      handleDocPromote({
        approvalDecisionId: "apd_retry_safe",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "retry-safe promote",
      }),
    ).rejects.toThrow(/Airtable/);

    expect(patchStatuses).toEqual(["Quarantined", "Approved"]);
  });

  it("refuses silent memory promote when Airtable mode is expected", async () => {
    delete process.env.BRAIN_DOC_PROMOTE_TOKEN;
    process.env.BRAIN_KEY_USE_MEMORY = "false";
    process.env.BRAIN_REGISTRY_READ_TOKEN = "patRegistryRead";

    await expect(
      handleDocPromote({
        approvalDecisionId: "apd_misconfig",
        brainSlug: "astrajax-chapter-1",
        promotions: [
          {
            draftRecordId: "recDraft1",
            category: "Positioning",
            scope: "read:brain-truth:positioning",
          },
        ],
        approver: "Matthew",
        reason: "should fail closed",
      }),
    ).rejects.toThrow(/BRAIN_DOC_PROMOTE_TOKEN is not configured/);
  });
});
