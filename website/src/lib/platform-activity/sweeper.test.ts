import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./blob-store", () => ({
  listLeaseBlobs: vi.fn(),
  readLease: vi.fn(),
}));

vi.mock("./session-service", () => ({
  closePlatformSession: vi.fn(),
}));

vi.mock("./config", async () => {
  const actual = await vi.importActual<typeof import("./config")>("./config");
  return {
    ...actual,
    getPlatformIdleMinutes: vi.fn(() => 30),
  };
});

import { listLeaseBlobs, readLease } from "./blob-store";
import { getPlatformIdleMinutes } from "./config";
import { closePlatformSession } from "./session-service";
import { sweepIdlePlatformSessions } from "./sweeper";
import type { PlatformSessionLease } from "./types";

const listMock = vi.mocked(listLeaseBlobs);
const readMock = vi.mocked(readLease);
const closeMock = vi.mocked(closePlatformSession);
const idleMock = vi.mocked(getPlatformIdleMinutes);

function lease(
  overrides: Partial<PlatformSessionLease> = {},
): PlatformSessionLease {
  return {
    v: 1,
    publicSessionId: "platform--a",
    sessionRecordId: "recA",
    issuedAt: "2026-08-12T08:00:00.000Z",
    handle: "handle.a",
    lastActivityAt: "2026-08-12T08:00:00.000Z",
    state: "active",
    nextSequence: 1,
    ...overrides,
  };
}

describe("sweepIdlePlatformSessions", () => {
  beforeEach(() => {
    listMock.mockReset();
    readMock.mockReset();
    closeMock.mockReset();
    idleMock.mockReturnValue(30);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("times out idle leases and skips fresh or already-closed ones", async () => {
    listMock.mockResolvedValueOnce([
      { pathname: "platform-activity/leases/idle.json" },
      { pathname: "platform-activity/leases/fresh.json" },
      { pathname: "platform-activity/leases/closed.json" },
    ] as Awaited<ReturnType<typeof listLeaseBlobs>>);

    readMock
      .mockResolvedValueOnce(
        lease({
          publicSessionId: "idle",
          handle: "handle.idle",
          lastActivityAt: "2020-01-01T00:00:00.000Z",
          state: "active",
        }),
      )
      .mockResolvedValueOnce(
        lease({
          publicSessionId: "fresh",
          handle: "handle.fresh",
          lastActivityAt: new Date().toISOString(),
          state: "paused",
        }),
      )
      .mockResolvedValueOnce(
        lease({
          publicSessionId: "closed",
          handle: "handle.closed",
          lastActivityAt: "2020-01-01T00:00:00.000Z",
          state: "closed",
        }),
      );
    closeMock.mockResolvedValueOnce(true);

    await expect(sweepIdlePlatformSessions()).resolves.toEqual({
      scanned: 3,
      timedOut: 1,
      errors: 0,
    });
    expect(closeMock).toHaveBeenCalledOnce();
    expect(closeMock).toHaveBeenCalledWith("handle.idle", "timed_out");
  });

  it("counts close failures without aborting the sweep", async () => {
    listMock.mockResolvedValueOnce([
      { pathname: "platform-activity/leases/bad.json" },
      { pathname: "platform-activity/leases/ok.json" },
    ] as Awaited<ReturnType<typeof listLeaseBlobs>>);
    readMock
      .mockResolvedValueOnce(
        lease({
          publicSessionId: "bad",
          handle: "handle.bad",
          lastActivityAt: "2020-01-01T00:00:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        lease({
          publicSessionId: "ok",
          handle: "handle.ok",
          lastActivityAt: "2020-01-01T00:00:00.000Z",
        }),
      );
    closeMock
      .mockRejectedValueOnce(new Error("lease busy"))
      .mockResolvedValueOnce(true);

    await expect(sweepIdlePlatformSessions()).resolves.toEqual({
      scanned: 2,
      timedOut: 1,
      errors: 1,
    });
  });
});
