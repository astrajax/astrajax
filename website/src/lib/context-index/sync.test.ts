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
  fields: ["Title", "CanonicalText"],
  approvedField: "Last Reviewed",
  tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
};

function sqlCallText(call: unknown[]): string {
  const first = call[0] as TemplateStringsArray | string | undefined;
  return typeof first === "string" ? first : String(first?.join(" ") ?? "");
}

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
      sqlCallText(call).includes("DELETE FROM context_chunks"),
    );
    expect(deleteCall).toBeTruthy();
  });

  it("paginates past five Airtable pages before advancing the watermark", async () => {
    getSourceReadTokenMock.mockReturnValue("pat-test");
    process.env.OPENAI_API_KEY = "sk-test";

    sqlMock.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join(" ");
      if (text.includes("INSERT INTO sync_runs")) return [{ id: "run_pages" }];
      if (text.includes("SELECT watermark")) return [{ watermark: null }];
      return [];
    });

    const pageCount = 6;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("api.openai.com")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          input?: string[];
        };
        const count = Array.isArray(body.input) ? body.input.length : 1;
        return new Response(
          JSON.stringify({
            data: Array.from({ length: count }, () => ({
              embedding: [0.1, 0.2],
            })),
          }),
          { status: 200 },
        );
      }

      const offset = new URL(url).searchParams.get("offset");
      const page = offset ? Number.parseInt(offset.replace("p", ""), 10) : 0;
      const recordId = "recPage" + page;
      const nextOffset = page + 1 < pageCount ? "p" + (page + 1) : undefined;
      return new Response(
        JSON.stringify({
          records: [
            {
              id: recordId,
              createdTime: "2026-08-01T00:00:00.000Z",
              fields: {
                Title: "Row " + page,
                CanonicalText: "Body " + page,
              },
            },
          ],
          offset: nextOffset,
        }),
        { status: 200 },
      );
    });

    const { runIncremental } = await import("./sync");
    const result = await runIncremental(source);
    expect(result.fetched).toBe(pageCount);
    // Title + CanonicalText per record.
    expect(result.upserted).toBe(pageCount * 2);

    const airtableCalls = vi
      .mocked(fetch)
      .mock.calls.filter((call) => String(call[0]).includes("api.airtable.com"));
    expect(airtableCalls).toHaveLength(pageCount);

    const insertCalls = sqlMock.mock.calls.filter((call) =>
      sqlCallText(call).includes("INSERT INTO context_chunks"),
    );
    expect(insertCalls).toHaveLength(pageCount * 2);

    const watermarkWrite = sqlMock.mock.calls.find((call) =>
      sqlCallText(call).includes("INSERT INTO sync_state"),
    );
    expect(watermarkWrite).toBeTruthy();
  });

  it("prunes stale chunks when fetched rows yield zero embeddable fields", async () => {
    getSourceReadTokenMock.mockReturnValue("pat-test");

    sqlMock.mockImplementation(async (strings: TemplateStringsArray) => {
      const text = strings.join(" ");
      if (text.includes("INSERT INTO sync_runs")) return [{ id: "run_prune" }];
      if (text.includes("SELECT watermark")) {
        return [{ watermark: "2026-08-01T00:00:00.000Z" }];
      }
      return [];
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recEmpty",
              createdTime: "2026-08-02T00:00:00.000Z",
              fields: { Title: "", CanonicalText: "" },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const { runIncremental } = await import("./sync");
    await expect(runIncremental(source)).resolves.toEqual({
      fetched: 1,
      upserted: 0,
    });

    const pruneCall = sqlMock.mock.calls.find((call) =>
      sqlCallText(call).includes("DELETE FROM context_chunks"),
    );
    expect(pruneCall).toBeTruthy();

    const watermarkWrite = sqlMock.mock.calls.find((call) =>
      sqlCallText(call).includes("INSERT INTO sync_state"),
    );
    expect(watermarkWrite).toBeTruthy();
  });
});
