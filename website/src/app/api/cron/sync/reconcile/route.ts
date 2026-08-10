import { NextResponse } from "next/server";
import { assertCronAuthorised } from "@/lib/platform-activity/cron";
import { contextIndexSyncEnabled } from "@/lib/context-index/config";
import { getContextIndexSources } from "@/lib/context-index/sources";
import { runReconcile } from "@/lib/context-index/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    assertCronAuthorised(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorised." },
      { status: 401 },
    );
  }

  if (!contextIndexSyncEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "CONTEXT_INDEX_SYNC_ENABLED is not true.",
    });
  }

  const sources = getContextIndexSources();
  const results: Record<string, unknown> = {};

  for (const source of sources) {
    const key = `${source.clientId}:${source.tableId}`;
    try {
      results[key] = await runReconcile(source);
    } catch (err) {
      results[key] = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json({ mode: "reconcile", results });
}

export const POST = GET;
