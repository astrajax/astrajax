import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { handleDocPromote } from "@/lib/brains/handlers/doc-promote";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { DocPromoteBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo-surface promote. Previously called handleDocPromote with no request
 * auth, so anyone who could hit the route could write Trusted Brain truth
 * whenever BRAIN_DOC_PROMOTE_TOKEN was configured. Gate on operator session
 * (browser) or the Doc-promote header (server callers).
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as DocPromoteBody;
    const result = await handleDocPromote(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
