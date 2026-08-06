import { requireOperatorOrDocPromote, isAuthFailure } from "@/lib/auth/require-operator";
import { handleSourceDocumentMine } from "@/lib/brains/handlers/source-document-mine";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { SourceDocumentMineBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mines Workshop source documents into Draft Truth rows. Live writes require
 * an operator session or Doc-promote header.
 */
export async function POST(request: Request) {
  try {
    await requireOperatorOrDocPromote(request.headers.get("x-brain-doc-promote"));
    const body = (await request.json()) as SourceDocumentMineBody;
    const result = await handleSourceDocumentMine(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, isAuthFailure(error) ? 401 : 400);
  }
}
