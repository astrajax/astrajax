import {
  createDraftTruth,
  flagInteraction,
  markInteractionNoAction,
  promoteDraftToTrustedDemo,
  routeIntakeItem,
} from "@/lib/brains/handlers/draft-propose";
import type { CurationProposal } from "@/lib/curation/types";
import type { CurationToolName } from "@/lib/curation/tools";

export async function executeCurationProposal(input: {
  proposal: CurationProposal;
  actor?: string;
}): Promise<CurationProposal> {
  const { proposal } = input;
  const actor = input.actor?.trim() || "Architect";
  const payload = proposal.payload;
  const toolName = proposal.toolName as CurationToolName;

  try {
    let recordId = "";
    switch (toolName) {
      case "propose_draft_truth":
        recordId = (
          await createDraftTruth({
            brainSlug: proposal.brainSlug,
            title: String(payload.title),
            canonicalText: String(payload.canonicalText),
            proposedCategory: String(payload.proposedCategory),
            actor,
          })
        ).recordId;
        break;
      case "propose_truth_edit":
        recordId = (
          await createDraftTruth({
            brainSlug: proposal.brainSlug,
            title: String(payload.title),
            canonicalText: String(payload.canonicalText),
            proposedCategory: String(payload.proposedCategory),
            supersedesTrustedTruthId: String(payload.supersedesTrustedTruthId),
            actor,
          })
        ).recordId;
        break;
      case "promote_to_trusted":
        recordId = (
          await promoteDraftToTrustedDemo({
            brainSlug: proposal.brainSlug,
            draftRecordId: String(payload.draftRecordId),
            category: String(payload.category),
            scope: String(payload.scope),
            actor,
          })
        ).recordId;
        break;
      case "propose_quarantine":
        recordId = (
          await flagInteraction({
            recordId: String(payload.recordId),
            brainSlug: proposal.brainSlug,
            quarantine: true,
            actor,
          })
        ).recordId;
        break;
      case "mark_no_action":
        recordId = (
          await markInteractionNoAction({
            recordId: String(payload.recordId),
            reason: String(payload.reason),
            actor,
          })
        ).recordId;
        break;
      case "route_intake_item":
        recordId = (
          await routeIntakeItem({
            brainSlug: proposal.brainSlug,
            title: String(payload.title),
            canonicalText: String(payload.canonicalText),
            target: payload.target === "source_document" ? "source_document" : "draft_truth",
            actor,
          })
        ).recordId;
        break;
      default:
        throw new Error(`Tool ${toolName} cannot be confirmed from the UI.`);
    }

    return { ...proposal, status: "confirmed", recordId };
  } catch (error) {
    return {
      ...proposal,
      status: "failed",
      error: error instanceof Error ? error.message : "Could not file record.",
    };
  }
}
