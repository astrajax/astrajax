import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Hierarchy case 5 — missing or contradictory operator state. An explicit
 * choice, never a confident guess (IA brief §2). Copy register: honest,
 * calm, no blame. Visual finish is Kate's lane later.
 */
export default async function RecoverPage() {
  const session = await auth();
  if (!session?.operator) redirect("/");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section style={{ maxWidth: "28rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Let&rsquo;s get you back on track</h1>
        <p style={{ marginBottom: "1.5rem" }}>
          We couldn&rsquo;t work out exactly where you left off, and we&rsquo;d
          rather ask than guess. Where would you like to go?
        </p>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
          <li>
            <Link href="/chapter-1">Restart the journey from Chapter 1</Link>
          </li>
          <li>
            <Link href="/enter?mode=showroom">Look around the showroom instead</Link>
          </li>
          <li>
            <Link href="/">Back to the front of house</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
