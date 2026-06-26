import type { AccessGrant, PersonaId } from "./types";

export const ROUTE_IDS = {
  TRUTH_RETRIEVE: "/api/brains/truth/retrieve",
  DOC_PROMOTE: "/api/brains/doc/promote",
  KEY_REQUEST: "/api/brains/key/request",
  KEY_APPROVE: "/api/brains/key/approve",
  INTERACTION_LOG: "/api/brains/interactions/log",
  INTERACTION_LIST: "/api/brains/interactions/list",
  INTERACTION_SCORE: "/api/brains/interactions/score",
} as const;

export type RouteId = (typeof ROUTE_IDS)[keyof typeof ROUTE_IDS];

const TRUSTED_READ_ROUTES = new Set<RouteId>([ROUTE_IDS.TRUTH_RETRIEVE]);
const PROMOTE_ROUTES = new Set<RouteId>([ROUTE_IDS.DOC_PROMOTE]);

const VALID_PERSONAS = new Set<PersonaId>(["clive", "pam", "doc"]);

export class GrantValidationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "GRANT_NOT_FOUND"
      | "GRANT_EXPIRED"
      | "GRANT_REVOKED"
      | "GRANT_EXHAUSTED"
      | "SESSION_MISMATCH"
      | "PERSONA_MISMATCH"
      | "BRAIN_MISMATCH"
      | "SCOPE_MISMATCH",
  ) {
    super(message);
    this.name = "GrantValidationError";
  }
}

export interface GrantValidationInput {
  grant: AccessGrant;
  sessionId: string;
  persona: PersonaId;
  brainSlug: string;
  scope: string;
}

export function validateGrant(input: GrantValidationInput): void {
  const { grant, sessionId, persona, brainSlug, scope } = input;

  if (grant.status === "revoked") {
    throw new GrantValidationError("Access grant has been revoked.", "GRANT_REVOKED");
  }

  if (grant.status === "expired" || new Date(grant.expiresAt) < new Date()) {
    throw new GrantValidationError("Access grant has expired.", "GRANT_EXPIRED");
  }

  if (grant.useCount >= grant.maxUses) {
    throw new GrantValidationError("Access grant has no remaining uses.", "GRANT_EXHAUSTED");
  }

  if (grant.sessionId !== sessionId) {
    throw new GrantValidationError("Session does not match this grant.", "SESSION_MISMATCH");
  }

  if (grant.persona !== persona) {
    throw new GrantValidationError("Persona does not match this grant.", "PERSONA_MISMATCH");
  }

  if (grant.brainSlug !== brainSlug) {
    throw new GrantValidationError("Brain does not match this grant.", "BRAIN_MISMATCH");
  }

  if (grant.scope !== scope) {
    throw new GrantValidationError("Scope does not match this grant.", "SCOPE_MISMATCH");
  }
}

export function validatePersona(persona: string): asserts persona is PersonaId {
  if (!VALID_PERSONAS.has(persona as PersonaId)) {
    throw new Error(`Unknown persona "${persona}". Must be one of: clive, pam, doc.`);
  }
}

export function assertPersonaMayRequestKey(persona: PersonaId): void {
  validatePersona(persona);
  if (persona === "doc") {
    throw new Error("Doc does not request Brain Keys; Doc acts from approved briefs only.");
  }
}

export function assertRouteMayReadTrusted(routeId: RouteId): void {
  if (!TRUSTED_READ_ROUTES.has(routeId)) {
    throw new Error(`Route ${routeId} is not permitted to read trusted Brain truth.`);
  }
}

export function assertRouteMayPromote(routeId: RouteId): void {
  if (!PROMOTE_ROUTES.has(routeId)) {
    throw new Error(`Route ${routeId} is not permitted to promote to trusted Brain storage.`);
  }
}

export function assertApprovalDecisionPresent(approvalDecisionId: string | undefined): void {
  if (!approvalDecisionId?.trim()) {
    throw new Error("Doc promote requires an approval decision ID.");
  }
}
