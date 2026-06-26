import { handleInteractionScore } from "@/lib/brains/handlers/interaction-score";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionScoreBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InteractionScoreBody;
    const result = await handleInteractionScore(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
