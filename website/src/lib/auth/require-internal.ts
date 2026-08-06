import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";


/**
 * Back-of-house gate (IA brief §1, Pam's repair §9): /dispatch, /deploy,
 * /fleet, /command/* require an internal operator role. Public users get a
 * 404 — gated by role, not by obscurity; removing links never removed the
 * surface, this does.
 */
export async function requireInternalOperator(): Promise<void> {
  const session = await auth();
  if (session?.operator?.role !== "internal") notFound();
}
