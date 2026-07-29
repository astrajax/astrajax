import { NextResponse } from "next/server";
import { assertCronAuthorised } from "@/lib/platform-activity/cron";
import { flushPlatformActivityOutbox } from "@/lib/platform-activity/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertCronAuthorised(request);
    return NextResponse.json(await flushPlatformActivityOutbox());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Activity outbox flush failed." },
      { status: 401 },
    );
  }
}

export const GET = POST;
