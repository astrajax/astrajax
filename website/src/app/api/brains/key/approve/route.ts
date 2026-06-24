import { handleKeyApprove } from "@/lib/brains/handlers/key-approve";
import { jsonError, jsonOk, verifyBrainKeyAdmin } from "@/lib/brains/http";
import type { KeyApproveBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    verifyBrainKeyAdmin(request);
    const body = (await request.json()) as KeyApproveBody;
    const result = await handleKeyApprove(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, error instanceof Error && error.message.includes("Admin") ? 401 : 400);
  }
}
