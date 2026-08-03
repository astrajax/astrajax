import { describe, expect, it } from "vitest";
import {
  buildCurationGroundingManifest,
  extractManifestRecordIds,
} from "./grounding";
import type { CurationDocket } from "./types";

const emptyDocket: CurationDocket = {
  brainSlug: "astrajax-chapter-1",
  mode: "memory",
  drafts: [{ recordId: "recDraft1", title: "Draft", canonicalText: "Body", status: "Draft" }],
  flaggedInteractions: [],
  pendingSourceDocuments: [{ recordId: "recSrc1", title: "Intake" }],
  trustedTruths: [],
};

describe("curation grounding manifest", () => {
  it("marks fallback snippets and omits them from Workshop log record ids", () => {
    const manifest = buildCurationGroundingManifest({
      brainSlug: "astrajax-chapter-1",
      trustedSnippets: [
        {
          recordId: "recTrusted1",
          title: "Live truth",
          text: "Canonical wording",
          scope: "read:brain-truth:positioning",
        },
        {
          recordId: "fallback-positioning",
          title: "Seed fallback",
          text: "Offline copy",
          scope: "read:brain-truth:positioning",
        },
      ],
      docket: emptyDocket,
      source: "fallback",
    });

    expect(manifest.trustedTruths.blocks).toEqual([
      { recordId: "recTrusted1", title: "Live truth", layer: "trusted-truth" },
      {
        recordId: "fallback-positioning",
        title: "Seed fallback",
        layer: "fallback",
      },
    ]);
    expect(manifest.docket).toEqual({
      draftCount: 1,
      flaggedInteractionCount: 0,
      pendingSourceDocumentCount: 1,
    });
    expect(extractManifestRecordIds(manifest)).toEqual(["recTrusted1"]);
  });
});
