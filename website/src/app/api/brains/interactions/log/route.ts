import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionLogBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InteractionLogBody;
    const result = await handleInteractionLog(body);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
