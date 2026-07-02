import { handleDemoSeed } from "@/lib/brains/handlers/demo-seed";
import { jsonError, jsonOk } from "@/lib/brains/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brainSlug?: string;
      actor?: string;
      includeDrafts?: boolean;
    };
    const result = await handleDemoSeed(body);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
