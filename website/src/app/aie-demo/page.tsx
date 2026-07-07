import { redirect } from "next/navigation";

/**
 * W7 — route consolidation (externally visible, Matthew-gated by merge).
 * /aie-demo rendered the same shell as /chapter-1; two public URLs for one
 * experience. This route now forwards to /chapter-1, preserving query
 * params (book, resume, newBrain). Temporary redirect (307) by design —
 * upgrade to permanentRedirect once confident no external links depend on
 * distinct behaviour.
 */
export default async function AieDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/chapter-1?${qs}` : "/chapter-1");
}
