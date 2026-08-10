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
  runReconcile: vi.fn(),
}));

describe("GET /api/cron/sync/reconcile", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 before any reconcile work", async () => {
    const { assertCronAuthorised } = await import("@/lib/platform-activity/cron");
    vi.mocked(assertCronAuthorised).mockImplementation(() => {
      throw new Error("CRON_SECRET is not configured.");
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/cron/sync/reconcile"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "CRON_SECRET is not configured.",
    });
  });

  it("runs reconcile for each configured source when enabled", async () => {
    const { assertCronAuthorised } = await import("@/lib/platform-activity/cron");
    const { contextIndexSyncEnabled } = await import("@/lib/context-index/config");
    const { getContextIndexSources } = await import("@/lib/context-index/sources");
    const { runReconcile } = await import("@/lib/context-index/sync");

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
    ]);
    vi.mocked(runReconcile).mockResolvedValue({ live: 10, deleted: 0 });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/cron/sync/reconcile"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      mode: "reconcile",
      results: {
        "astrajax-chapter-1:tblA": { live: 10, deleted: 0 },
      },
    });
  });
});
