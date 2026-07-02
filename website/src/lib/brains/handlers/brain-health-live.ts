import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { retrieveTrustedSnippets } from "@/lib/brains/trusted-truth";
import type { BrainHealthSnapshot, BrainTruthRow } from "@/lib/platform/brain-health";
import { DEFAULT_BRAIN_HEALTH } from "@/lib/platform/brain-health";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";

const TRUSTED_SCOPES = ["read:brain-truth:positioning", "read:brain-truth:governance"];

export async function handleBrainHealthLive(brainSlug: string): Promise<{
  snapshot: BrainHealthSnapshot;
  source: "live" | "fallback";
  message?: string;
}> {
  const slug = brainSlug.trim() || CHAPTER1_BRAIN_SLUG;

  const [draftResult, interactionResult] = await Promise.all([
    handleDraftTruthList(slug),
    handleInteractionList({ brainSlug: slug, limit: 20 }),
  ]);

  const trustedRows: BrainTruthRow[] = [];
  for (const scope of TRUSTED_SCOPES) {
    const snippets = await retrieveTrustedSnippets({ brainSlug: slug, scope });
    for (const snippet of snippets) {
      if (snippet.recordId.startsWith("fallback")) continue;
      trustedRows.push({
        id: snippet.recordId,
        title: snippet.title,
        summary: snippet.text.slice(0, 240),
        domain: scope.replace("read:brain-truth:", ""),
        status: "approved",
      });
    }
  }

  const draftRows: BrainTruthRow[] = draftResult.drafts.map((draft) => ({
    id: draft.recordId,
    title: draft.title,
    summary: draft.canonicalText.slice(0, 240),
    domain: draft.proposedCategory,
    status: "draft",
  }));

  const flaggedCount = interactionResult.interactions.filter(
    (item) =>
      item.reviewStatus === "Action proposed" ||
      item.contextFlagged === "Flagged for review" ||
      item.contextFlagged === "Quarantine proposed" ||
      (item.qualityScore !== undefined && item.qualityScore <= 2),
  ).length;

  const approvedCount = trustedRows.length;
  const draftCount = draftRows.length;
  const hasLive =
    draftResult.mode === "airtable" || approvedCount > 0;

  const snapshot: BrainHealthSnapshot = {
    ...DEFAULT_BRAIN_HEALTH,
    brainSlug: slug,
    brainName: "AstraJax Chapter 1",
    currentLevel: approvedCount >= 10 ? "working" : approvedCount >= 3 ? "house-trained" : "seedling",
    nextLevel: approvedCount >= 10 ? "sharp" : approvedCount >= 3 ? "working" : "house-trained",
    metrics: {
      ...DEFAULT_BRAIN_HEALTH.metrics,
      approvedRecordCount: approvedCount,
      draftRecordCount: draftCount,
      knownGaps:
        approvedCount === 0
          ? ["No trusted truths loaded yet — run demo seed or sit with Clive"]
          : draftCount > 0
            ? [`${draftCount} draft row(s) awaiting review`]
            : [],
      answerFailureRate:
        interactionResult.interactions.length > 0
          ? Math.round(
              (interactionResult.interactions.filter((i) => (i.qualityScore ?? 5) <= 2).length /
                interactionResult.interactions.length) *
                100,
            )
          : 0,
      lastReviewed: new Date().toISOString(),
    },
    truths: [...trustedRows, ...draftRows],
    memories: [],
  };

  return {
    snapshot,
    source: hasLive ? "live" : "fallback",
    message: hasLive ? undefined : "Showing fallback counts — wire Workshop/Trusted tokens for live data.",
  };
}
