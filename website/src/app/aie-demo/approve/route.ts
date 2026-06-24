import { handleKeyApprove } from "@/lib/brains/handlers/key-approve";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { KeyApproveBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as KeyApproveBody;
    const result = await handleKeyApprove(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
