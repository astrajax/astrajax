/**
 * Stateless email one-time codes for operator sign-in.
 *
 * Flow: /api/auth/request-code issues a 6-digit code (delivered by email)
 * and returns a `proof` — an HMAC over (email, code, expiry) signed with
 * AUTH_SECRET. The sign-in form submits email + typed code + proof; the
 * Credentials provider recomputes the HMAC. No server-side token storage,
 * so no Auth.js adapter is needed; forging a proof requires AUTH_SECRET,
 * and the code itself only ever travels in the email.
 *
 * Known trade-off (documented in the build plan): a proof+code pair can be
 * replayed within its validity window. Window is 10 minutes; acceptable
 * for v1 single-household sign-in, revisit alongside multi-tenant work.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const CODE_VALIDITY_MS = 10 * 60 * 1000;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return value;
}

/** Digits only — strips spaces/dashes from pasted or autofilled codes. */
export function normaliseSignInCode(code: string): string {
  return code.replace(/\D/g, "");
}

function sign(email: string, code: string, expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(`${email.trim().toLowerCase()}:${normaliseSignInCode(code)}:${expiresAt}`)
    .digest("hex");
}

export function issueEmailCode(
  email: string,
  now: number = Date.now(),
): { code: string; proof: string } {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = now + CODE_VALIDITY_MS;
  return { code, proof: `${expiresAt}.${sign(email, code, expiresAt)}` };
}

export function verifyEmailCode(input: {
  email: string;
  code: string;
  proof: string;
  now?: number;
}): boolean {
  const code = normaliseSignInCode(input.code);
  if (code.length !== 6) return false;
  // Proof is `${expiresAt}.${mac}` — split on the first dot only.
  const separator = input.proof.indexOf(".");
  if (separator <= 0) return false;
  const expiryRaw = input.proof.slice(0, separator);
  const mac = input.proof.slice(separator + 1);
  const expiresAt = Number.parseInt(expiryRaw, 10);
  if (!mac || !Number.isFinite(expiresAt)) return false;
  if ((input.now ?? Date.now()) > expiresAt) return false;
  const expected = sign(input.email, code, expiresAt);
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
