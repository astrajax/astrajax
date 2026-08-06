import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { executeCurationProposal } from "@/lib/brains/handlers/curation-confirm";
import type { CurationProposal } from "@/lib/curation/types";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms a curation tool proposal into Workshop (draft truth, source doc,
 * or interaction review). When workshop/doc tokens are live this writes
 * Airtable — require a signed-in operator (or Doc-promote header).
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as {
      proposal?: CurationProposal;
      actor?: string;
    };
    if (!body.proposal) throw new Error("proposal is required.");
    const result = await executeCurationProposal({
      proposal: body.proposal,
      actor: body.actor,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
