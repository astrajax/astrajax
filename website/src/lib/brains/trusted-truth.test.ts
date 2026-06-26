import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_SCOPES,
  FALLBACK_TRUSTED_SNIPPETS,
  retrieveTrustedSnippets,
} from "./trusted-truth";

describe("Trusted truth scope filtering", () => {
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

  it("documents demo scopes for exact-match retrieval", () => {
    expect(DEMO_SCOPES).toContain("read:brain-truth:positioning");
    expect(DEMO_SCOPES).toContain("read:brain-truth:governance");
  });

  it("returns seeded snippets for a matching demo scope", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          records: [
            {
              id: "recPositioning",
              fields: {
                Title: "Positioning headline",
                "Canonical Text": "Canonical positioning copy from Trusted Brain.",
                Scope: "read:brain-truth:positioning",
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const snippets = await retrieveTrustedSnippets({
      brainSlug: "astrajax-chapter-1",
      scope: "read:brain-truth:positioning",
    });

    expect(snippets).toHaveLength(1);
    expect(snippets[0].recordId).toBe("recPositioning");
    expect(snippets[0].title).toBe("Positioning headline");
    expect(snippets[0]).not.toEqual(FALLBACK_TRUSTED_SNIPPETS[0]);

    const calledUrl = String(mockFetch.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("read%3Abrain-truth%3Apositioning");
    expect(calledUrl).toContain("%7BScope%7D%3D");
  });

  it("returns fallback when scope does not match any trusted row", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ records: [] }), { status: 200 }),
    );

    const snippets = await retrieveTrustedSnippets({
      brainSlug: "astrajax-chapter-1",
      scope: "read:brain-truth:nonexistent",
    });

    expect(snippets).toEqual(FALLBACK_TRUSTED_SNIPPETS);
  });
});
