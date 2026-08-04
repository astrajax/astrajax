import type { OperatorState } from "../operator-state";

/**
 * Server-side persistence seam for the state contract (§2). Mirrors the
 * brains GrantStore pattern: a memory backend for tests/dev and an Airtable
 * backend against the Registry base for production. Whatever the backend,
 * operator state survives device and browser changes — that is the point.
 */
export interface OperatorStore {
  /** Load by verified email (the identity key Auth.js hands us). */
  getByEmail(email: string): Promise<OperatorState | undefined>;

  getById(operatorId: string): Promise<OperatorState | undefined>;

  /** Create the initial record at first sign-in. Fails if email exists. */
  create(state: OperatorState): Promise<OperatorState>;

  /**
   * Persist a full updated snapshot. Last-write-wins is acceptable for a
   * single operator across devices; journey steps are idempotent to replay.
   */
  put(state: OperatorState): Promise<OperatorState>;

  resetForTests?(): void;
}
