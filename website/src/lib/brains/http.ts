import { GrantValidationError } from "./guards";
import { sanitizeForClient } from "./secrets";

export function jsonOk<T>(payload: T, status = 200): Response {
  return Response.json(sanitizeForClient(payload), { status });
}

export function jsonError(error: unknown, fallbackStatus = 400): Response {
  if (error instanceof GrantValidationError) {
    return Response.json(
      sanitizeForClient({ error: error.message, code: error.code }),
      { status: 403 },
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  const status = message.includes("not configured") ? 503 : fallbackStatus;
  return Response.json(sanitizeForClient({ error: message }), { status });
}

let devAdminAuthWarned = false;

export function verifyBrainKeyAdmin(request: Request): void {
  const secret = process.env.BRAIN_KEY_ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BRAIN_KEY_ADMIN_SECRET is not configured.");
    }
    if (!devAdminAuthWarned) {
      console.warn("Brain Key admin auth disabled — dev only");
      devAdminAuthWarned = true;
    }
    return;
  }
  const header = request.headers.get("x-brain-key-admin");
  if (header !== secret) {
    throw new GrantValidationError("Admin authorization required.", "GRANT_NOT_FOUND");
  }
}

/** Shared promote gate for API routes and server actions. */
export function assertDocPromoteAuthorized(headerValue: string | null): void {
  const secret = process.env.BRAIN_DOC_PROMOTE_TOKEN ?? process.env.BRAIN_KEY_ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BRAIN_DOC_PROMOTE_TOKEN is not configured.");
    }
    return;
  }
  if (headerValue !== secret) {
    throw new GrantValidationError("Doc promote authorization required.", "GRANT_NOT_FOUND");
  }
}

export function verifyDocPromoteAuth(request: Request): void {
  assertDocPromoteAuthorized(request.headers.get("x-brain-doc-promote"));
}
