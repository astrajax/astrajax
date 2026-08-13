import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { handleReceivingWallPortals } from "@/lib/brains/handlers/receiving-wall-records";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. One read fills all three portals on the Receiving Wall:
 * judgement (pending drafts, held work, this morning's proposals), health
 * (the brain shelf), and reports (written write-ups).
 *
 * Returns live Workshop draft records including full canonical text, so it
 * must not be readable anonymously. Every bay degrades to a labelled seed
 * rather than blank when a credential cannot read its table.
 */
export async function GET() {
  try {
    await requireOperatorSession();
    const result = await handleReceivingWallPortals();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
