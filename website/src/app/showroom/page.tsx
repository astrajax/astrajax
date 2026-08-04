/**
 * The Showroom — explicit, clearly-labelled read-only demonstration state
 * (IA brief §6). Phase 5 builds the full seeded demonstration on the
 * /api/brains/demo seam; this Phase 1 placeholder exists so the /enter
 * contract's showroom case has a stable, honest destination. No live
 * credentials, no writes — by construction there is nothing here to write.
 */
export default function ShowroomPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section style={{ maxWidth: "28rem", textAlign: "center" }}>
        <p style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          Demonstration
        </p>
        <h1 style={{ marginBottom: "0.5rem" }}>The Showroom</h1>
        <p>
          A guided look at the complete House on demonstration data is being
          prepared. Nothing here is live, and nothing you do here is saved.
        </p>
      </section>
    </main>
  );
}
