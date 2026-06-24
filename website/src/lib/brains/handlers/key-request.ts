import {
  assertPersonaMayRequestKey,
  validatePersona,
} from "../guards";
import {
  createKeyRequest,
} from "../grants-store";
import type { KeyRequestBody } from "../types";

export async function handleKeyRequest(body: KeyRequestBody) {
  validatePersona(body.persona);
  assertPersonaMayRequestKey(body.persona);

  if (!body.brainSlug?.trim()) throw new Error("brainSlug is required.");
  if (!body.sessionId?.trim()) throw new Error("sessionId is required.");
  if (!body.purpose?.trim()) throw new Error("purpose is required.");
  if (!body.scope?.trim()) throw new Error("scope is required.");
  if (!body.reason?.trim()) throw new Error("reason is required.");

  const request = await createKeyRequest({
    brainSlug: body.brainSlug.trim(),
    persona: body.persona,
    purpose: body.purpose.trim(),
    scope: body.scope.trim(),
    reason: body.reason.trim(),
    sessionId: body.sessionId.trim(),
    requestedExpiryMinutes: body.requestedExpiryMinutes,
  });

  return {
    requestId: request.requestId,
    status: request.status,
    requiresHumanApproval: true,
    expiresAt: request.expiresAt,
  };
}
