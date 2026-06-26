import { handleInteractionAction } from "@/lib/brains/handlers/interaction-action";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { InteractionActionBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InteractionActionBody;
    const result = await handleInteractionAction(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
