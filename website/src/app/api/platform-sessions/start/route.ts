import { NextResponse } from "next/server";
import { startPlatformSession } from "@/lib/platform-activity/session-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      pageUrl?: unknown;
      parentSessionId?: unknown;
    };
    const result = await startPlatformSession({
      pageUrl: typeof body.pageUrl === "string" ? body.pageUrl : undefined,
      parentSessionId:
        typeof body.parentSessionId === "string" ? body.parentSessionId : undefined,
    });
    return NextResponse.json(result, { status: result.enabled ? 201 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start platform session." },
      { status: 503 },
    );
  }
}
