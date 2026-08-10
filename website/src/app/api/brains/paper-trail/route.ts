import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { handlePaperTrailList } from "@/lib/brains/handlers/paper-trail-list";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. Returns Registry change-log entries (paper trail) and must
 * not be readable anonymously when the Registry token is wired.
 */
export async function GET(request: Request) {
  try {
    await requireOperatorSession();
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const result = await handlePaperTrailList({ brainSlug, limit });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
