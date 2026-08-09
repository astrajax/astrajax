import { afterEach, describe, expect, it } from "vitest";
import { useMemoryOperatorStore } from "./airtable-store";
import { getOperatorStore } from "./get-store";
import { memoryOperatorStore } from "./memory-store";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("useMemoryOperatorStore / getOperatorStore", () => {
  it("honours an explicit OPERATOR_STATE_USE_MEMORY=true", () => {
    process.env.OPERATOR_STATE_USE_MEMORY = "true";
    process.env.OPERATOR_STATE_TABLE_ID = "tblSomething";
    process.env.BRAIN_REGISTRY_WRITE_TOKEN = "patWrite";
    expect(useMemoryOperatorStore()).toBe(true);
    expect(getOperatorStore()).toBe(memoryOperatorStore);
  });

  it("honours an explicit OPERATOR_STATE_USE_MEMORY=false when table + token exist", () => {
    process.env.OPERATOR_STATE_USE_MEMORY = "false";
    process.env.OPERATOR_STATE_TABLE_ID = "tblSomething";
    process.env.BRAIN_REGISTRY_WRITE_TOKEN = "patWrite";
    expect(useMemoryOperatorStore()).toBe(false);
    expect(getOperatorStore()).not.toBe(memoryOperatorStore);
  });

  it("defaults to memory when no registry token is configured", () => {
    delete process.env.OPERATOR_STATE_USE_MEMORY;
    delete process.env.BRAIN_REGISTRY_WRITE_TOKEN;
    delete process.env.BRAIN_REGISTRY_READ_TOKEN;
    // Table id has a baked-in default; missing token alone must keep local/dev on memory.
    expect(useMemoryOperatorStore()).toBe(true);
    expect(getOperatorStore()).toBe(memoryOperatorStore);
  });
});
