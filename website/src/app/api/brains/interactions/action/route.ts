import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { handleInteractionAction } from "@/lib/brains/handlers/interaction-action";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionActionBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Review-queue propose/dismiss. With Workshop or Household review tokens set,
 * this mutates live review status — gate on operator session or Doc-promote.
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as InteractionActionBody;
    const result = await handleInteractionAction(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
