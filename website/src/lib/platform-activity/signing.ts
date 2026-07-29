import { createHmac, timingSafeEqual } from "node:crypto";
import { getPlatformSessionSecret } from "./config";
import type { PlatformSessionHandlePayload } from "./types";

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createPlatformSessionHandle(payload: PlatformSessionHandlePayload): string {
  const secret = getPlatformSessionSecret();
  if (!secret) throw new Error("PLATFORM_SESSION_SECRET is not configured.");
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyPlatformSessionHandle(handle: string): PlatformSessionHandlePayload {
  const secret = getPlatformSessionSecret();
  if (!secret) throw new Error("PLATFORM_SESSION_SECRET is not configured.");

  const [encoded, supplied] = handle.split(".");
  if (!encoded || !supplied) throw new Error("Invalid platform session handle.");

  const expected = sign(encoded, secret);
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (
    expectedBuffer.length !== suppliedBuffer.length ||
    !timingSafeEqual(expectedBuffer, suppliedBuffer)
  ) {
    throw new Error("Invalid platform session handle.");
  }

  const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PlatformSessionHandlePayload;
  if (
    parsed.v !== 1 ||
    !parsed.publicSessionId?.trim() ||
    !/^rec[a-zA-Z0-9]+$/.test(parsed.sessionRecordId ?? "") ||
    !parsed.issuedAt
  ) {
    throw new Error("Invalid platform session handle payload.");
  }
  return parsed;
}

export function readPlatformSessionHandle(request: Request, bodyHandle?: unknown): string {
  const header = request.headers.get("x-platform-session");
  const candidate = header || (typeof bodyHandle === "string" ? bodyHandle : "");
  if (!candidate.trim()) throw new Error("Platform session handle is required.");
  return candidate.trim();
}
