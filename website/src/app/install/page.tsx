import type { Metadata } from "next";
import { InstallPrompt } from "./install-prompt";

export const metadata: Metadata = {
  title: "Install AstraJax — keep the study on your desk",
  description:
    "Put AstraJax on your machine as an installed app — the painted world in its own frame.",
};

/**
 * /install — App Shells pack D6. Per-platform install instructions in
 * register; the one-tap button appears where the browser offers it
 * (InstallPrompt) and the whole page stays reachable but quiet for
 * ordinary visitors. Copy drafted for Matthew's approval — public-facing
 * words are consciously gated.
 */
export default function InstallPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <article style={{ maxWidth: "34rem", display: "grid", gap: "1.25rem" }}>
        <header style={{ display: "grid", gap: "0.5rem" }}>
          <h1>Keep the study on your desk</h1>
          <p>
            AstraJax installs as its own app — no browser furniture, just the
            house. Same live site, its own frame, Clive a click away.
          </p>
        </header>

        <InstallPrompt />

        <section style={{ display: "grid", gap: "0.25rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Chrome or Edge (any desktop)</h2>
          <p>
            Look for the install icon at the right-hand end of the address bar
            — one click, and AstraJax joins your dock or taskbar.
          </p>
        </section>

        <section style={{ display: "grid", gap: "0.25rem" }}>
          <h2 style={{ fontSize: "1rem" }}>Safari on Mac</h2>
          <p>
            From the menu bar: <strong>File → Add to Dock…</strong> Safari
            frames the site as its own app.
          </p>
        </section>

        <section style={{ display: "grid", gap: "0.25rem" }}>
          <h2 style={{ fontSize: "1rem" }}>iPhone &amp; iPad</h2>
          <p>
            In Safari, tap <strong>Share</strong>, then{" "}
            <strong>Add to Home Screen</strong>. The study arrives beside your
            other apps.
          </p>
        </section>

        <footer>
          <p>
            Installing changes nothing about your account — the app opens the
            same house, signed in as you.
          </p>
        </footer>
      </article>
    </main>
  );
}
