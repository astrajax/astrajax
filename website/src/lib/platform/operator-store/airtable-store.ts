/**
 * Airtable backend for operator state, against the Brain Registry base
 * (appbdTVHevH6Bl5ZZ), Operator State table (airtable-ids.ts
 * operatorState; OPERATOR_STATE_TABLE_ID overrides). Reuses
 * BRAIN_REGISTRY_WRITE_TOKEN / BRAIN_REGISTRY_READ_TOKEN. With
 * OPERATOR_STATE_USE_MEMORY=true (or no table id) the memory backend is
 * selected instead — see ./get-store.ts.
 *
 * One record per operator; the six §2 facts are stored as scalar columns
 * plus JSON text columns for the list-shaped facts, so the record stays
 * human-readable in the base without a bespoke table per list.
 */

import {
  airtableCreate,
  airtableFindOne,
  airtableUpdate,
  escapeAirtableString,
  type AirtableRecord,
} from "../../brains/airtable-rest";
import { BRAIN_REGISTRY_BASE_ID, BRAIN_REGISTRY_TABLES } from "../../brains/airtable-ids";
import type { OperatorState } from "../operator-state";
import type { OperatorStore } from "./index";

export const OPERATOR_STATE_FIELDS = {
  OPERATOR_ID: "Operator ID",
  EMAIL: "Email",
  ROLE: "Role",
  JOURNEY_CHAPTER: "Journey Chapter",
  JOURNEY_STEP: "Journey Step",
  COMPLETED_CHAPTERS: "Completed Chapters",
  OWNED_BRAIN_SLUGS: "Owned Brain Slugs",
  CONFIGURED_FUNCTIONS: "Configured Functions",
  INTRODUCED_MEMBERS: "Introduced Members",
  LAST_SAFE_DESTINATION: "Last Safe Destination",
  UPDATED_AT: "Updated At",
} as const;

export function operatorStateTableId(): string | undefined {
  return process.env.OPERATOR_STATE_TABLE_ID ?? BRAIN_REGISTRY_TABLES.operatorState;
}

function writeToken(): string {
  const token =
    process.env.BRAIN_REGISTRY_WRITE_TOKEN ?? process.env.BRAIN_REGISTRY_READ_TOKEN;
  if (!token) throw new Error("Operator state: no Brain Registry token configured.");
  return token;
}

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toState(record: AirtableRecord): OperatorState & { recordId: string } {
  const f = record.fields;
  const chapter = f[OPERATOR_STATE_FIELDS.JOURNEY_CHAPTER];
  const step = f[OPERATOR_STATE_FIELDS.JOURNEY_STEP];
  return {
    recordId: record.id,
    operatorId: String(f[OPERATOR_STATE_FIELDS.OPERATOR_ID] ?? ""),
    email: String(f[OPERATOR_STATE_FIELDS.EMAIL] ?? ""),
    role: (f[OPERATOR_STATE_FIELDS.ROLE] as OperatorState["role"]) ?? "owner",
    journey:
      typeof chapter === "number" && typeof step === "string"
        ? {
            chapter: chapter as 1 | 2 | 3,
            step,
            completedChapters: parseJsonArray(
              f[OPERATOR_STATE_FIELDS.COMPLETED_CHAPTERS],
            ).map(Number) as (1 | 2 | 3)[],
          }
        : null,
    ownedBrainSlugs: parseJsonArray(f[OPERATOR_STATE_FIELDS.OWNED_BRAIN_SLUGS]),
    configuredFunctions: parseJsonArray(
      f[OPERATOR_STATE_FIELDS.CONFIGURED_FUNCTIONS],
    ) as OperatorState["configuredFunctions"],
    introducedMembers: parseJsonArray(
      f[OPERATOR_STATE_FIELDS.INTRODUCED_MEMBERS],
    ) as OperatorState["introducedMembers"],
    lastSafeDestination:
      typeof f[OPERATOR_STATE_FIELDS.LAST_SAFE_DESTINATION] === "string"
        ? (f[OPERATOR_STATE_FIELDS.LAST_SAFE_DESTINATION] as string)
        : null,
    updatedAt: String(f[OPERATOR_STATE_FIELDS.UPDATED_AT] ?? ""),
  };
}

function toFields(state: OperatorState): Record<string, unknown> {
  return {
    [OPERATOR_STATE_FIELDS.OPERATOR_ID]: state.operatorId,
    [OPERATOR_STATE_FIELDS.EMAIL]: state.email.toLowerCase(),
    [OPERATOR_STATE_FIELDS.ROLE]: state.role,
    [OPERATOR_STATE_FIELDS.JOURNEY_CHAPTER]: state.journey?.chapter ?? null,
    [OPERATOR_STATE_FIELDS.JOURNEY_STEP]: state.journey?.step ?? null,
    [OPERATOR_STATE_FIELDS.COMPLETED_CHAPTERS]: JSON.stringify(
      state.journey?.completedChapters ?? [],
    ),
    [OPERATOR_STATE_FIELDS.OWNED_BRAIN_SLUGS]: JSON.stringify(state.ownedBrainSlugs),
    [OPERATOR_STATE_FIELDS.CONFIGURED_FUNCTIONS]: JSON.stringify(
      state.configuredFunctions,
    ),
    [OPERATOR_STATE_FIELDS.INTRODUCED_MEMBERS]: JSON.stringify(
      state.introducedMembers,
    ),
    [OPERATOR_STATE_FIELDS.LAST_SAFE_DESTINATION]: state.lastSafeDestination,
    [OPERATOR_STATE_FIELDS.UPDATED_AT]: new Date().toISOString(),
  };
}

async function findRecord(
  filter: string,
): Promise<(OperatorState & { recordId: string }) | undefined> {
  const tableId = operatorStateTableId();
  if (!tableId) throw new Error("OPERATOR_STATE_TABLE_ID is not configured.");
  const record = await airtableFindOne(
    BRAIN_REGISTRY_BASE_ID,
    tableId,
    writeToken(),
    filter,
  );
  return record ? toState(record) : undefined;
}

export const airtableOperatorStore: OperatorStore = {
  async getByEmail(email) {
    // Email is always stored lowercased on write — exact match avoids
    // formula quirks on Airtable's email field type.
    return findRecord(
      `{${OPERATOR_STATE_FIELDS.EMAIL}} = '${escapeAirtableString(email.toLowerCase())}'`,
    );
  },

  async getById(operatorId) {
    return findRecord(
      `{${OPERATOR_STATE_FIELDS.OPERATOR_ID}} = '${escapeAirtableString(operatorId)}'`,
    );
  },

  async create(state) {
    const existing = await this.getByEmail(state.email);
    if (existing) throw new Error(`Operator already exists for ${state.email}`);
    const tableId = operatorStateTableId();
    if (!tableId) throw new Error("OPERATOR_STATE_TABLE_ID is not configured.");
    const record = await airtableCreate(
      BRAIN_REGISTRY_BASE_ID,
      tableId,
      writeToken(),
      toFields(state),
    );
    return toState(record);
  },

  async put(state) {
    const existing = (await this.getById(state.operatorId)) as
      | (OperatorState & { recordId: string })
      | undefined;
    if (!existing) throw new Error(`Unknown operator ${state.operatorId}`);
    const tableId = operatorStateTableId();
    if (!tableId) throw new Error("OPERATOR_STATE_TABLE_ID is not configured.");
    const record = await airtableUpdate(
      BRAIN_REGISTRY_BASE_ID,
      tableId,
      writeToken(),
      existing.recordId,
      toFields(state),
    );
    return toState(record);
  },
};

/** Backend resolution: Airtable when a table id AND token are configured, memory otherwise (brains config.ts convention). */
export function useMemoryOperatorStore(): boolean {
  if (process.env.OPERATOR_STATE_USE_MEMORY === "true") return true;
  if (process.env.OPERATOR_STATE_USE_MEMORY === "false") return false;
  return (
    !operatorStateTableId() ||
    !(process.env.BRAIN_REGISTRY_WRITE_TOKEN ?? process.env.BRAIN_REGISTRY_READ_TOKEN)
  );
}
