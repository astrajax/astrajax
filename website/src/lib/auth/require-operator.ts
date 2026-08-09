import { auth } from "./index";
import { GrantValidationError } from "@/lib/brains/guards";
import { assertDocPromoteAuthorized } from "@/lib/brains/http";

export type OperatorIdentity = {
  operatorId: string;
  email: string;
  role: string;
};

/**
 * Gate for browser-callable mutations that must not run anonymously once
 * live credentials are present. Signed-in operators pass; otherwise the
 * Doc-promote shared secret (server-to-server) is accepted. In local dev
 * with no promote secret configured, assertDocPromoteAuthorized allows
 * the call through so the demo loop still works offline.
 */
export async function requireOperatorOrDocPromote(
  headerValue: string | null,
): Promise<OperatorIdentity | null> {
  const session = await auth();
  if (session?.operator?.operatorId) {
    return session.operator;
  }
  assertDocPromoteAuthorized(headerValue);
  return null;
}

/**
 * Strict operator session gate for browser-callable Trusted Brain *reads*
 * that must not bypass Brain Key. Unlike requireOperatorOrDocPromote, there
 * is no shared-secret fallback — these surfaces are operator UI only.
 */
export async function requireOperatorSession(): Promise<OperatorIdentity> {
  const session = await auth();
  if (session?.operator?.operatorId) {
    return session.operator;
  }
  throw new GrantValidationError("Operator sign-in required.", "GRANT_NOT_FOUND");
}

export function isAuthFailure(error: unknown): boolean {
  return (
    error instanceof GrantValidationError ||
    (error instanceof Error &&
      (error.message.includes("authorization") ||
        error.message.includes("not configured")))
  );
}
