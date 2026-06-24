import {
  approveKeyRequest,
  getKeyRequest,
  rejectKeyRequest,
} from "../grants-store";
import type { KeyApproveBody } from "../types";

export async function handleKeyApprove(body: KeyApproveBody) {
  if (!body.requestId?.trim()) throw new Error("requestId is required.");
  if (!body.approver?.trim()) throw new Error("approver is required.");

  if (body.decision === "rejected") {
    const ok = await rejectKeyRequest(body.requestId.trim());
    if (!ok) throw new Error("Request not found or not pending.");
    return { requestId: body.requestId, status: "rejected" as const };
  }

  const grant = await approveKeyRequest({
    requestId: body.requestId.trim(),
    approver: body.approver.trim(),
    grantMaxUses: body.grantMaxUses,
    grantExpiryMinutes: body.grantExpiryMinutes,
  });

  if (!grant) {
    const existing = await getKeyRequest(body.requestId.trim());
    if (!existing) throw new Error("Request not found.");
    throw new Error("Request is not pending approval.");
  }

  return {
    grantId: grant.grantId,
    status: grant.status,
    expiresAt: grant.expiresAt,
    maxUses: grant.maxUses,
    notes: body.notes,
  };
}
