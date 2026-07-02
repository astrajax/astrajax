import { appendChangeLog } from "../change-log";
import { airtableCreate, airtableFindOne, airtableUpdate } from "../airtable-rest";
import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import {
  getDocPromoteToken,
  getWorkshopBaseId,
  getWorkshopWriteToken,
  useMemoryStore,
} from "../config";
import type { ContextDestination } from "@/lib/curation/destinations";

const TRUSTED_SCOPE_PATTERN = /^read:brain-truth:[a-z0-9-]+$/;

type MemoryDraft = {
  recordId: string;
  title: string;
  canonicalText: string;
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

export async function createDraftTruth(input: {
  brainSlug: string;
  title: string;
  canonicalText: string;
  proposedCategory: string;
  proposedByAgent?: string;
  supersedesTrustedTruthId?: string;
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
      brainSlug: input.brainSlug,
      status: "Draft",
      supersedesTrustedTruthId: input.supersedesTrustedTruthId,
    });
    return { recordId, destination: "workshop-draft-truth", mode: "memory" };
  }

  const token = writeToken()!;
  const fields: Record<string, string> = {
    Title: title,
    "Canonical Text": canonicalText,
    "Brain Slug": input.brainSlug,
    Status: "Draft",
    "Proposed Category": input.proposedCategory,
    "Proposed By Agent": input.proposedByAgent ?? "Clive",
    "Created By": input.actor ?? "Architect",
  };
  if (input.supersedesTrustedTruthId) {
    fields["Supersedes Trusted Truth ID"] = input.supersedesTrustedTruthId;
  }

  const created = await airtableCreate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.draftBrainTruth,
    token,
    fields,
  );

  return { recordId: created.id, destination: "workshop-draft-truth", mode: "airtable" };
}

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

  if (useMemoryStore() || !getWorkshopBaseId() || !writeToken()) {
    const draft =
      memoryDrafts.find((row) => row.recordId === input.draftRecordId) ??
      ({
        recordId: input.draftRecordId,
        title: "Demo truth",
        canonicalText: "Demo promoted truth.",
        brainSlug: input.brainSlug,
        status: "Draft",
      } satisfies MemoryDraft);
    const recordId = nextMemoryId("mem_trusted");
    memoryTrusted.push({
      recordId,
      title: draft.title,
      canonicalText: draft.canonicalText,
    });
    return { recordId, destination: "trusted-brain-truth", mode: "memory" };
  }

  const token = writeToken()!;
  const draft = await airtableFindOne(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.draftBrainTruth,
    token,
    `RECORD_ID()='${input.draftRecordId}'`,
  );
  if (!draft) throw new Error(`Draft record not found: ${input.draftRecordId}`);

  const title = String(draft.fields.Title ?? "");
  const canonicalText = String(draft.fields["Canonical Text"] ?? "");
  if (!title || !canonicalText) {
    throw new Error("Draft is missing Title or Canonical Text.");
  }

  const trustedBaseId = process.env.BRAIN_TRUSTED_BASE_ID ?? BRAIN_TRUSTED_CHAPTER1_BASE_ID;
  const trustedTableId =
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID ?? BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth;
  const today = new Date().toISOString().slice(0, 10);

  const trusted = await airtableCreate(trustedBaseId, trustedTableId, token, {
    Title: title,
    "Canonical Text": canonicalText,
    Category: input.category.trim(),
    Scope: scope,
    Authority: input.actor ?? "Architect",
    Freshness: "Current",
    "Last Reviewed": today,
  });

  await airtableUpdate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.draftBrainTruth,
    token,
    input.draftRecordId,
    { Status: "Quarantined" },
  );

  try {
    await appendChangeLog({
      changeSummary: `Demo promote: ${title}`,
      changeType: "Truth Promote",
      changedBy: input.actor ?? "Architect",
      approvedBy: input.actor ?? "Architect",
      executingAgent: "Clive",
      reason: "Demo curation sitting — direct promote",
      affectedRecords: trusted.id,
      source: "Curation API",
    });
  } catch {
    /* non-blocking */
  }

  return { recordId: trusted.id, destination: "trusted-brain-truth", mode: "airtable" };
}

export async function flagInteraction(input: {
  recordId: string;
  brainSlug: string;
  quarantine?: boolean;
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  if (useMemoryStore() || !getWorkshopBaseId() || !getWorkshopWriteToken()) {
    return { recordId: input.recordId, destination: "workshop-interactions", mode: "memory" };
  }

  const token = getWorkshopWriteToken()!;
  await airtableUpdate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.brainInteractions,
    token,
    input.recordId,
    {
      "Review Status": BRAIN_INTERACTION_REVIEW_STATUS.actionProposed,
      "Context Flagged": input.quarantine
        ? BRAIN_INTERACTION_CONTEXT_FLAGGED.quarantineProposed
        : BRAIN_INTERACTION_CONTEXT_FLAGGED.flaggedForReview,
      Reviewer: input.actor ?? "Architect",
    },
  );

  return { recordId: input.recordId, destination: "workshop-interactions", mode: "airtable" };
}

export async function markInteractionNoAction(input: {
  recordId: string;
  reason: string;
  actor?: string;
}): Promise<{ recordId: string; destination: ContextDestination; mode: "airtable" | "memory" }> {
  if (useMemoryStore() || !getWorkshopBaseId() || !getWorkshopWriteToken()) {
    return { recordId: input.recordId, destination: "workshop-interactions", mode: "memory" };
  }

  const token = getWorkshopWriteToken()!;
  await airtableUpdate(
    getWorkshopBaseId()!,
    BRAIN_WORKSHOP_TABLES.brainInteractions,
    token,
    input.recordId,
    {
      "Review Status": BRAIN_INTERACTION_REVIEW_STATUS.noAction,
      "Review Notes": input.reason.trim(),
      Reviewer: input.actor ?? "Architect",
    },
  );

  return { recordId: input.recordId, destination: "workshop-interactions", mode: "airtable" };
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
      "Created By": input.actor ?? "Architect",
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
