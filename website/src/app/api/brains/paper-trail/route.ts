import { handlePaperTrailList } from "@/lib/brains/handlers/paper-trail-list";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const result = await handlePaperTrailList({ brainSlug, limit });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
