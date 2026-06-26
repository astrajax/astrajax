import { GrantValidationError, assertRouteMayReadTrusted, validateGrant, ROUTE_IDS } from "../guards";
import { consumeGrantUse, getGrant } from "../grants-store";
import { retrieveTrustedSnippets } from "../trusted-truth";
import type { TruthRetrieveBody, RetrievalManifest } from "../types";

export async function handleTruthRetrieve(body: TruthRetrieveBody) {
  assertRouteMayReadTrusted(ROUTE_IDS.TRUTH_RETRIEVE);

  if (!body.grantId?.trim()) throw new Error("grantId is required.");
  if (!body.sessionId?.trim()) throw new Error("sessionId is required.");
  if (!body.brainSlug?.trim()) throw new Error("brainSlug is required.");
  if (!body.scope?.trim()) throw new Error("scope is required.");

  const grant = await getGrant(body.grantId.trim());
  if (!grant) {
    throw new GrantValidationError("Access grant not found.", "GRANT_NOT_FOUND");
  }

  validateGrant({
    grant,
    sessionId: body.sessionId.trim(),
    persona: body.persona,
    brainSlug: body.brainSlug.trim(),
    scope: body.scope.trim(),
  });

  const snippets = await retrieveTrustedSnippets({
    brainSlug: body.brainSlug.trim(),
    scope: body.scope.trim(),
  });

  const updated = await consumeGrantUse(grant.grantId);
  const retrievedAt = new Date().toISOString();

  const manifest: RetrievalManifest = {
    recordIds: snippets.map((s) => s.recordId),
    hashes: snippets.map((s) => s.contentHash),
    grantId: grant.grantId,
    retrievedAt,
  };

  return {
    snippets,
    manifest,
    remainingUses: updated ? Math.max(0, updated.maxUses - updated.useCount) : 0,
  };
}
