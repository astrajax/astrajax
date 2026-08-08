import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { handleInteractionList } from "@/lib/brains/handlers/interaction-list";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionListQuery } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. Lists Brain Interactions (and optionally Household Activity)
 * including user messages and assistant replies for the review queue.
 */
export async function GET(request: Request) {
  try {
    await requireOperatorSession();
    const { searchParams } = new URL(request.url);
    const query: InteractionListQuery = {
      brainSlug: searchParams.get("brainSlug") ?? "",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
      shortlist: searchParams.get("shortlist") === "true",
      actionProposed: searchParams.get("actionProposed") === "true",
    };
    const result = await handleInteractionList(query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
