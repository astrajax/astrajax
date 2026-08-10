import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextIndexSource } from "./sources";

const sqlMock = vi.fn();
const getSourceReadTokenMock = vi.fn();
const sourceKeyMock = vi.fn(
  (source: ContextIndexSource) =>
    `${source.clientId}:${source.baseId}:${source.tableId}`,
);

vi.mock("./db", () => ({
  getContextIndexSql: () => sqlMock,
  toVectorLiteral: (values: number[]) => `[${values.join(",")}]`,
}));

vi.mock("./sources", async () => {
  const actual = await vi.importActual<typeof import("./sources")>("./sources");
  return {
    ...actual,
    getSourceReadToken: (...args: unknown[]) => getSourceReadTokenMock(...args),
    sourceKey: (source: ContextIndexSource) => sourceKeyMock(source),
  };
});

const source: ContextIndexSource = {
  clientId: "astrajax-chapter-1",
  baseId: "appTest",
  tableId: "tblTest",
  labelField: "Title",
  fields: ["Title", "Canonical Text"],
  approvedField: "Last Reviewed",
  tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
};

describe("context-index sync", () => {
  beforeEach(() => {
    vi.resetModules();
    sqlMock.mockReset();
    getSourceReadTokenMock.mockReset();
    sourceKeyMock.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fails closed when the Trusted read token is missing", async () => {
    getSourceReadTokenMock.mockReturnValue(undefined);
    sqlMock.mockResolvedValue([]);

    const { runIncremental } = await import("./sync");
    await expect(runIncremental(source)).rejects.toThrow(
      /BRAIN_TRUSTED_READ_TOKEN is not configured/,
    );
  });

  it("returns fetched:0 when Airtable has no changes since the watermark", async () => {
    getSourceReadTokenMock.mockReturnValue("pat-test");
    sqlMock.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join(" ");
      if (text.includes("INSERT INTO sync_runs")) return [{ id: "run_1" }];
      if (text.includes("SELECT watermark")) {
        return [{ watermark: "2026-08-01T00:00:00.000Z" }];
      }
      return [];
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ records: [] }), { status: 200 }),
    );

    const { runIncremental } = await import("./sync");
    await expect(runIncremental(source)).resolves.toEqual({
      fetched: 0,
      upserted: 0,
    });

    expect(fetch).toHaveBeenCalledOnce();
    const calledUrl = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(calledUrl).toContain("filterByFormula=");
    expect(calledUrl).toContain("LAST_MODIFIED_TIME");
    expect(calledUrl).toContain("fields%5B%5D=Title");
  });

  it("reconcile deletes every indexed row when Airtable returns no live ids", async () => {
    getSourceReadTokenMock.mockReturnValue("pat-test");
    sqlMock.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join(" ");
      if (text.includes("INSERT INTO sync_runs")) return [{ id: "run_2" }];
      if (text.includes("DELETE FROM context_chunks")) {
        return [{ id: 11 }, { id: 12 }];
      }
      return [];
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ records: [] }), { status: 200 }),
    );

    const { runReconcile } = await import("./sync");
    await expect(runReconcile(source)).resolves.toEqual({
      live: 0,
      deleted: 2,
    });

    const deleteCall = sqlMock.mock.calls.find((call) =>
      String(call[0]?.join?.(" ") ?? call[0]).includes("DELETE FROM context_chunks"),
    );
    expect(deleteCall).toBeTruthy();
  });
});
