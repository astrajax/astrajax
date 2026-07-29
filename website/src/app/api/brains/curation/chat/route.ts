import { runCurationChat, sanitiseCurationHistory } from "@/lib/curation/orchestrator";
import { jsonError, jsonOk } from "@/lib/brains/http";
import { readOptionalSessionHandle, readTurnId } from "@/lib/platform-activity/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brainSlug?: string;
      sessionId?: string;
      message?: string;
      history?: unknown;
      actor?: string;
    };

    const result = await runCurationChat({
      brainSlug: body.brainSlug ?? "astrajax-chapter-1",
      sessionId: body.sessionId ?? `cur_${Date.now()}`,
      message: body.message ?? "",
      history: sanitiseCurationHistory(body.history),
      actor: body.actor,
      platformHandle: readOptionalSessionHandle(request),
      turnId: readTurnId(request),
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
