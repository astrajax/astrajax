import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";
import { isFallbackManifest } from "@/lib/brains/interaction-upkeep";
import {
  DEMO_SCOPES,
  FALLBACK_TRUSTED_SNIPPETS,
  retrieveTrustedSnippets,
} from "@/lib/brains/trusted-truth";
import { FALLBACK_CONTEXT } from "./fallback-context";
import type { ContextBlock } from "./types";

export type CliveContextSource = "trusted" | "fallback";

export interface CliveContextManifest {
  recordIds: string[];
  hashes: string[];
}

export interface CliveContextLoadResult {
  blocks: ContextBlock[];
  source: CliveContextSource;
  manifest: CliveContextManifest;
}

/**
 * Public website scope — server-side trusted read for homepage Ask Clive.
 * No per-session Brain Key grant; uses the same Trusted Brain retrieval path
 * as grant-backed answers, with fallback when Trusted is not wired.
 */
const WEBSITE_PUBLIC_SCOPE = DEMO_SCOPES[0];

export function formatContextForPrompt(blocks: ContextBlock[]): string {
  return blocks
    .map(
      (block) =>
        `### ${block.title}${block.category ? ` (${block.category})` : ""}\n${block.text}`,
    )
    .join("\n\n");
}

export async function loadCliveContext(): Promise<CliveContextLoadResult> {
  const snippets = await retrieveTrustedSnippets({
    brainSlug: CHAPTER1_BRAIN_SLUG,
    scope: WEBSITE_PUBLIC_SCOPE,
  });

  const recordIds = snippets.map((snippet) => snippet.recordId);
  const hashes = snippets.map((snippet) => snippet.contentHash);

  if (snippets.length === 0 || isFallbackManifest(recordIds)) {
    const blocks =
      FALLBACK_CONTEXT.length > 0
        ? FALLBACK_CONTEXT
        : FALLBACK_TRUSTED_SNIPPETS.map((snippet) => ({
            title: snippet.title,
            text: snippet.text,
          }));

    return {
      blocks,
      source: "fallback",
      manifest: {
        recordIds: FALLBACK_TRUSTED_SNIPPETS.map((snippet) => snippet.recordId),
        hashes: FALLBACK_TRUSTED_SNIPPETS.map((snippet) => snippet.contentHash),
      },
    };
  }

  return {
    blocks: snippets.map((snippet) => ({
      title: snippet.title,
      text: snippet.text,
    })),
    source: "trusted",
    manifest: { recordIds, hashes },
  };
}
