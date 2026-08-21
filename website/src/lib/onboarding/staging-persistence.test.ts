/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  ONBOARDING_STAGING_KEY,
  readOnboardingStaging,
  sanitizeRestoredFiles,
  writeOnboardingStaging,
} from "./staging-persistence";
import type { SourcePackFile } from "./machine";

describe("onboarding staging persistence", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("drops in-flight uploads on restore and keeps uploaded rows", () => {
    const files: SourcePackFile[] = [
      {
        id: "a",
        name: "done.pdf",
        extension: ".pdf",
        sizeBytes: 10,
        state: "uploaded",
        blobUrl: "https://example.private.blob.vercel-storage.com/a",
      },
      {
        id: "b",
        name: "mid.pdf",
        extension: ".pdf",
        sizeBytes: 10,
        state: "uploading",
      },
    ];
    expect(sanitizeRestoredFiles(files).map((f) => f.id)).toEqual(["a"]);
  });

  it("round-trips uploaded staging through sessionStorage", () => {
    writeOnboardingStaging({
      files: [
        {
          id: "a",
          name: "done.pdf",
          extension: ".pdf",
          sizeBytes: 10,
          state: "uploaded",
          blobUrl: "https://example.private.blob.vercel-storage.com/a",
        },
      ],
      supportingFile: null,
    });
    expect(sessionStorage.getItem(ONBOARDING_STAGING_KEY)).toBeTruthy();
    const restored = readOnboardingStaging();
    expect(restored?.files).toHaveLength(1);
    expect(restored?.files[0]?.blobUrl).toContain("private.blob");
  });

  it("restores an interrupted filing as retryable, not filed", () => {
    const restored = sanitizeRestoredFiles([
      {
        id: "a",
        name: "done.pdf",
        extension: ".pdf",
        sizeBytes: 10,
        state: "uploaded",
        blobUrl: "https://example.private.blob.vercel-storage.com/a",
        filing: "filing",
      },
    ]);
    expect(restored[0]?.filing).toBe("not-filed");
    expect(restored[0]?.filingError).toMatch(/retry/i);
  });

  it("keeps a completed filing intact across reload", () => {
    writeOnboardingStaging({
      files: [
        {
          id: "a",
          name: "done.pdf",
          extension: ".pdf",
          sizeBytes: 10,
          state: "uploaded",
          filing: "filed",
          sourceDocumentRecordId: "recFiled1234567",
          blobDeleted: true,
        },
      ],
      supportingFile: null,
    });
    const restored = readOnboardingStaging();
    expect(restored?.files[0]?.filing).toBe("filed");
    expect(restored?.files[0]?.sourceDocumentRecordId).toBe("recFiled1234567");
  });
});
