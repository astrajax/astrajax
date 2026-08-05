import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { handleDemoSeed } from "@/lib/brains/handlers/demo-seed";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demo seed can write live Trusted Brain rows when workshop/doc tokens are
 * set. Require a signed-in operator (or Doc-promote header) so anonymous
 * callers cannot seed production truth.
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as {
      brainSlug?: string;
      actor?: string;
      includeDrafts?: boolean;
    };
    const result = await handleDemoSeed(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
