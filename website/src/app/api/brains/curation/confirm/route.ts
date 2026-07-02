import { executeCurationProposal } from "@/lib/brains/handlers/curation-confirm";
import type { CurationProposal } from "@/lib/curation/types";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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
    return jsonError(error);
  }
}
