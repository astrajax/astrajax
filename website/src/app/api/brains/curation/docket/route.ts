import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { loadCurationDocket } from "@/lib/curation/knowledge";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. This docket includes live Trusted Brain canonical text and
 * must not be readable anonymously (that would bypass Brain Key grants).
 */
export async function GET(request: Request) {
  try {
    await requireOperatorSession();
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const docket = await loadCurationDocket(brainSlug);
    return jsonOk(docket);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
