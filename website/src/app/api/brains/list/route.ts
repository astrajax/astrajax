import { handleBrainList } from "@/lib/brains/handlers/brain-list";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await handleBrainList();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
