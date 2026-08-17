import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./airtable-rest", () => ({
  airtableSelect: vi.fn(),
  airtableCreate: vi.fn(),
}));

vi.mock("./config", () => ({
  getRegistryBaseId: vi.fn(() => "appbdTVHevH6Bl5ZZ"),
  getRegistryWriteToken: vi.fn(() => "pat_test"),
  useMemoryStore: vi.fn(() => false),
}));

import { BRAIN_REGISTRY_CHANGE_LOG_FIELDS } from "./airtable-ids";
import { airtableCreate, airtableSelect } from "./airtable-rest";
import { appendChangeLog, CHANGE_LOG_CREATED_FIELD } from "./change-log";

const F = BRAIN_REGISTRY_CHANGE_LOG_FIELDS;
const selectMock = vi.mocked(airtableSelect);
const createMock = vi.mocked(airtableCreate);

describe("appendChangeLog", () => {
  beforeEach(() => {
    selectMock.mockReset();
    createMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("chains from the newest Created tip (not an unsorted page of 100)", async () => {
    selectMock.mockResolvedValue([
      {
        id: "recTip",
        createdTime: "2026-08-09T00:00:00.000Z",
        fields: { [F.entryHash]: "sha256:tip" },
      },
    ]);
    createMock.mockResolvedValue({
      id: "recNew",
      createdTime: "2026-08-09T01:00:00.000Z",
      fields: {},
    });

    await appendChangeLog({
      changeSummary: "test tip chain",
      changeType: "Note",
      changedBy: "Matthew",
    });

    expect(selectMock).toHaveBeenCalledWith(
      "appbdTVHevH6Bl5ZZ",
      "tbliAMUuKKW4DDRXF",
      "pat_test",
      expect.objectContaining({
        maxRecords: 1,
        sortField: CHANGE_LOG_CREATED_FIELD,
        sortDirection: "desc",
        fields: [F.entryHash],
        returnFieldsByFieldId: true,
      }),
    );

    const written = createMock.mock.calls[0]?.[3] as Record<string, string>;
    expect(written[F.previousHash]).toBe("sha256:tip");
    expect(written[F.entryHash]).toMatch(/^sha256:/);
    // Created is Airtable createdTime — never written by us
    expect(written).not.toHaveProperty("Created");
    expect(written).not.toHaveProperty(F.created);
  });
});
