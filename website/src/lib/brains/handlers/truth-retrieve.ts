import { GrantValidationError, assertRouteMayReadTrusted, validateGrant, ROUTE_IDS } from "../guards";
import { getTrustedBrainConfig, getTrustedReadToken } from "../config";
import { consumeGrantUse, getGrant, restoreGrantUse } from "../grants-store";
import { isFallbackManifest } from "../interaction-upkeep";
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

  const recordIds = snippets.map((s) => s.recordId);
  // When Trusted is unwired (no read token), public placeholders are the demo
  // path. When a read token is configured and we still only got placeholders,
  // the scope was empty or unreadable — restore the use rather than pretend
  // the caller received Trusted Brain access.
  const trustedConfig = getTrustedBrainConfig(body.brainSlug.trim());
  const trustedReadWired = Boolean(
    trustedConfig?.truthTableId && getTrustedReadToken(trustedConfig),
  );
  if (trustedReadWired && isFallbackManifest(recordIds)) {
    await restoreGrantUse(grant.grantId);
    throw new Error("No Trusted Brain truth is available for this scope.");
  }

  const retrievedAt = new Date().toISOString();

  const manifest: RetrievalManifest = {
    recordIds,
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
