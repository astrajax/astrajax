import {
  handleUserBrainSave,
  type UserBrainSaveBody,
} from "@/lib/brains/handlers/user-brain-save";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as UserBrainSaveBody;
    const result = await handleUserBrainSave(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
