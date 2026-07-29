import { getPlatformCronSecret } from "./config";

export function assertCronAuthorised(request: Request): void {
  const secret = getPlatformCronSecret();
  if (!secret) throw new Error("CRON_SECRET is not configured.");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const header = request.headers.get("x-cron-secret");
  if (bearer !== secret && header !== secret) {
    throw new Error("Unauthorised scheduled worker request.");
  }
}
