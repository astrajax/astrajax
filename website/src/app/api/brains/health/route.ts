import { handleBrainHealthLive } from "@/lib/brains/handlers/brain-health-live";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brainSlug = searchParams.get("brainSlug") ?? "astrajax-chapter-1";
    const result = await handleBrainHealthLive(brainSlug);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
