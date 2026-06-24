import { handleKeyRequest } from "@/lib/brains/handlers/key-request";
import { jsonError, jsonOk } from "@/lib/brains/http";
import { checkBrainKeyRequestRateLimit } from "@/lib/brains/rate-limit";
import type { KeyRequestBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KeyRequestBody;

    const sessionId = body.sessionId?.trim();
    if (sessionId) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        undefined;
      const limit = checkBrainKeyRequestRateLimit({ sessionId, ip });
      if (!limit.allowed) {
        return jsonError(new Error("Too many Brain Key requests. Try again later."), 429);
      }
    }

    const result = await handleKeyRequest(body);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
