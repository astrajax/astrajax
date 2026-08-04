import { airtableOperatorStore, useMemoryOperatorStore } from "./airtable-store";
import type { OperatorStore } from "./index";
import { memoryOperatorStore } from "./memory-store";

export function getOperatorStore(): OperatorStore {
  return useMemoryOperatorStore() ? memoryOperatorStore : airtableOperatorStore;
}
