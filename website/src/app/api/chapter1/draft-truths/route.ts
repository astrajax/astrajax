import { handleDraftTruthList } from "@/lib/brains/handlers/draft-truth-list";
import { jsonError, jsonOk } from "@/lib/brains/http";
import { CHAPTER1_BRAIN_SLUG } from "@/lib/brains/airtable-ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug")?.trim() || CHAPTER1_BRAIN_SLUG;
    const result = await handleDraftTruthList(brainSlug);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
