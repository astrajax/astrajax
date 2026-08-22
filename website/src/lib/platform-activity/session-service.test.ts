import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  after: vi.fn(),
}));

vi.mock("./blob-store", () => ({
  createLease: vi.fn(),
  enqueueOutboxItem: vi.fn(),
  mutateLease: vi.fn(),
  readLease: vi.fn(),
}));

vi.mock("./airtable", () => ({
  createAirtableRecord: vi.fn(),
}));

vi.mock("./config", async () => {
  const actual = await vi.importActual<typeof import("./config")>("./config");
  return {
    ...actual,
    platformSessionEnabled: vi.fn(() => true),
    platformActivityEventWritesEnabled: vi.fn(() => true),
    getHouseholdWriteToken: vi.fn(() => "pat_write"),
    getPlatformIdleMinutes: vi.fn(() => 30),
  };
});

vi.mock("./worker", () => ({
  flushPlatformActivityOutbox: vi.fn(),
}));

import { createAirtableRecord } from "./airtable";
import {
  createLease,
  enqueueOutboxItem,
  mutateLease,
  readLease,
} from "./blob-store";
import {
  getHouseholdWriteToken,
  getPlatformIdleMinutes,
  platformSessionEnabled,
} from "./config";
import { HOUSEHOLD_SESSION_FIELDS } from "./ids";
import { createPlatformSessionHandle } from "./signing";
import {
  closePlatformSession,
  reopenPlatformSession,
  reservePlatformSequences,
  startPlatformSession,
} from "./session-service";
import type { PlatformSessionLease } from "./types";

const createRecordMock = vi.mocked(createAirtableRecord);
const createLeaseMock = vi.mocked(createLease);
const mutateLeaseMock = vi.mocked(mutateLease);
const readLeaseMock = vi.mocked(readLease);
const enqueueMock = vi.mocked(enqueueOutboxItem);
const sessionEnabledMock = vi.mocked(platformSessionEnabled);
const writeTokenMock = vi.mocked(getHouseholdWriteToken);
const idleMinutesMock = vi.mocked(getPlatformIdleMinutes);

const SECRET = "test-secret-with-enough-entropy";

function makeHandle(overrides: Partial<PlatformSessionLease> = {}) {
  const payload = {
    v: 1 as const,
    publicSessionId: "platform--session",
    sessionRecordId: "recSession123",
    issuedAt: "2026-08-12T09:00:00.000Z",
  };
  const handle = createPlatformSessionHandle(payload);
  const lease: PlatformSessionLease = {
    ...payload,
    handle,
    lastActivityAt: "2026-08-12T09:00:00.000Z",
    state: "active",
    nextSequence: 4,
    ...overrides,
  };
  return { handle, lease, payload };
}

describe("platform session-service", () => {
  beforeEach(() => {
    process.env.PLATFORM_SESSION_SECRET = SECRET;
    sessionEnabledMock.mockReturnValue(true);
    writeTokenMock.mockReturnValue("pat_write");
    idleMinutesMock.mockReturnValue(30);
    createRecordMock.mockReset();
    createLeaseMock.mockReset();
    mutateLeaseMock.mockReset();
    readLeaseMock.mockReset();
    enqueueMock.mockReset();
  });

  afterEach(() => {
    delete process.env.PLATFORM_SESSION_SECRET;
    vi.clearAllMocks();
  });

  it("startPlatformSession no-ops when sessions are disabled", async () => {
    sessionEnabledMock.mockReturnValue(false);
    await expect(startPlatformSession({})).resolves.toEqual({ enabled: false });
    expect(createRecordMock).not.toHaveBeenCalled();
  });

  it("startPlatformSession writes Session Id + Started field IDs (not display names)", async () => {
    createRecordMock.mockResolvedValueOnce({
      id: "recNewSession",
      fields: {},
    });
    createLeaseMock.mockResolvedValueOnce(undefined);

    const result = await startPlatformSession({
      pageUrl: "https://astrajax.com/enter",
      parentSessionId: "platform--parent",
    });

    expect(result.enabled).toBe(true);
    expect(result.sessionRecordId).toBe("recNewSession");
    expect(createRecordMock).toHaveBeenCalledOnce();
    const written = createRecordMock.mock.calls[0]?.[0]?.fields as Record<
      string,
      unknown
    >;
    // Lock the Airtable field IDs — display-name keys would silently drop or
    // write to the wrong column if the Sessions schema drifts.
    expect(written[HOUSEHOLD_SESSION_FIELDS.sessionId]).toEqual(
      expect.stringMatching(/^platform--/),
    );
    expect(written[HOUSEHOLD_SESSION_FIELDS.parentSessionId]).toBe(
      "platform--parent",
    );
    expect(written[HOUSEHOLD_SESSION_FIELDS.started]).toEqual(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
    expect(written[HOUSEHOLD_SESSION_FIELDS.threadUrl]).toBe(
      "https://astrajax.com/enter",
    );
    expect(written).not.toHaveProperty("Started");
    expect(written).not.toHaveProperty("Session ID");
  });

  it("reservePlatformSequences clamps count into 1..20", async () => {
    const { handle, lease } = makeHandle();
    mutateLeaseMock.mockImplementationOnce(async (_id, mutation) => {
      const next = mutation(lease);
      return next.result;
    });

    const high = await reservePlatformSequences(handle, 99);
    expect(high.sequences).toHaveLength(20);
    expect(high.sequences[0]).toBe(4);
    expect(high.sequences[19]).toBe(23);

    mutateLeaseMock.mockImplementationOnce(async (_id, mutation) => {
      const next = mutation(lease);
      return next.result;
    });
    const low = await reservePlatformSequences(handle, 0);
    expect(low.sequences).toEqual([4]);
  });

  it("reservePlatformSequences rejects a closed lease", async () => {
    const { handle, lease } = makeHandle({ state: "closed" });
    mutateLeaseMock.mockImplementationOnce(async (_id, mutation) => {
      return mutation(lease).result;
    });

    await expect(reservePlatformSequences(handle, 1)).rejects.toThrow(
      /Platform session is closed/,
    );
  });

  it("closePlatformSession returns false when already closed", async () => {
    const { handle, lease } = makeHandle({ state: "closed" });
    mutateLeaseMock.mockImplementationOnce(async (_id, mutation) => {
      return mutation(lease).result;
    });

    await expect(closePlatformSession(handle, "closed_by_user")).resolves.toBe(
      false,
    );
    expect(enqueueMock).not.toHaveBeenCalled();
  });

  it("closePlatformSession queues Session End and marks the lease closed", async () => {
    const { handle, lease } = makeHandle({ state: "active", nextSequence: 2 });
    const states: string[] = [];
    mutateLeaseMock
      .mockImplementationOnce(async (_id, mutation) => {
        const next = mutation(lease);
        states.push(next.lease.state);
        return next.result;
      })
      .mockImplementationOnce(async (_id, mutation) => {
        const next = mutation({ ...lease, state: "closing", outcome: "timed_out" });
        states.push(next.lease.state);
        return next.result;
      });
    enqueueMock.mockResolvedValueOnce("platform-activity/outbox/evt.json");

    await expect(closePlatformSession(handle, "timed_out")).resolves.toBe(true);
    expect(enqueueMock).toHaveBeenCalledOnce();
    const queued = enqueueMock.mock.calls[0]?.[0];
    expect(queued?.envelope.eventType).toBe("Session End");
    expect(queued?.envelope.outcome).toBe("timed_out");
    expect(states).toEqual(["closing", "closed"]);
  });

  it("reopenPlatformSession times out an idle paused lease", async () => {
    const { handle, lease } = makeHandle({
      state: "paused",
      lastActivityAt: "2026-08-01T00:00:00.000Z",
    });
    readLeaseMock.mockResolvedValueOnce(lease);
    mutateLeaseMock.mockImplementation(async (_id, mutation) => {
      const current = { ...lease, state: "active" as const };
      return mutation(current).result;
    });
    enqueueMock.mockResolvedValue("platform-activity/outbox/evt.json");

    await expect(reopenPlatformSession(handle)).resolves.toBe("timed_out");
  });
});
