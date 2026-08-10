import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../airtable-rest", () => ({
  airtableSelect: vi.fn(),
}));

vi.mock("../config", () => ({
  getRegistryBaseId: vi.fn(() => "appbdTVHevH6Bl5ZZ"),
  getRegistryReadToken: vi.fn(() => "pat_read_test"),
  useMemoryStore: vi.fn(() => false),
}));

import { airtableSelect } from "../airtable-rest";
import {
  appendChangeLogForTests,
  CHANGE_LOG_CREATED_FIELD,
  clearMemoryChangeLogForTests,
} from "../change-log";
import { getRegistryBaseId, getRegistryReadToken, useMemoryStore } from "../config";
import { handlePaperTrailList } from "./paper-trail-list";

const selectMock = vi.mocked(airtableSelect);
const useMemoryMock = vi.mocked(useMemoryStore);
const baseIdMock = vi.mocked(getRegistryBaseId);
const readTokenMock = vi.mocked(getRegistryReadToken);

describe("handlePaperTrailList", () => {
  beforeEach(() => {
    selectMock.mockReset();
    useMemoryMock.mockReturnValue(false);
    baseIdMock.mockReturnValue("appbdTVHevH6Bl5ZZ");
    readTokenMock.mockReturnValue("pat_read_test");
    clearMemoryChangeLogForTests();
    delete process.env.BRAIN_KEY_ADMIN_TOKEN;
  });

  afterEach(() => {
    vi.clearAllMocks();
    clearMemoryChangeLogForTests();
  });

  it("asks Airtable for newest-first Created rows at the requested limit", async () => {
    selectMock.mockResolvedValue([]);

    await handlePaperTrailList({ brainSlug: "astrajax-chapter-1", limit: 7 });

    expect(selectMock).toHaveBeenCalledWith(
      "appbdTVHevH6Bl5ZZ",
      "tbliAMUuKKW4DDRXF",
      "pat_read_test",
      {
        maxRecords: 7,
        sortField: CHANGE_LOG_CREATED_FIELD,
        sortDirection: "desc",
      },
    );
  });

  it("prefers the Created field for timestamps, then record createdTime", async () => {
    selectMock.mockResolvedValue([
      {
        id: "recWithCreated",
        createdTime: "2026-08-01T00:00:00.000Z",
        fields: {
          "Change Summary": "Tip entry",
          "Changed By": "Matthew",
          Reason: "hash tip",
          Created: "2026-08-09T12:00:00.000Z",
        },
      },
      {
        id: "recFallback",
        createdTime: "2026-08-08T09:00:00.000Z",
        fields: {
          "Change Summary": "Older entry",
          "Changed By": "Clive",
          "Change Type": "Note",
        },
      },
    ]);

    const result = await handlePaperTrailList({
      brainSlug: "astrajax-chapter-1",
      limit: 2,
    });

    expect(result.mode).toBe("airtable");
    expect(result.entries).toEqual([
      {
        id: "recWithCreated",
        action: "Tip entry",
        actor: "Matthew",
        reason: "hash tip",
        timestamp: "2026-08-09T12:00:00.000Z",
        destination: "registry-change-log",
        recordId: "recWithCreated",
      },
      {
        id: "recFallback",
        action: "Older entry",
        actor: "Clive",
        reason: "Note",
        timestamp: "2026-08-08T09:00:00.000Z",
        destination: "registry-change-log",
        recordId: "recFallback",
      },
    ]);
  });

  it("returns empty memory mode when Registry credentials are missing", async () => {
    baseIdMock.mockReturnValue(undefined);
    readTokenMock.mockReturnValue(undefined);

    const result = await handlePaperTrailList({ brainSlug: "any" });

    expect(result).toEqual({ mode: "memory", entries: [] });
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("maps the in-memory change log when BRAIN_KEY_USE_MEMORY is on", async () => {
    useMemoryMock.mockReturnValue(true);
    appendChangeLogForTests({
      changeSummary: "Memory trail",
      changeType: "Note",
      changedBy: "Matthew",
    });

    const result = await handlePaperTrailList({
      brainSlug: "astrajax-chapter-1",
      limit: 1,
    });

    expect(result.mode).toBe("memory");
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({
      action: "Memory trail",
      actor: "Matthew",
      reason: "Note",
      destination: "registry-change-log",
    });
    expect(selectMock).not.toHaveBeenCalled();
  });
});
