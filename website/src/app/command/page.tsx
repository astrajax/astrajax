import Link from "next/link";

/**
 * Internal command index — the deliberate destination for /command (IA
 * brief §1). Reached only by internal operators; the layout gate 404s
 * everyone else.
 */
export default function CommandIndexPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "3rem 2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Command</h1>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
        <li>
          <Link href="/command/clive">Clive</Link>
        </li>
        <li>
          <Link href="/command/pam">Pam</Link>
        </li>
        <li>
          <Link href="/command/doc">Doc</Link>
        </li>
      </ul>
    </main>
  );
}
