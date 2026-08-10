import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { handleBrainHealthLive } from "@/lib/brains/handlers/brain-health-live";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only when used as a live Trusted Brain lens. Anonymous callers
 * must not pull canonical truth summaries without a Brain Key grant.
 */
export async function GET(request: Request) {
  try {
    await requireOperatorSession();
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const result = await handleBrainHealthLive(brainSlug);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
