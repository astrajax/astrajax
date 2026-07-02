import { loadCurationDocket } from "@/lib/curation/knowledge";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const docket = await loadCurationDocket(brainSlug);
    return jsonOk(docket);
  } catch (error) {
    return jsonError(error);
  }
}
