import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./blob-store", () => ({
  acquireOutboxWorkerLock: vi.fn(),
  deadLetterOutboxItem: vi.fn(),
  listOutboxBlobs: vi.fn(),
  readOutboxItem: vi.fn(),
  requeueOutboxItem: vi.fn(),
  releaseOutboxWorkerLock: vi.fn(),
  removeOutboxItem: vi.fn(),
}));

vi.mock("./airtable", () => ({
  createAirtableRecords: vi.fn(),
  selectExistingEventIds: vi.fn(),
}));

vi.mock("./config", async () => {
  const actual = await vi.importActual<typeof import("./config")>("./config");
  return {
    ...actual,
    getHouseholdReadToken: vi.fn(() => "pat_read"),
    getHouseholdWriteToken: vi.fn(() => "pat_write"),
    getPlatformMaxAttempts: vi.fn(() => 3),
    getPlatformQueueAgeAlertSeconds: vi.fn(() => 10_000),
  };
});

import {
  createAirtableRecords,
  selectExistingEventIds,
} from "./airtable";
import {
  acquireOutboxWorkerLock,
  deadLetterOutboxItem,
  listOutboxBlobs,
  readOutboxItem,
  requeueOutboxItem,
  releaseOutboxWorkerLock,
  removeOutboxItem,
} from "./blob-store";
import {
  getHouseholdReadToken,
  getHouseholdWriteToken,
  getPlatformMaxAttempts,
} from "./config";
import type { PlatformOutboxItem } from "./types";
import { flushPlatformActivityOutbox } from "./worker";

const acquireMock = vi.mocked(acquireOutboxWorkerLock);
const releaseMock = vi.mocked(releaseOutboxWorkerLock);
const listMock = vi.mocked(listOutboxBlobs);
const readMock = vi.mocked(readOutboxItem);
const requeueMock = vi.mocked(requeueOutboxItem);
const deadLetterMock = vi.mocked(deadLetterOutboxItem);
const removeMock = vi.mocked(removeOutboxItem);
const selectExistingMock = vi.mocked(selectExistingEventIds);
const createRecordsMock = vi.mocked(createAirtableRecords);
const readTokenMock = vi.mocked(getHouseholdReadToken);
const writeTokenMock = vi.mocked(getHouseholdWriteToken);
const maxAttemptsMock = vi.mocked(getPlatformMaxAttempts);

function outboxItem(overrides: Partial<PlatformOutboxItem> = {}): PlatformOutboxItem {
  return {
    v: 1,
    target: { baseId: "appHousehold", tableId: "tblActivity" },
    queuedAt: "2026-08-11T09:00:00.000Z",
    attempt: 0,
    envelope: {
      eventId: "evt_1",
      sequence: 1,
      publicSessionId: "platform--session",
      sessionRecordId: "recSession",
      eventType: "Turn",
      timestamp: "2026-08-11T09:00:00.000Z",
      summary: "Ask Clive turn",
      model: "claude",
      manifest: {
        kind: "none",
        recordIds: [],
        urls: [],
        promptVersion: "v1",
        source: "test",
      },
    },
    ...overrides,
  };
}

describe("flushPlatformActivityOutbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    acquireMock.mockResolvedValue(true);
    releaseMock.mockResolvedValue(undefined);
    listMock.mockResolvedValue([]);
    readMock.mockResolvedValue(null);
    requeueMock.mockResolvedValue(undefined);
    deadLetterMock.mockResolvedValue(undefined);
    removeMock.mockResolvedValue(undefined);
    selectExistingMock.mockResolvedValue(new Set());
    createRecordsMock.mockResolvedValue(undefined as never);
    readTokenMock.mockReturnValue("pat_read");
    writeTokenMock.mockReturnValue("pat_write");
    maxAttemptsMock.mockReturnValue(3);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns locked without scanning when another worker holds the lock", async () => {
    acquireMock.mockResolvedValue(false);

    await expect(flushPlatformActivityOutbox()).resolves.toEqual({
      scanned: 0,
      written: 0,
      deduped: 0,
      deferred: 0,
      failed: 0,
      locked: true,
    });
    expect(listMock).not.toHaveBeenCalled();
    expect(releaseMock).not.toHaveBeenCalled();
  });

  it("defers items whose nextAttemptAt is still in the future", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    listMock.mockResolvedValue([{ pathname: "platform-activity/outbox/evt_1.json" } as never]);
    readMock.mockResolvedValue(outboxItem({ nextAttemptAt: future }));

    const result = await flushPlatformActivityOutbox();

    expect(result).toMatchObject({
      scanned: 0,
      deferred: 1,
      failed: 0,
      locked: false,
    });
    expect(selectExistingMock).not.toHaveBeenCalled();
    expect(releaseMock).toHaveBeenCalledOnce();
  });

  it("requeues under the attempt ceiling and schedules a retry", async () => {
    listMock.mockResolvedValue([{ pathname: "platform-activity/outbox/evt_1.json" } as never]);
    readMock.mockResolvedValue(outboxItem({ attempt: 1 }));
    selectExistingMock.mockRejectedValue(new Error("Airtable timeout"));

    const result = await flushPlatformActivityOutbox();

    expect(result.failed).toBe(1);
    expect(deadLetterMock).not.toHaveBeenCalled();
    expect(requeueMock).toHaveBeenCalledOnce();
    const [, next] = requeueMock.mock.calls[0]!;
    expect(next.attempt).toBe(2);
    expect(next.nextAttemptAt).toEqual(expect.any(String));
    expect(new Date(next.nextAttemptAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it("dead-letters when the next attempt would meet the max", async () => {
    listMock.mockResolvedValue([{ pathname: "platform-activity/outbox/evt_1.json" } as never]);
    readMock.mockResolvedValue(outboxItem({ attempt: 2 }));
    maxAttemptsMock.mockReturnValue(3);
    selectExistingMock.mockRejectedValue(new Error("persistent failure"));

    const result = await flushPlatformActivityOutbox();

    expect(result.failed).toBe(1);
    expect(requeueMock).not.toHaveBeenCalled();
    expect(deadLetterMock).toHaveBeenCalledWith(
      "platform-activity/outbox/evt_1.json",
      expect.objectContaining({ attempt: 3 }),
      "persistent failure",
    );
  });

  it("dedupes already-written event ids and still clears the outbox item", async () => {
    listMock.mockResolvedValue([{ pathname: "platform-activity/outbox/evt_1.json" } as never]);
    readMock.mockResolvedValue(outboxItem());
    selectExistingMock.mockResolvedValue(new Set(["evt_1"]));

    const result = await flushPlatformActivityOutbox();

    expect(result).toMatchObject({
      scanned: 1,
      written: 0,
      deduped: 1,
      failed: 0,
      locked: false,
    });
    expect(createRecordsMock).not.toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalledWith("platform-activity/outbox/evt_1.json");
  });
});
