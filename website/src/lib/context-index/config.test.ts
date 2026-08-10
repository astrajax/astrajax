import { afterEach, describe, expect, it } from "vitest";
import {
  contextIndexSyncEnabled,
  getContextIndexDatabaseUrl,
  getContextIndexEmbeddingModel,
  getOpenAiApiKey,
} from "./config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("context-index config", () => {
  it("keeps sync off unless CONTEXT_INDEX_SYNC_ENABLED is true/1", () => {
    delete process.env.CONTEXT_INDEX_SYNC_ENABLED;
    expect(contextIndexSyncEnabled()).toBe(false);

    process.env.CONTEXT_INDEX_SYNC_ENABLED = "yes";
    expect(contextIndexSyncEnabled()).toBe(false);

    process.env.CONTEXT_INDEX_SYNC_ENABLED = "false";
    expect(contextIndexSyncEnabled()).toBe(false);

    process.env.CONTEXT_INDEX_SYNC_ENABLED = "0";
    expect(contextIndexSyncEnabled()).toBe(false);

    process.env.CONTEXT_INDEX_SYNC_ENABLED = "true";
    expect(contextIndexSyncEnabled()).toBe(true);

    process.env.CONTEXT_INDEX_SYNC_ENABLED = "1";
    expect(contextIndexSyncEnabled()).toBe(true);
  });

  it("reads DATABASE_URL and OPENAI_API_KEY as optional wiring", () => {
    delete process.env.DATABASE_URL;
    delete process.env.OPENAI_API_KEY;
    expect(getContextIndexDatabaseUrl()).toBeUndefined();
    expect(getOpenAiApiKey()).toBeUndefined();

    process.env.DATABASE_URL = "postgres://example/db";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(getContextIndexDatabaseUrl()).toBe("postgres://example/db");
    expect(getOpenAiApiKey()).toBe("sk-test");
  });

  it("defaults the embedding model and allows override", () => {
    delete process.env.CONTEXT_INDEX_EMBEDDING_MODEL;
    expect(getContextIndexEmbeddingModel()).toBe("text-embedding-3-small");

    process.env.CONTEXT_INDEX_EMBEDDING_MODEL = "text-embedding-3-large";
    expect(getContextIndexEmbeddingModel()).toBe("text-embedding-3-large");
  });
});
