import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/platform-activity/cron", () => ({
  assertCronAuthorised: vi.fn(),
}));

vi.mock("@/lib/context-index/config", () => ({
  contextIndexSyncEnabled: vi.fn(),
}));

vi.mock("@/lib/context-index/sources", () => ({
  getContextIndexSources: vi.fn(),
}));

vi.mock("@/lib/context-index/sync", () => ({
  runIncremental: vi.fn(),
  runReconcile: vi.fn(),
}));

describe("GET /api/cron/sync", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when cron auth fails", async () => {
    const { assertCronAuthorised } = await import("@/lib/platform-activity/cron");
    vi.mocked(assertCronAuthorised).mockImplementation(() => {
      throw new Error("Unauthorised scheduled worker request.");
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/cron/sync"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorised scheduled worker request.",
    });
  });

  it("skips work when CONTEXT_INDEX_SYNC_ENABLED is off", async () => {
    const { assertCronAuthorised } = await import("@/lib/platform-activity/cron");
    const { contextIndexSyncEnabled } = await import("@/lib/context-index/config");
    const { getContextIndexSources } = await import("@/lib/context-index/sources");
    vi.mocked(assertCronAuthorised).mockImplementation(() => undefined);
    vi.mocked(contextIndexSyncEnabled).mockReturnValue(false);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/cron/sync"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      skipped: true,
      reason: "CONTEXT_INDEX_SYNC_ENABLED is not true.",
    });
    expect(getContextIndexSources).not.toHaveBeenCalled();
  });

  it("routes mode=reconcile to runReconcile and isolates per-source errors", async () => {
    const { assertCronAuthorised } = await import("@/lib/platform-activity/cron");
    const { contextIndexSyncEnabled } = await import("@/lib/context-index/config");
    const { getContextIndexSources } = await import("@/lib/context-index/sources");
    const { runIncremental, runReconcile } = await import("@/lib/context-index/sync");

    vi.mocked(assertCronAuthorised).mockImplementation(() => undefined);
    vi.mocked(contextIndexSyncEnabled).mockReturnValue(true);
    vi.mocked(getContextIndexSources).mockReturnValue([
      {
        clientId: "astrajax-chapter-1",
        baseId: "appA",
        tableId: "tblA",
        labelField: "Title",
        fields: ["Title"],
        tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
      },
      {
        clientId: "other",
        baseId: "appB",
        tableId: "tblB",
        labelField: "Title",
        fields: ["Title"],
        tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
      },
    ]);
    vi.mocked(runReconcile)
      .mockResolvedValueOnce({ live: 3, deleted: 1 })
      .mockRejectedValueOnce(new Error("Neon unavailable"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/cron/sync?mode=reconcile"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mode: "reconcile",
      results: {
        "astrajax-chapter-1:tblA": { live: 3, deleted: 1 },
        "other:tblB": { error: "Neon unavailable" },
      },
    });
    expect(runIncremental).not.toHaveBeenCalled();
    expect(runReconcile).toHaveBeenCalledTimes(2);
  });
});
