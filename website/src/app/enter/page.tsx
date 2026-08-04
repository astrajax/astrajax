import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveEnterDestination } from "@/lib/platform/enter-routing";
import { getOperatorStore } from "@/lib/platform/operator-store/get-store";

export const dynamic = "force-dynamic";

/**
 * `/enter` — the ONLY state-aware entrance (IA brief §1–§2). Sign-in,
 * installed shells, “continue” links, and authenticated CTAs land here.
 * `/` never performs this logic. All routing decisions come from the
 * server session and the server-side operator state — never from device
 * storage.
 */
export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  const identity = session?.operator
    ? { operatorId: session.operator.operatorId, email: session.operator.email }
    : null;

  // Verified but session lacks operator claims (e.g. state lookup failed
  // during session callback) → treat as no loaded state, which routes to
  // recovery, not a guess.
  const state = identity
    ? ((await getOperatorStore().getById(identity.operatorId)) ?? null)
    : null;

  const destination = resolveEnterDestination({
    identity,
    state,
    showroomRequested: params.mode === "showroom",
  });

  // Case 1 lands on `/` exactly as the contract states — the marketing
  // entrance carries the sign-in CTA; /enter never invents a destination.
  redirect(destination.path);
}
