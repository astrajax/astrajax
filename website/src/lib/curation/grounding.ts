import type { ContextSnippet } from "@/lib/brains/types";
import type { CurationDocket } from "./types";

export type GroundingBlockRef = {
  recordId?: string;
  title: string;
  layer: "trusted-truth" | "draft-truth" | "interaction" | "source-document" | "fallback";
};

export type CurationGroundingManifest = {
  v: 1;
  brainSlug: string;
  trustedTruths: { source: "airtable" | "fallback"; blocks: GroundingBlockRef[] };
  docket: {
    draftCount: number;
    flaggedInteractionCount: number;
    pendingSourceDocumentCount: number;
  };
};

export function buildCurationGroundingManifest(input: {
  brainSlug: string;
  trustedSnippets: ContextSnippet[];
  docket: CurationDocket;
  source: "airtable" | "fallback";
}): CurationGroundingManifest {
  return {
    v: 1,
    brainSlug: input.brainSlug,
    trustedTruths: {
      source: input.source,
      blocks: input.trustedSnippets.map((snippet) => ({
        recordId: snippet.recordId,
        title: snippet.title,
        layer: snippet.recordId.startsWith("fallback") ? "fallback" : "trusted-truth",
      })),
    },
    docket: {
      draftCount: input.docket.drafts.length,
      flaggedInteractionCount: input.docket.flaggedInteractions.length,
      pendingSourceDocumentCount: input.docket.pendingSourceDocuments.length,
    },
  };
}

export function serialiseGroundingManifest(manifest: CurationGroundingManifest): string {
  return JSON.stringify(manifest);
}

export function extractManifestRecordIds(manifest: CurationGroundingManifest): string[] {
  return manifest.trustedTruths.blocks
    .map((block) => block.recordId)
    .filter((id): id is string => Boolean(id && !id.startsWith("fallback")));
}
