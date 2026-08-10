import { afterEach, describe, expect, it } from "vitest";
import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "@/lib/brains/airtable-ids";
import {
  getContextIndexSources,
  getSourceReadToken,
  sourceKey,
  type ContextIndexSource,
} from "./sources";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

const sampleSource: ContextIndexSource = {
  clientId: CHAPTER1_BRAIN_SLUG,
  baseId: "appBase",
  tableId: "tblTruth",
  labelField: "Title",
  fields: ["Title", "Canonical Text"],
  tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
};

describe("context-index sources", () => {
  it("builds a stable source key for sync state", () => {
    expect(sourceKey(sampleSource)).toBe(
      `${CHAPTER1_BRAIN_SLUG}:appBase:tblTruth`,
    );
  });

  it("returns the Chapter 1 Trusted Truth source with indexable fields", () => {
    delete process.env.BRAIN_TRUSTED_BRAINS;
    delete process.env.BRAIN_TRUSTED_BASE_ID;
    delete process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID;
    delete process.env.BRAIN_TRUSTED_CONTEXT_TABLE_ID;
    delete process.env.CONTEXT_INDEX_TRUSTED_TRUTH_VIEW_ID;

    const sources = getContextIndexSources();
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      clientId: CHAPTER1_BRAIN_SLUG,
      baseId: BRAIN_TRUSTED_CHAPTER1_BASE_ID,
      tableId: BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth,
      labelField: "Title",
      fields: ["Title", "Canonical Text", "Category", "Scope"],
      approvedField: "Last Reviewed",
      tokenEnvKey: "BRAIN_TRUSTED_READ_TOKEN",
    });
    expect(sources[0].viewId).toBeUndefined();
  });

  it("honours env overrides for base, table, and approved view", () => {
    delete process.env.BRAIN_TRUSTED_BRAINS;
    process.env.BRAIN_TRUSTED_BASE_ID = "appOverride";
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID = "tblOverride";
    process.env.CONTEXT_INDEX_TRUSTED_TRUTH_VIEW_ID = "viwApproved";

    const [source] = getContextIndexSources();
    expect(source.baseId).toBe("appOverride");
    expect(source.tableId).toBe("tblOverride");
    expect(source.viewId).toBe("viwApproved");
  });

  it("reads the source PAT from env, then Trusted Brain helper", () => {
    delete process.env.BRAIN_TRUSTED_READ_TOKEN;
    delete process.env.BRAIN_TRUSTED_BRAINS;
    expect(getSourceReadToken(sampleSource)).toBeUndefined();

    process.env.BRAIN_TRUSTED_READ_TOKEN = "pat-direct";
    expect(getSourceReadToken(sampleSource)).toBe("pat-direct");

    delete process.env.BRAIN_TRUSTED_READ_TOKEN;
    process.env.BRAIN_TRUSTED_BRAINS = JSON.stringify([
      {
        slug: CHAPTER1_BRAIN_SLUG,
        baseId: "appX",
        readTokenEnvKey: "CUSTOM_TRUSTED_PAT",
      },
    ]);
    process.env.CUSTOM_TRUSTED_PAT = "pat-via-helper";
    // tokenEnvKey still BRAIN_TRUSTED_READ_TOKEN → helper path uses source.clientId config
    expect(getSourceReadToken(sampleSource)).toBe("pat-via-helper");
  });
});
