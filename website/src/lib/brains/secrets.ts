/**
 * Secret handling for Brain Key routes.
 * Personas, browser, and persisted logs must never receive credentials or grant secrets.
 */

const TOKEN_PATTERNS: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9._-]{20,}\b/gi,
  /\bpats?[A-Za-z0-9]{20,}\b/gi,
  /\bkey[A-Za-z0-9]{20,}\b/gi,
  /\bBRAIN_[A-Z_]*TOKEN\b/g,
  /\bAIRTABLE_[A-Z_]*TOKEN\b/g,
  /\bapp[A-Za-z0-9]{14,}\b/g,
];

const ENV_KEY_PATTERN = /^(BRAIN_|AIRTABLE_)[A-Z0-9_]+$/;

export function containsSecretMaterial(value: string): boolean {
  if (!value) return false;
  for (const pattern of TOKEN_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) return true;
  }
  return false;
}

export function redactSecrets(value: string): string {
  let out = value;
  for (const pattern of TOKEN_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}

export function sanitizeForClient<T>(payload: T): T {
  return deepSanitize(payload) as T;
}

function deepSanitize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return redactSecrets(value);
  }
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (ENV_KEY_PATTERN.test(key) || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret")) {
        next[key] = "[REDACTED]";
        continue;
      }
      next[key] = deepSanitize(val);
    }
    return next;
  }
  return value;
}

/** Trusted context text is never passed to the log endpoint by construction. */
export function sanitizeInteractionForPersistence(body: {
  userMessage: string;
  assistantReply: string;
  manifest?: { grantId?: string; recordIds?: string[]; hashes?: string[] };
}): {
  userMessage: string;
  assistantReply: string;
  manifest?: { grantId?: string; recordIds?: string[]; hashes?: string[] };
} {
  assertSafeForPersistence(body.userMessage);
  assertSafeForPersistence(body.assistantReply);

  return {
    userMessage: body.userMessage,
    assistantReply: body.assistantReply,
    manifest: body.manifest,
  };
}

export function assertSafeForPersistence(text: string): void {
  if (containsSecretMaterial(text)) {
    throw new Error("Interaction log rejected: payload contains secret-like material.");
  }
}

export function assertNeverExposeToModel(systemOrUserContent: string): void {
  if (containsSecretMaterial(systemOrUserContent)) {
    throw new Error("Model payload rejected: must not include Brain Key or API credentials.");
  }
}
