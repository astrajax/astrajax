import { normalizeCreatedBy } from "../airtable-field-values";
import { airtableCreate } from "../airtable-rest";
import {
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  DRAFT_TRUTH_STATUS,
} from "../airtable-ids";
import {
  getDocPromoteToken,
  getWorkshopBaseId,
  getWorkshopWriteToken,
  useMemoryStore,
} from "../config";
import {
  buildDraftTruthCreateFields,
  deriveHumanText,
  DRAFT_TRUTH_CAPTURE_SOURCE,
  DRAFT_TRUTH_FIELD_NAMES,
  resolveBrainRegistryRecordId,
  type DraftTruthCaptureSource,
} from "../draft-truth-write";
import type { ContextDestination } from "@/lib/curation/destinations";
import type { InteractionRecordSource } from "../types";
import { handleInteractionAction } from "./interaction-action";

const TRUSTED_SCOPE_PATTERN = /^read:brain-truth:[a-z0-9-]+$/;

type MemoryDraft = {
  recordId: string;
  title: string;
  canonicalText: string;
  canonicalTextForHumans?: string;
  brainSlug: string;
  status: string;
  supersedesTrustedTruthId?: string;
};

const memoryDrafts: MemoryDraft[] = [];
const memoryTrusted: Array<{ recordId: string; title: string; canonicalText: string }> = [];

function nextMemoryId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function writeToken(): string | undefined {
  return getDocPromoteToken() ?? getWorkshopWriteToken();
}

/**
 * Statuses that may still be promoted to Trusted.
 * Draft = pending on the bench; Approved = human confirmed on the Receiving Wall.
 * Terminal statuses (Quarantined / Promoted / Rejected) stay blocked.
 */
function isPromoteEligibleStatus(status: string): boolean {
  if (
    status === DRAFT_TRUTH_STATUS.draft ||
    status === DRAFT_TRUTH_STATUS.approved
  ) {
    return true;
  }
  const customAccept = process.env.BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS?.trim();
  return Boolean(customAccept && status === customAccept);
}

/** Refuse promote/quarantine when the draft is the wrong brain or already terminal. */
export function assertDraftEligibleForPromote(input: {
  draftRecordId: string;
  brainSlug: string;
  fields: Record<string, unknown>;
}): { title: string; canonicalText: string } {
  const recordBrain = String(input.fields["Brain Slug"] ?? "").trim();
  if (recordBrain !== input.brainSlug.trim()) {
    throw new Error("Brain does not match this draft.");
  }
  const status = String(input.fields.Status ?? "").trim();
  if (!isPromoteEligibleStatus(status)) {
    throw new Error(
      `Draft ${input.draftRecordId} is not eligible to promote (current status: ${status || "empty"}).`,
    );
  }
  const title = String(input.fields.Title ?? "").trim();
  const canonicalText = String(
    input.fields[DRAFT_TRUTH_FIELD_NAMES.canonicalTextForAgents] ?? "",
  ).trim();
  if (!title || !canonicalText) {
    throw new Error("Draft is missing Title or Canonical Text for Agents.");
  }
  return { title, canonicalText };
}

export async function createDraftTruth(input: {
  brainSlug: string;
  title: string;
  canonicalText: string;
  /** Plain register of the same claim. Derived from canonicalText when omitted. */
  canonicalTextForHumans?: string;
  proposedCategory: string;
  recordType?: string;
  horizon?: string;
  captureSource?: DraftTruthCaptureSource;
  proposedByAgent?: string;
  supersedesTrustedTruthId?: string;
  sourceDocumentRecordIds?: string[];
  contextAmendmentVersionRecordIds?: string[];
  /** Live Projects record IDs from the HEAD brief only. Blank is legal. */
  relatedProjectRecordIds?: string[];
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  const title = input.title.trim();
  const canonicalText = input.canonicalText.trim();
  if (!title || !canonicalText) throw new Error("title and canonicalText are required.");

  if (useMemoryStore() || !getWorkshopBaseId() || !writeToken()) {
    const recordId = nextMemoryId("mem_draft");
    memoryDrafts.push({
      recordId,
      title,
      canonicalText,
      canonicalTextForHumans:
        input.canonicalTextForHumans?.trim() || deriveHumanText(canonicalText),
      brainSlug: input.brainSlug,
      status: "Draft",
      supersedesTrustedTruthId: input.supersedesTrustedTruthId,
    });
    return { recordId, destination: "workshop-draft-truth", mode: "memory" };
  }

  const token = writeToken()!;
  const brainRegistryRecordId = await resolveBrainRegistryRecordId(
    getWorkshopBaseId()!,
    token,
    input.brainSlug,
  );
  if (!brainRegistryRecordId) {
    throw new Error(
      `No Workshop Brain Registry row for brain slug "${input.brainSlug}". A slug alone is not a destination.`,
    );
  }
  const fields = buildDraftTruthCreateFields({
    title,
    canonicalTextForAgents: canonicalText,
    canonicalTextForHumans: input.canonicalTextForHumans,
    brainSlug: input.brainSlug,
    brainRegistryRecordId,
    proposedCategory: input.proposedCategory,
    recordType: input.recordType ?? "Truth Claim",
    horizon: input.horizon,
    captureSource: input.captureSource ?? DRAFT_TRUTH_CAPTURE_SOURCE.chatSession,
    proposedByAgent: input.proposedByAgent ?? "Clive",
    createdBy: normalizeCreatedBy(input.actor),
    supersedesTrustedTruthId: input.supersedesTrustedTruthId,
    sourceDocumentRecordIds: input.sourceDocumentRecordIds,
    contextAmendmentVersionRecordIds: input.contextAmendmentVersionRecordIds,
    relatedProjectRecordIds: input.relatedProjectRecordIds,
  });

  const created = await airtableCreate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.draftBrainTruth,
    token,
    fields,
  );

  return { recordId: created.id, destination: "workshop-draft-truth", mode: "airtable" };
}

/**
 * Memory/demo promote only. Live Trusted Brain writes must go through
 * `handleDocPromote` (approval decision + authenticated Doc promote route).
 * The curation confirm shortcut used to call this against Airtable whenever
 * workshop/doc tokens were set — an unauthenticated POST could write Trusted
 * truth and quarantine drafts.
 */
export async function promoteDraftToTrustedDemo(input: {
  brainSlug: string;
  draftRecordId: string;
  category: string;
  scope: string;
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  const scope = input.scope.trim();
  if (!TRUSTED_SCOPE_PATTERN.test(scope)) {
    throw new Error(`Invalid trusted scope: ${scope}`);
  }

  if (!(useMemoryStore() || !getWorkshopBaseId() || !writeToken())) {
    throw new Error(
      "Live Trusted Brain promote requires Doc promote with an approval decision.",
    );
  }

  const draft = memoryDrafts.find((row) => row.recordId === input.draftRecordId);
  if (!draft) throw new Error(`Draft record not found: ${input.draftRecordId}`);
  assertDraftEligibleForPromote({
    draftRecordId: input.draftRecordId,
    brainSlug: input.brainSlug,
    fields: {
      Title: draft.title,
      [DRAFT_TRUTH_FIELD_NAMES.canonicalTextForAgents]: draft.canonicalText,
      "Brain Slug": draft.brainSlug,
      Status: draft.status,
    },
  });
  const recordId = nextMemoryId("mem_trusted");
  memoryTrusted.push({
    recordId,
    title: draft.title,
    canonicalText: draft.canonicalText,
  });
  draft.status = "Quarantined";
  return { recordId, destination: "trusted-brain-truth", mode: "memory" };
}

export async function flagInteraction(input: {
  recordId: string;
  source: InteractionRecordSource;
  brainSlug: string;
  quarantine?: boolean;
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  await handleInteractionAction({
    recordId: input.recordId,
    source: input.source,
    brainSlug: input.brainSlug,
    action: "propose",
    quarantine: input.quarantine,
    actor: input.actor,
  });
  return {
    recordId: input.recordId,
    destination: "workshop-interactions",
    mode: useMemoryStore() ? "memory" : "airtable",
  };
}

export async function markInteractionNoAction(input: {
  recordId: string;
  source: InteractionRecordSource;
  brainSlug: string;
  reason: string;
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  await handleInteractionAction({
    recordId: input.recordId,
    source: input.source,
    brainSlug: input.brainSlug,
    action: "dismiss",
    actor: input.actor,
  });
  return {
    recordId: input.recordId,
    destination: "workshop-interactions",
    mode: useMemoryStore() ? "memory" : "airtable",
  };
}

export async function routeIntakeItem(input: {
  brainSlug: string;
  title: string;
  canonicalText: string;
  target: "source_document" | "draft_truth";
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  if (input.target === "draft_truth") {
    return createDraftTruth({
      brainSlug: input.brainSlug,
      title: input.title,
      canonicalText: input.canonicalText,
      proposedCategory: "Knowledge",
      proposedByAgent: "Clive's Man",
      actor: input.actor,
    });
  }

  if (useMemoryStore() || !getWorkshopBaseId() || !writeToken()) {
    return {
      recordId: nextMemoryId("mem_src"),
      destination: "workshop-source-document",
      mode: "memory",
    };
  }

  const token = writeToken()!;
  const created = await airtableCreate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.sourceDocuments,
    token,
    {
      Title: input.title.trim(),
      "Attachment Summary": input.canonicalText.trim(),
      "Brain Slug": input.brainSlug,
      "Mine Status": "Pending",
      "Proposed By Agent": "Clive's Man",
      "Created By": normalizeCreatedBy(input.actor),
    },
  );

  return { recordId: created.id, destination: "workshop-source-document", mode: "airtable" };
}

export function getMemoryDraftsForTests(): MemoryDraft[] {
  return [...memoryDrafts];
}

export function clearMemoryDraftProposalsForTests(): void {
  memoryDrafts.length = 0;
  memoryTrusted.length = 0;
}

export const DRAFT_TRUTH_FIELD_IDS = BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS;
