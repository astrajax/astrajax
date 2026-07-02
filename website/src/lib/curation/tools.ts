import type { ContextDestination } from "./destinations";

export type CurationToolName =
  | "get_pending_docket"
  | "get_trusted_truths"
  | "propose_draft_truth"
  | "propose_truth_edit"
  | "propose_quarantine"
  | "route_intake_item"
  | "mark_no_action"
  | "promote_to_trusted";

export const CURATION_TOOLS = [
  {
    name: "get_pending_docket",
    description: "Read-only summary of pending drafts, flagged interactions, and source documents.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_trusted_truths",
    description: "Read-only list of current Trusted Brain Truth rows for this brain.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "propose_draft_truth",
    description: "Propose a new Draft Brain Truth in the Workshop.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        canonicalText: { type: "string" },
        proposedCategory: { type: "string", enum: ["Definition", "Knowledge", "Open Questions"] },
      },
      required: ["title", "canonicalText", "proposedCategory"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_truth_edit",
    description: "Propose a Workshop draft that replaces an existing Trusted truth.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        canonicalText: { type: "string" },
        supersedesTrustedTruthId: { type: "string" },
        proposedCategory: { type: "string", enum: ["Definition", "Knowledge", "Open Questions"] },
      },
      required: ["title", "canonicalText", "supersedesTrustedTruthId", "proposedCategory"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_quarantine",
    description: "Flag an interaction or draft for quarantine review.",
    input_schema: {
      type: "object",
      properties: {
        recordId: { type: "string" },
        recordType: { type: "string", enum: ["interaction", "draft"] },
        reason: { type: "string" },
      },
      required: ["recordId", "recordType", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "route_intake_item",
    description: "File an intake candidate as a Workshop Source Document or Draft Brain Truth.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        canonicalText: { type: "string" },
        target: { type: "string", enum: ["source_document", "draft_truth"] },
      },
      required: ["title", "canonicalText", "target"],
      additionalProperties: false,
    },
  },
  {
    name: "mark_no_action",
    description: "Close a reviewed interaction as No action with a reason.",
    input_schema: {
      type: "object",
      properties: {
        recordId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["recordId", "reason"],
      additionalProperties: false,
    },
  },
  {
    name: "promote_to_trusted",
    description: "Demo: copy a draft directly to Trusted Brain Truth on Architect confirm.",
    input_schema: {
      type: "object",
      properties: {
        draftRecordId: { type: "string" },
        category: { type: "string" },
        scope: { type: "string" },
      },
      required: ["draftRecordId", "category", "scope"],
      additionalProperties: false,
    },
  },
] as const;

export function toolDestination(toolName: CurationToolName): ContextDestination {
  switch (toolName) {
    case "promote_to_trusted":
      return "trusted-brain-truth";
    case "propose_quarantine":
    case "mark_no_action":
      return "workshop-interactions";
    case "route_intake_item":
      return "workshop-source-document";
    default:
      return "workshop-draft-truth";
  }
}

export function parseToolInput(toolName: CurationToolName, raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Invalid input for ${toolName}`);
  }
  return raw as Record<string, unknown>;
}
