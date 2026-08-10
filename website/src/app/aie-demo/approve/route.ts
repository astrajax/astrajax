import { handleKeyApprove } from "@/lib/brains/handlers/key-approve";
import { useMemoryStore } from "@/lib/brains/config";
import { jsonError, jsonOk, verifyBrainKeyAdmin } from "@/lib/brains/http";
import type { KeyApproveBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo-surface Brain Key approve. The Chapter 1 booth calls this so a visitor
 * can play the human-gate step. That is safe only while grants live in the
 * in-memory store. When the Registry is wired (live tokens, memory off), this
 * route used to mint real Access Grants with no auth — anyone who requested a
 * key could approve it and then read Trusted Brain via /truth/retrieve.
 *
 * Gate: memory/demo stays open for the booth; live Registry requires the same
 * admin secret as /api/brains/key/approve.
 */
export async function POST(request: Request) {
  try {
    if (!useMemoryStore()) {
      verifyBrainKeyAdmin(request);
    }
    const body = (await request.json()) as KeyApproveBody;
    const result = await handleKeyApprove(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error,
      error instanceof Error &&
        (error.message.includes("Admin") || error.message.includes("authorization"))
        ? 401
        : 400,
    );
  }
}
