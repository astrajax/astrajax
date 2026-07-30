import { handleReceivingWallRecords } from "@/lib/brains/handlers/receiving-wall-records";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await handleReceivingWallRecords();
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
