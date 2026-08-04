import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The House — canonical hub route (IA brief §4). This is the Phase 1
 * fitted-room placeholder: lit, honest, quietly unfinished. Phase 3
 * replaces it with the room-registry collage (Kate's lane); the route
 * itself is canonical from day one so /enter has a stable destination.
 */
export default async function HousePage() {
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
      <section style={{ maxWidth: "28rem", textAlign: "center" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>The House</h1>
        <p>
          Your rooms are being fitted. The collage arrives with the next
          stage of works — everything you&rsquo;ve configured is safe.
        </p>
      </section>
    </main>
  );
}
