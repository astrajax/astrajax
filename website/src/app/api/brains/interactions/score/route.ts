import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { handleInteractionScore } from "@/lib/brains/handlers/interaction-score";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionScoreBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Human quality scoring. Live Workshop / Household rows are updated when
 * tokens are configured — require a signed-in operator (or Doc-promote).
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as InteractionScoreBody;
    const result = await handleInteractionScore(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
