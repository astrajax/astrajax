import type { OperatorState } from "../operator-state";
import type { OperatorStore } from "./index";

const byId = new Map<string, OperatorState>();

function clone(state: OperatorState): OperatorState {
  return structuredClone(state);
}

export const memoryOperatorStore: OperatorStore = {
  async getByEmail(email) {
    const lower = email.toLowerCase();
    for (const state of byId.values()) {
      if (state.email.toLowerCase() === lower) return clone(state);
    }
    return undefined;
  },

  async getById(operatorId) {
    const state = byId.get(operatorId);
    return state ? clone(state) : undefined;
  },

  async create(state) {
    const existing = await this.getByEmail(state.email);
    if (existing) {
      throw new Error(`Operator already exists for ${state.email}`);
    }
    byId.set(state.operatorId, clone(state));
    return clone(state);
  },

  async put(state) {
    if (!byId.has(state.operatorId)) {
      throw new Error(`Unknown operator ${state.operatorId}`);
    }
    const next = { ...clone(state), updatedAt: new Date().toISOString() };
    byId.set(state.operatorId, next);
    return clone(next);
  },

  resetForTests() {
    byId.clear();
  },
};
