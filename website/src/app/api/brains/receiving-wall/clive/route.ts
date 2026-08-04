import {
  handleReceivingWallClive,
  sanitiseReceivingWallCliveHistory,
  type ReceivingWallCliveRequest,
} from "@/lib/brains/handlers/receiving-wall-clive";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      message?: string;
      history?: unknown;
      focusedRecord?: unknown;
      records?: unknown;
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
      actor: body.actor,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
