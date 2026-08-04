/**
 * Operator allow-list. Sign-in is gated from day one: the journey opens to
 * others by adding them here (or, later, to operator records), not by
 * loosening the gate.
 *
 * OPERATOR_ALLOWLIST: comma-separated emails. Unset ⇒ deny all in
 * production, allow any in development (so the local loop works before
 * env is configured).
 */
export function isAllowedOperatorEmail(email: string): boolean {
  const raw = process.env.OPERATOR_ALLOWLIST;
  if (!raw?.trim()) {
    return process.env.NODE_ENV !== "production";
  }
  const allowed = raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
