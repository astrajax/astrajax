import { GrantValidationError, assertRouteMayReadTrusted, validateGrant, ROUTE_IDS } from "../guards";
import { consumeGrantUse, getGrant, restoreGrantUse } from "../grants-store";
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

  // Consume before returning Trusted text so a concurrent retrieve cannot
  // race past an exhausted one-use grant and still receive snippets.
  const updated = await consumeGrantUse(grant.grantId);
  if (!updated) {
    throw new GrantValidationError("Access grant has no remaining uses.", "GRANT_EXHAUSTED");
  }

  let snippets;
  try {
    snippets = await retrieveTrustedSnippets({
      brainSlug: body.brainSlug.trim(),
      scope: body.scope.trim(),
    });
  } catch (error) {
    // Do not burn a paid use when Trusted fetch fails after consume.
    await restoreGrantUse(grant.grantId);
    throw error;
  }

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
    remainingUses: Math.max(0, updated.maxUses - updated.useCount),
  };
}
