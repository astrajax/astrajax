import { auth } from "@/lib/auth";
import { GrantValidationError } from "@/lib/brains/guards";
import { assertDocPromoteAuthorized } from "@/lib/brains/http";


/**
 * Gate for browser-callable mutations that must not run anonymously once
 * live credentials are present. Signed-in operators pass; otherwise the
 * Doc-promote shared secret (server-to-server) is accepted. In local dev
 * with no promote secret configured, assertDocPromoteAuthorized allows
 * the call through so the demo loop still works offline.
 */
export async function requireOperatorOrDocPromote(
  headerValue: string | null,
): Promise<{ operatorId: string; email: string; role: string } | null> {
  const session = await auth();
  if (session?.operator?.operatorId) {
    return session.operator;
  }
  assertDocPromoteAuthorized(headerValue);
  return null;
}

export function isAuthFailure(error: unknown): boolean {
  return (
    error instanceof GrantValidationError ||
    (error instanceof Error &&
      (error.message.includes("authorization") ||
        error.message.includes("not configured")))
  );
}
