import { handleTruthRetrieve } from "@/lib/brains/handlers/truth-retrieve";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { TruthRetrieveBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TruthRetrieveBody;
    const result = await handleTruthRetrieve(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
