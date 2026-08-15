import { appendChangeLog } from "../change-log";
import {
  APPROVAL_DECISION_VALUE,
  BRAIN_WORKSHOP_APPROVAL_DECISIONS_FIELDS,
  BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS,
  BRAIN_WORKSHOP_TABLES,
  DRAFT_TRUTH_STATUS,
} from "../airtable-ids";
import {
  airtableCreate,
  airtableFindOne,
  airtableUpdate,
  escapeAirtableString,
} from "../airtable-rest";
import {
  getWorkshopBaseId,
  getWorkshopReadToken,
  getWorkshopWriteToken,
} from "../config";
import {
  isReceivingRecordActioned,
  type ReceivingRecord,
} from "@/lib/receiving-wall";
import { mapDraftTruthToReceivingRecord } from "./receiving-wall-records";

const AIRTABLE_RECORD_ID_RE = /^rec[a-zA-Z0-9]{14}$/;

const RECEIVING_WALL_SURFACE = "Receiving Wall";

function acceptStatusValue(): string {
  return (
    process.env.BRAIN_WORKSHOP_RECEIVING_WALL_ACCEPT_STATUS ??
    DRAFT_TRUTH_STATUS.approved
  );
}

function nextApprovalDecisionId(): string {
  return `apd_rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveActor(actor?: string): string {
  const value = actor?.trim();
  return value || "Architect";
}

function userFacingAcceptError(
  cause: unknown,
  stage: "lookup" | "status" | "approval" | "revert",
): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  console.error(`Receiving Wall accept failed during ${stage}:`, detail);

  if (stage === "lookup") {
    if (detail.includes("403")) {
      // getWorkshopReadToken() falls back to WRITE_TOKEN when READ is unset;
      // name the credential that was actually used for the failing request.
      if (process.env.BRAIN_WORKSHOP_READ_TOKEN) {
        return new Error(
          "This record could not be loaded for approval — the Workshop read token on the server may be missing or lack access. Check BRAIN_WORKSHOP_READ_TOKEN in Vercel.",
        );
      }
      return new Error(
        "This record could not be loaded for approval — the Workshop write token lacks permission to read drafts. Check BRAIN_WORKSHOP_WRITE_TOKEN in Vercel.",
      );
    }
    return new Error(
      "This record could not be loaded for approval. Please refresh the wall and try again.",
    );
  }
  if (stage === "status") {
    if (detail.includes("403")) {
      return new Error(
        "This record could not be approved — the Workshop write token lacks permission to update draft status. Check BRAIN_WORKSHOP_WRITE_TOKEN in Vercel.",
      );
    }
    return new Error(
      "This record could not be approved — the draft status could not be updated. Nothing was recorded as approved. Please try again in a moment.",
    );
  }
  if (stage === "revert") {
    return new Error(
      "This record was marked approved but the approval paper trail could not be saved, and we could not undo the status change automatically. Please check the draft in Airtable before trying again.",
    );
  }
  if (detail.includes("403")) {
    return new Error(
      "This record could not be approved — the Workshop write token lacks permission to create Approval Decision rows. Check BRAIN_WORKSHOP_WRITE_TOKEN in Vercel.",
    );
  }
  return new Error(
    "This record could not be approved — the approval paper trail could not be saved. The draft was not changed. Please try again in a moment.",
  );
}

export type ReceivingWallAcceptResult = {
  record: ReceivingRecord;
  approvalDecisionId: string;
  acceptedAt: string;
  surface: typeof RECEIVING_WALL_SURFACE;
};

export async function handleReceivingWallAccept(input: {
  recordId: string;
  actor?: string;
}): Promise<ReceivingWallAcceptResult> {
  const recordId = input.recordId?.trim();
  if (!recordId) {
    throw new Error("recordId is required.");
  }
  if (recordId.startsWith("seed-")) {
    throw new Error(
      "Seeded demo records cannot be accepted — wire live Workshop drafts first.",
    );
  }
  if (!AIRTABLE_RECORD_ID_RE.test(recordId)) {
    throw new Error("Invalid recordId.");
  }

  const baseId = getWorkshopBaseId();
  const writeToken = getWorkshopWriteToken();
  const readToken = getWorkshopReadToken();
  if (!baseId || !writeToken) {
    throw new Error("Workshop write access is not configured on the server.");
  }

  const actor = resolveActor(input.actor);
  const acceptedAt = new Date().toISOString();
  const tableId = BRAIN_WORKSHOP_TABLES.draftBrainTruth;

  let existing;
  try {
    existing = await airtableFindOne(
      baseId,
      tableId,
      readToken ?? writeToken,
      `RECORD_ID()='${escapeAirtableString(recordId)}'`,
    );
  } catch (cause) {
    throw userFacingAcceptError(cause, "lookup");
  }
  if (!existing) {
    throw new Error(`Draft record not found: ${recordId}`);
  }

  const title = String(existing.fields.Title ?? "").trim();
  if (!title) {
    throw new Error("Draft record is missing a Title.");
  }

  const priorStatus = String(
    existing.fields.Status ?? DRAFT_TRUTH_STATUS.draft,
  );
  if (isReceivingRecordActioned(priorStatus)) {
    throw new Error(
      `This record is already ${priorStatus} and cannot be accepted again.`,
    );
  }
  const targetStatus = acceptStatusValue();
  const approvalDecisionId = nextApprovalDecisionId();

  let updated;
  try {
    updated = await airtableUpdate(baseId, tableId, writeToken, recordId, {
      Status: targetStatus,
    });
  } catch (cause) {
    throw userFacingAcceptError(cause, "status");
  }

  try {
    await airtableCreate(
      baseId,
      BRAIN_WORKSHOP_TABLES.approvalDecisions,
      writeToken,
      {
        "Decision ID": approvalDecisionId,
        "Decision Summary": `Accepted draft truth: ${title}`,
        Approver: actor,
        Decision: APPROVAL_DECISION_VALUE.approved,
        "Decision Notes": [
          `Surface: ${RECEIVING_WALL_SURFACE}`,
          `Accepted at: ${acceptedAt}`,
          `Draft record: ${recordId}`,
        ].join("\n"),
        "Send To Doc": false,
      },
    );
  } catch (cause) {
    try {
      await airtableUpdate(baseId, tableId, writeToken, recordId, {
        Status: priorStatus,
      });
    } catch (revertCause) {
      throw userFacingAcceptError(revertCause, "revert");
    }
    throw userFacingAcceptError(cause, "approval");
  }

  try {
    await appendChangeLog({
      changeSummary: `Receiving Wall accept: ${title}`,
      changeType: "Draft Truth Accept",
      changedBy: actor,
      approvedBy: actor,
      executingAgent: "Receiving Wall",
      source: RECEIVING_WALL_SURFACE,
      reason: "Human confirmed draft truth without chat",
      affectedRecords: `${recordId}; ${approvalDecisionId}`,
      notes: `Approval Decision ${approvalDecisionId}`,
    });
  } catch {
    /* Registry change log is best-effort when not wired. */
  }

  // Airtable PATCH responses often return only the fields that changed (Status
  // here). Merge onto the lookup payload so Title / provenance / destination
  // survive — same pattern as interaction-household-review. Mapping Status-only
  // would throw after the draft was already Approved and the paper trail written.
  const record = mapDraftTruthToReceivingRecord({
    id: updated.id,
    fields: { ...existing.fields, ...(updated.fields ?? {}) },
  });
  if (!record) {
    throw new Error("Accepted record could not be mapped for the wall.");
  }

  return {
    record,
    approvalDecisionId,
    acceptedAt,
    surface: RECEIVING_WALL_SURFACE,
  };
}

/** Field IDs used when reading draft rows — exported for tests and wiring docs. */
export const RECEIVING_WALL_ACCEPT_FIELD_IDS = {
  draftStatus: BRAIN_WORKSHOP_DRAFT_TRUTH_FIELDS.status,
  approvalDecisionId: BRAIN_WORKSHOP_APPROVAL_DECISIONS_FIELDS.decisionId,
  approvalApprover: BRAIN_WORKSHOP_APPROVAL_DECISIONS_FIELDS.approver,
  approvalDecision: BRAIN_WORKSHOP_APPROVAL_DECISIONS_FIELDS.decision,
} as const;
