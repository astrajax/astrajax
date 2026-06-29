import { handleSourceDocumentMine } from "@/lib/brains/handlers/source-document-mine";
import { jsonError, jsonOk } from "@/lib/brains/http";
import type { SourceDocumentMineBody } from "@/lib/brains/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SourceDocumentMineBody;
    const result = await handleSourceDocumentMine(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
