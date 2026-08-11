import { auth } from "@/lib/auth";
import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { jsonError, jsonOk } from "@/lib/brains/http";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Chapter 1 booth stays reachable anonymously, but live Workshop draft text
 * must not. Unsigned callers get the empty fallback so the client can build
 * session drafts; operators get Airtable Draft rows (including Canonical Text).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug")?.trim() || CHAPTER1_BRAIN_SLUG;
    const session = await auth();
    if (!session?.operator?.operatorId) {
      return jsonOk({
        mode: "fallback" as const,
        drafts: [],
        message:
          "Operator sign-in required to load live Workshop drafts — using session drafts.",
      });
    }
    const result = await handleDraftTruthList(brainSlug);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
