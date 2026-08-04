import {
  handleReceivingWallClive,
} from "@/lib/brains/handlers/receiving-wall-clive";
import { jsonError, jsonOk } from "@/lib/brains/http";
import { readOptionalSessionHandle, readTurnId } from "@/lib/platform-activity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: unknown;
      sessionId?: string;
      openRecord?: unknown;
      bayRecords?: unknown;
    };

    const result = await handleReceivingWallClive({
      message: body.message ?? "",
      history: body.history,
      sessionId: body.sessionId,
      openRecord: body.openRecord,
      bayRecords: body.bayRecords,
      platformHandle: readOptionalSessionHandle(request),
      turnId: readTurnId(request),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
