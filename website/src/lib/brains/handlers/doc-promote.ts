import {
  assertApprovalDecisionPresent,
  assertRouteMayPromote,
  ROUTE_IDS,
} from "../guards";
import { appendChangeLog } from "../change-log";
import { revokeGrantsForBrain } from "../grants-store";
import {
  getDocPromoteToken,
  getWorkshopBaseId,
} from "../config";
import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { airtableCreate, airtableFindOne, airtableUpdate } from "../airtable-rest";
import { assertDraftEligibleForPromote } from "./draft-propose";
import type { DocPromoteBody, DocPromoteItem } from "../types";

const memoryPromotions: DocPromoteBody[] = [];

const TRUSTED_SCOPE_PATTERN = /^read:brain-truth:[a-z0-9-]+$/;

function assertPromotionItem(item: DocPromoteItem): void {
  if (!item.draftRecordId?.trim()) {
    throw new Error("Each promotion must include draftRecordId.");
  }
  if (!item.category?.trim()) {
    throw new Error("Each promotion must include category (Trusted-only — set at promote).");
  }
  const scope = item.scope?.trim();
  if (!scope) {
    throw new Error("Each promotion must include scope (Trusted-only — set at promote).");
  }
  if (!TRUSTED_SCOPE_PATTERN.test(scope)) {
    throw new Error(`Invalid trusted scope: ${scope}`);
  }
}

export async function handleDocPromote(body: DocPromoteBody) {
  assertRouteMayPromote(ROUTE_IDS.DOC_PROMOTE);
  assertApprovalDecisionPresent(body.approvalDecisionId);

  if (!body.brainSlug?.trim()) throw new Error("brainSlug is required.");
  if (!body.approver?.trim()) throw new Error("approver is required.");
  if (!body.reason?.trim()) throw new Error("reason is required.");
  if (!Array.isArray(body.promotions) || body.promotions.length === 0) {
    throw new Error("promotions must contain at least one item.");
  }

  for (const item of body.promotions) {
    assertPromotionItem(item);
  }

  const docToken = getDocPromoteToken();
  if (!docToken) {
    memoryPromotions.push(body);
    const revoked = await revokeGrantsForBrain(body.brainSlug.trim());
    return {
      status: "promoted" as const,
      mode: "memory" as const,
      promotedRecordIds: body.promotions.map((item) => item.draftRecordId),
      revokedGrants: revoked,
      approvalDecisionId: body.approvalDecisionId,
    };
  }

  const workshopBaseId = getWorkshopBaseId();
  if (!workshopBaseId) {
    throw new Error("Workshop base is not configured.");
  }

  const trustedBaseId = process.env.BRAIN_TRUSTED_BASE_ID ?? BRAIN_TRUSTED_CHAPTER1_BASE_ID;
  const trustedTableId =
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID ??
    process.env.BRAIN_TRUSTED_CONTEXT_TABLE_ID ??
    BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth;

  const promotedRecordIds: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const brainSlug = body.brainSlug.trim();

  for (const { draftRecordId, category, scope } of body.promotions) {
    const draft = await airtableFindOne(
      workshopBaseId,
      BRAIN_WORKSHOP_TABLES.draftBrainTruth,
      docToken,
      `RECORD_ID()='${draftRecordId.replace(/'/g, "\\'")}'`,
    );

    if (!draft) {
      throw new Error(`Draft record not found: ${draftRecordId}`);
    }

    const { title, canonicalText } = assertDraftEligibleForPromote({
      draftRecordId,
      brainSlug,
      fields: draft.fields,
    });

    const authority = body.approver.trim();

    const trusted = await airtableCreate(trustedBaseId, trustedTableId, docToken, {
      Title: title,
      "Canonical Text": canonicalText,
      Category: category.trim(),
      Scope: scope.trim(),
      Authority: authority,
      Freshness: "Current",
      "Last Reviewed": today,
    });

    promotedRecordIds.push(trusted.id);

    await airtableUpdate(
      workshopBaseId,
      BRAIN_WORKSHOP_TABLES.draftBrainTruth,
      docToken,
      draftRecordId,
      { Status: "Quarantined" },
    );
  }

  await appendChangeLog({
    changeSummary: `Promoted ${promotedRecordIds.length} draft(s) to Trusted Brain`,
    changeType: "Truth Promote",
    changedBy: body.approver.trim(),
    approvedBy: body.approver.trim(),
    executingAgent: "Doc",
    reason: body.reason.trim(),
    affectedRecords: promotedRecordIds.join(", "),
    source: "Brain Key API",
  });

  const revoked = await revokeGrantsForBrain(body.brainSlug.trim());

  return {
    status: "promoted" as const,
    mode: "airtable" as const,
    promotedRecordIds,
    revokedGrants: revoked,
    approvalDecisionId: body.approvalDecisionId,
  };
}

export function getMemoryPromotionsForTests(): DocPromoteBody[] {
  return [...memoryPromotions];
}

export function clearMemoryPromotionsForTests(): void {
  memoryPromotions.length = 0;
}
