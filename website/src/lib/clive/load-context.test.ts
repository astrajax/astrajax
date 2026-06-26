import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCliveContext } from "./load-context";

describe("loadCliveContext (Brain Key aligned)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.BRAIN_TRUSTED_READ_TOKEN = "patTrustedRead";
    process.env.BRAIN_KEY_USE_MEMORY = "true";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("returns trusted snippets and manifest when Trusted Brain is wired", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recPositioning",
              fields: {
                Title: "What AstraJax is",
                "Canonical Text": "Trusted positioning copy.",
                Scope: "read:brain-truth:positioning",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await loadCliveContext();

    expect(result.source).toBe("trusted");
    expect(result.blocks[0]?.title).toBe("What AstraJax is");
    expect(result.manifest.recordIds).toEqual(["recPositioning"]);
    expect(result.manifest.hashes.length).toBe(1);
  });

  it("returns fallback manifest when Trusted Brain is not wired", async () => {
    delete process.env.BRAIN_TRUSTED_READ_TOKEN;

    const result = await loadCliveContext();

    expect(result.source).toBe("fallback");
    expect(result.manifest.recordIds).toContain("fallback-positioning");
    expect(result.blocks.length).toBeGreaterThan(0);
  });
});
