/**
 * Host rules that separate the public marketing site from the platform.
 *
 * astrajax.com is marketing-only. The platform stays in the repo and remains
 * reachable on localhost and *.vercel.app previews for iteration.
 */

const PUBLIC_MARKETING_HOSTS = new Set(["astrajax.com", "www.astrajax.com"]);

/** Page routes that belong to the platform, not the marketing site. */
export const PLATFORM_PAGE_PREFIXES = [
  "/brain",
  "/command",
  "/agents",
  "/coach",
  "/court",
  "/fleet",
  "/deploy",
  "/dispatch",
  "/adoption",
  "/chapter-1",
  "/aie-demo",
] as const;

/**
 * The only API routes allowed on the public marketing host. Allowlisted rather
 * than denylisted so a newly added platform route is closed by default.
 *
 * - ask-clive / clive-voice: the public Ask Clive panel
 * - platform-sessions / platform-activity: session + turn logging that runs on
 *   marketing pages, plus the cron endpoints (those verify CRON_SECRET themselves)
 */
const PUBLIC_API_PREFIXES = [
  "/api/ask-clive",
  "/api/clive-voice",
  "/api/platform-sessions",
  "/api/platform-activity",
] as const;

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Resolves the request host, preferring the forwarded host so a proxy in front
 * of the deployment cannot slip past the marketing gate.
 */
export function resolveRequestHost(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || headers.get("host") || "";
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function isPublicMarketingHost(host: string): boolean {
  return PUBLIC_MARKETING_HOSTS.has(host);
}

export function isPublicMarketingRequest(headers: Headers): boolean {
  return isPublicMarketingHost(resolveRequestHost(headers));
}

export function isPlatformPagePath(pathname: string): boolean {
  return matchesPrefix(pathname, PLATFORM_PAGE_PREFIXES);
}

export function isPublicApiPath(pathname: string): boolean {
  return matchesPrefix(pathname, PUBLIC_API_PREFIXES);
}
