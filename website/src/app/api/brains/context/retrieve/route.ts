import { handleContextRetrieve } from "@/lib/brains/handlers/context-retrieve";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { ContextRetrieveBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContextRetrieveBody;
    const result = await handleContextRetrieve(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
