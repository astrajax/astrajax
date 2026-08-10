import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAIN_REGISTRY_TABLES } from "@/lib/brains/airtable-ids";
import { airtableOperatorStore, OPERATOR_STATE_FIELDS } from "./airtable-store";

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  process.env.BRAIN_REGISTRY_WRITE_TOKEN = "patRegistryWrite";
  process.env.OPERATOR_STATE_TABLE_ID = BRAIN_REGISTRY_TABLES.operatorState;
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("airtableOperatorStore field mapping", () => {
  it("parses JSON list columns and journey facts from an Airtable record", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recOp1",
              fields: {
                [OPERATOR_STATE_FIELDS.OPERATOR_ID]: "op_matthew",
                [OPERATOR_STATE_FIELDS.EMAIL]: "matthew@example.com",
                [OPERATOR_STATE_FIELDS.ROLE]: "internal",
                [OPERATOR_STATE_FIELDS.JOURNEY_CHAPTER]: 1,
                [OPERATOR_STATE_FIELDS.JOURNEY_STEP]: "welcome-book",
                [OPERATOR_STATE_FIELDS.COMPLETED_CHAPTERS]: "[1]",
                [OPERATOR_STATE_FIELDS.OWNED_BRAIN_SLUGS]: '["astrajax-chapter-1"]',
                [OPERATOR_STATE_FIELDS.CONFIGURED_FUNCTIONS]: '["sales"]',
                [OPERATOR_STATE_FIELDS.INTRODUCED_MEMBERS]: '["clive"]',
                [OPERATOR_STATE_FIELDS.LAST_SAFE_DESTINATION]: "/command",
                [OPERATOR_STATE_FIELDS.UPDATED_AT]: "2026-08-05T10:00:00.000Z",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const state = await airtableOperatorStore.getById("op_matthew");

    expect(state).toMatchObject({
      recordId: "recOp1",
      operatorId: "op_matthew",
      email: "matthew@example.com",
      role: "internal",
      journey: {
        chapter: 1,
        step: "welcome-book",
        completedChapters: [1],
      },
      ownedBrainSlugs: ["astrajax-chapter-1"],
      configuredFunctions: ["sales"],
      introducedMembers: ["clive"],
      lastSafeDestination: "/command",
    });
  });

  it("treats corrupt or non-array JSON list columns as empty arrays", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recOp2",
              fields: {
                [OPERATOR_STATE_FIELDS.OPERATOR_ID]: "op_broken",
                [OPERATOR_STATE_FIELDS.EMAIL]: "broken@example.com",
                [OPERATOR_STATE_FIELDS.ROLE]: "owner",
                [OPERATOR_STATE_FIELDS.OWNED_BRAIN_SLUGS]: "{not-json",
                [OPERATOR_STATE_FIELDS.CONFIGURED_FUNCTIONS]: '{"a":1}',
                [OPERATOR_STATE_FIELDS.INTRODUCED_MEMBERS]: "",
                [OPERATOR_STATE_FIELDS.UPDATED_AT]: "2026-08-05T10:00:00.000Z",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const state = await airtableOperatorStore.getByEmail("broken@example.com");

    expect(state).toMatchObject({
      recordId: "recOp2",
      journey: null,
      ownedBrainSlugs: [],
      configuredFunctions: [],
      introducedMembers: [],
      lastSafeDestination: null,
    });
  });

  it("lowercases email in create filters and write payloads", async () => {
    const mockFetch = vi.mocked(fetch);
    // getByEmail in create() — no existing record
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ records: [] }), { status: 200 }),
    );
    // airtableCreate
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "recNew",
          fields: {
            [OPERATOR_STATE_FIELDS.OPERATOR_ID]: "op_new",
            [OPERATOR_STATE_FIELDS.EMAIL]: "matthew@example.com",
            [OPERATOR_STATE_FIELDS.ROLE]: "owner",
            [OPERATOR_STATE_FIELDS.OWNED_BRAIN_SLUGS]: "[]",
            [OPERATOR_STATE_FIELDS.CONFIGURED_FUNCTIONS]: "[]",
            [OPERATOR_STATE_FIELDS.INTRODUCED_MEMBERS]: "[]",
            [OPERATOR_STATE_FIELDS.UPDATED_AT]: "2026-08-05T12:00:00.000Z",
          },
        }),
        { status: 200 },
      ),
    );

    await airtableOperatorStore.create({
      operatorId: "op_new",
      email: "Matthew@Example.com",
      role: "owner",
      journey: null,
      ownedBrainSlugs: [],
      configuredFunctions: [],
      introducedMembers: [],
      lastSafeDestination: null,
      updatedAt: "2026-08-05T12:00:00.000Z",
    });

    const createCall = mockFetch.mock.calls[1];
    const body = JSON.parse(String(createCall?.[1]?.body)) as {
      fields: Record<string, unknown>;
    };
    expect(body.fields[OPERATOR_STATE_FIELDS.EMAIL]).toBe("matthew@example.com");
    expect(String(mockFetch.mock.calls[0]?.[0])).toContain(
      "matthew%40example.com",
    );
  });
});
