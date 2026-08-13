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
  useMemoryStore,
} from "../config";
import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  BRAIN_WORKSHOP_TABLES,
  DRAFT_TRUTH_STATUS,
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
    // Auth may accept BRAIN_KEY_ADMIN_SECRET as a promote header fallback, but
    // that secret is not an Airtable PAT. Only the explicit memory store may
    // pretend a promote succeeded without writing Trusted rows.
    if (!useMemoryStore()) {
      throw new Error("BRAIN_DOC_PROMOTE_TOKEN is not configured.");
    }
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
    const priorStatus = String(draft.fields.Status ?? "").trim();

    // Quarantine before Trusted create. Create-then-quarantine left a
    // promote-eligible draft when the update failed after create succeeded;
    // retries then duplicated Trusted rows.
    await airtableUpdate(
      workshopBaseId,
      BRAIN_WORKSHOP_TABLES.draftBrainTruth,
      docToken,
      draftRecordId,
      { Status: DRAFT_TRUTH_STATUS.quarantined },
    );

    let trusted;
    try {
      trusted = await airtableCreate(trustedBaseId, trustedTableId, docToken, {
        Title: title,
        "Canonical Text": canonicalText,
        Category: category.trim(),
        Scope: scope.trim(),
        Authority: authority,
        Freshness: "Current",
        "Last Reviewed": today,
      });
    } catch (error) {
      try {
        await airtableUpdate(
          workshopBaseId,
          BRAIN_WORKSHOP_TABLES.draftBrainTruth,
          docToken,
          draftRecordId,
          { Status: priorStatus },
        );
      } catch {
        // Prefer the create failure; draft may need a manual status restore.
      }
      throw error;
    }

    promotedRecordIds.push(trusted.id);
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
