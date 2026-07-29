import { getPlatformIdleMinutes } from "./config";
import { listLeaseBlobs, readLease } from "./blob-store";
import { closePlatformSession } from "./session-service";

export async function sweepIdlePlatformSessions(): Promise<{
  scanned: number;
  timedOut: number;
  errors: number;
}> {
  const blobs = await listLeaseBlobs();
  const cutoff = Date.now() - getPlatformIdleMinutes() * 60_000;
  let timedOut = 0;
  let errors = 0;

  for (const blob of blobs) {
    const publicSessionId = blob.pathname.slice(blob.pathname.lastIndexOf("/") + 1, -5);
    const lease = await readLease(publicSessionId);
    if (!lease || lease.state === "closed" || lease.state === "closing") continue;
    if (new Date(lease.lastActivityAt).getTime() > cutoff) continue;
    try {
      const closed = await closePlatformSession(lease.handle, "timed_out");
      if (closed) timedOut += 1;
    } catch (error) {
      errors += 1;
      console.error("Platform session sweeper failed", {
        publicSessionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { scanned: blobs.length, timedOut, errors };
}
