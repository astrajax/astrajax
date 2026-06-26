import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionListQuery } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query: InteractionListQuery = {
      brainSlug: searchParams.get("brainSlug") ?? "",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    };
    const result = await handleInteractionList(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
