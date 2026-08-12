/**
 * Load-or-create the operator house record after a valid sign-in code.
 * Kept out of NextAuth `authorize` so the create-race reload can be unit-tested
 * without spinning up Auth.js.
 */
import { randomUUID } from "node:crypto";
import { initialOperatorState } from "../platform/operator-state";
import { getOperatorStore } from "../platform/operator-store/get-store";

export class OperatorIdentityUnavailableError extends Error {
  constructor(message = "Operator store unavailable") {
    super(message);
    this.name = "OperatorIdentityUnavailableError";
  }
}

export async function loadOrCreateOperatorIdentity(email: string): Promise<{
  id: string;
  email: string;
}> {
  const store = getOperatorStore();
  let state = await store.getByEmail(email);
  if (!state) {
    try {
      state = await store.create(
        initialOperatorState({
          operatorId: `op_${randomUUID().slice(0, 12)}`,
          email,
        }),
      );
    } catch (createError) {
      // Concurrent sign-in can create the row between get and create —
      // that is a conflict, not a store outage. Reload the winner.
      if (
        !(createError instanceof Error) ||
        !/already exists/i.test(createError.message)
      ) {
        throw createError;
      }
      state = await store.getByEmail(email);
    }
  }
  if (!state) throw new OperatorIdentityUnavailableError();
  return { id: state.operatorId, email: state.email };
}
