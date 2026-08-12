import { requireOperatorSession, isAuthFailure } from "@/lib/auth/require-operator";
import {
  handleReceivingWallClive,
  sanitiseReceivingWallCliveHistory,
  type ReceivingWallCliveRequest,
} from "@/lib/brains/handlers/receiving-wall-clive";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operator-only. Sibling of GET /api/brains/receiving-wall — the wall UI is
 * signed-in, and this endpoint can write Workshop interaction logs and spend
 * Anthropic when live credentials are present.
 */
export async function POST(request: Request) {
  try {
    await requireOperatorSession();
    const body = (await request.json()) as {
      sessionId?: string;
      message?: string;
      history?: unknown;
      focusedRecord?: unknown;
      records?: unknown;
      bayCategory?: string | null;
      actor?: string;
    };

    const result = await handleReceivingWallClive({
      sessionId: body.sessionId ?? `rw_${Date.now()}`,
      message: body.message ?? "",
      history: sanitiseReceivingWallCliveHistory(body.history),
      focusedRecord:
        body.focusedRecord === null || body.focusedRecord === undefined
          ? null
          : (body.focusedRecord as ReceivingWallCliveRequest["focusedRecord"]),
      records: Array.isArray(body.records) ? body.records : [],
      bayCategory: body.bayCategory ?? null,
      actor: body.actor,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
