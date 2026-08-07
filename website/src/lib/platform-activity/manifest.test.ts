import { describe, expect, it } from "vitest";
import {
  brainManifest,
  codeManifest,
  contextReferenced,
  NO_CONTEXT_MANIFEST,
} from "./manifest";

describe("platform activity route manifests", () => {
  it("builds a code manifest with optional urls", () => {
    expect(
      codeManifest({
        source: "court-personas",
        promptVersion: "court-bicker-v2",
        urls: ["https://astrajax.com/court"],
      }),
    ).toEqual({
      kind: "code",
      recordIds: [],
      urls: ["https://astrajax.com/court"],
      promptVersion: "court-bicker-v2",
      source: "court-personas",
    });
  });

  it("downgrades an empty brain manifest to kind none", () => {
    expect(
      brainManifest({
        recordIds: [],
        source: "trusted-brain",
        promptVersion: "v1",
      }).kind,
    ).toBe("none");

    expect(
      brainManifest({
        recordIds: ["recTruth1"],
        source: "trusted-brain",
        promptVersion: "v1",
      }).kind,
    ).toBe("brain");
  });

  it("serialises provenance for activity detail without inventing records", () => {
    expect(contextReferenced(NO_CONTEXT_MANIFEST)).toContain("prompt:code:none");
    expect(contextReferenced(NO_CONTEXT_MANIFEST)).toContain("source:none");

    const referenced = contextReferenced(
      brainManifest({
        recordIds: ["recA", "recB"],
        source: "curation",
        promptVersion: "curation-v3",
        urls: ["https://example.com/doc"],
      }),
    );
    expect(referenced).toContain("record:recA");
    expect(referenced).toContain("record:recB");
    expect(referenced).toContain("url:https://example.com/doc");
    expect(referenced).toContain("prompt:curation-v3");
    expect(referenced).toContain("source:curation");
  });
});
