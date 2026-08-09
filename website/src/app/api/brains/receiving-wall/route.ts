import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import { handleReceivingWallRecords } from "@/lib/brains/handlers/receiving-wall-records";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. The Receiving Wall returns live Workshop draft records
 * (including full canonical text) and must not be readable anonymously.
 */
export async function GET() {
  try {
    await requireOperatorSession();
    const result = await handleReceivingWallRecords();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
