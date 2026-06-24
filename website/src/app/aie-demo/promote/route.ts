import { handleDocPromote } from "@/lib/brains/handlers/doc-promote";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { DocPromoteBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DocPromoteBody;
    const result = await handleDocPromote(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
