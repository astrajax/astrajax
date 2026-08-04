import { requireInternalOperator } from "@/lib/auth/require-internal";
import Link from "next/link";

/**
 * Internal command index — the deliberate destination for /command (IA
 * brief §1). Gated on this page only: /command/clive, /command/doc, and
 * /command/pam are the pre-existing customer-facing Command Centre rooms
 * (the founding-cast portrait wall's doors) and must stay public — they
 * are not the "internal command index" the brief means. A layout gate
 * here would 404 them too, which is exactly the bug this page's history
 * caused (fixed in this same change).
 */
export const dynamic = "force-dynamic";

export default async function CommandIndexPage() {
  await requireInternalOperator();

  return (
    <main style={{ minHeight: "100vh", padding: "3rem 2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Command</h1>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        <li>
          <Link href="/dispatch">Dispatch</Link>
        </li>
        <li>
          <Link href="/deploy">Deploy</Link>
        </li>
        <li>
          <Link href="/fleet">Fleet</Link>
        </li>
      </ul>
    </main>
  );
}
