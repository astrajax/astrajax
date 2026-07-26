import { retrieveTrustedSnippets, FALLBACK_TRUSTED_SNIPPETS } from "@/lib/brains/trusted-truth";
import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { airtableSelect } from "@/lib/brains/airtable-rest";
import {
  BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS,
  BRAIN_WORKSHOP_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "@/lib/brains/airtable-ids";
import { getWorkshopBaseId, getWorkshopReadToken, getWorkshopWriteToken } from "@/lib/brains/config";
import type { CurationDocket, TrustedTruthRow } from "./types";

const TRUSTED_SCOPES = ["read:brain-truth:positioning", "read:brain-truth:governance"];

async function loadTrustedTruthRows(brainSlug: string): Promise<TrustedTruthRow[]> {
  const rows: TrustedTruthRow[] = [];
  for (const scope of TRUSTED_SCOPES) {
    const snippets = await retrieveTrustedSnippets({ brainSlug, scope });
    for (const snippet of snippets) {
      if (snippet.recordId.startsWith("fallback")) continue;
      rows.push({
        recordId: snippet.recordId,
        title: snippet.title,
        canonicalText: snippet.text,
        scope,
      });
    }
  }
  if (rows.length === 0) {
    return FALLBACK_TRUSTED_SNIPPETS.map((snippet) => ({
      recordId: snippet.recordId,
      title: snippet.title,
      canonicalText: snippet.text,
      scope: "read:brain-truth:positioning",
    }));
  }
  return rows;
}

async function loadPendingSourceDocuments(brainSlug: string) {
  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopReadToken() ?? getWorkshopWriteToken();
  if (!workshopBaseId || !workshopToken) return [];

  const records = await airtableSelect(
    workshopBaseId,
    BRAIN_WORKSHOP_TABLES.sourceDocuments,
    workshopToken,
    {
      filterByFormula: `AND({Brain Slug}='${brainSlug}', OR({Mine Status}='${BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.pending}', {Mine Status}='${BRAIN_WORKSHOP_SOURCE_DOCUMENTS_MINE_STATUS.summarised}'))`,
      maxRecords: 10,
    },
  );

  return records.map((record) => ({
    recordId: record.id,
    title: String(record.fields.Title ?? "Untitled source"),
    mineStatus: String(record.fields["Mine Status"] ?? ""),
  }));
}

export async function loadCurationDocket(brainSlug: string): Promise<CurationDocket> {
  const slug = brainSlug.trim() || CHAPTER1_BRAIN_SLUG;

  const [draftResult, interactionResult, trustedTruths, pendingSourceDocuments] =
    await Promise.all([
      handleDraftTruthList(slug),
      handleInteractionList({ brainSlug: slug, shortlist: true, limit: 10 }).catch(() => ({
        interactions: [],
        warning: "Could not load flagged interactions.",
      })),
      loadTrustedTruthRows(slug),
      loadPendingSourceDocuments(slug).catch(() => []),
    ]);

  const mode = draftResult.mode === "airtable" ? "airtable" : "memory";

  return {
    brainSlug: slug,
    mode,
    drafts: draftResult.drafts.map((draft) => ({
      recordId: draft.recordId,
      title: draft.title,
      canonicalText: draft.canonicalText,
      status: draft.status,
      proposedCategory: draft.proposedCategory,
    })),
    flaggedInteractions: interactionResult.interactions.map((item) => ({
      recordId: item.recordId,
      source: item.source,
      stableId: item.stableId,
      userMessage: item.userMessage,
      assistantReply: item.assistantReply,
      reviewStatus: item.reviewStatus,
      contextFlagged: item.contextFlagged,
      qualityScore: item.qualityScore,
    })),
    pendingSourceDocuments,
    trustedTruths,
  };
}

export function formatDocketForPrompt(docket: CurationDocket): string {
  const lines: string[] = [`Brain: ${docket.brainSlug}`, ""];

  lines.push(`TRUSTED TRUTHS (${docket.trustedTruths.length}):`);
  if (docket.trustedTruths.length === 0) {
    lines.push("- None loaded yet.");
  } else {
    for (const truth of docket.trustedTruths.slice(0, 12)) {
      lines.push(`- [${truth.recordId}] ${truth.title}: ${truth.canonicalText.slice(0, 200)}`);
    }
  }

  lines.push("", `DRAFT TRUTHS (${docket.drafts.length}):`);
  if (docket.drafts.length === 0) {
    lines.push("- None pending.");
  } else {
    for (const draft of docket.drafts) {
      lines.push(`- [${draft.recordId}] ${draft.title} (${draft.status})`);
    }
  }

  lines.push("", `FLAGGED INTERACTIONS (${docket.flaggedInteractions.length}):`);
  if (docket.flaggedInteractions.length === 0) {
    lines.push("- None flagged.");
  } else {
    for (const item of docket.flaggedInteractions) {
      lines.push(
        `- [${item.source}:${item.recordId}] score=${item.qualityScore ?? "?"} flagged=${item.contextFlagged ?? "None"}: ${item.userMessage.slice(0, 120)}`,
      );
    }
  }

  lines.push("", `SOURCE DOCUMENTS (${docket.pendingSourceDocuments.length}):`);
  if (docket.pendingSourceDocuments.length === 0) {
    lines.push("- None awaiting mining.");
  } else {
    for (const doc of docket.pendingSourceDocuments) {
      lines.push(`- [${doc.recordId}] ${doc.title} (${doc.mineStatus ?? "Pending"})`);
    }
  }

  return lines.join("\n");
}
