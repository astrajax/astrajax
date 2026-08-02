import { handleReceivingWallAccept } from "@/lib/brains/handlers/receiving-wall-accept";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      recordId?: string;
      actor?: string;
    };
    if (!body.recordId?.trim()) {
      throw new Error("recordId is required.");
    }
    const result = await handleReceivingWallAccept({
      recordId: body.recordId,
      actor: body.actor,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
