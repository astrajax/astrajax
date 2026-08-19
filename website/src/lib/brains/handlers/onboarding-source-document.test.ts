import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  del: vi.fn(),
}));

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableCreate: vi.fn(),
    airtableUploadAttachment: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
  useMemoryStore: vi.fn(() => false),
}));

import { del, get } from "@vercel/blob";
import { airtableCreate, airtableUploadAttachment } from "../airtable-rest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopWriteToken, useMemoryStore } from "../config";
import { handleOnboardingSourceDocument } from "./onboarding-source-document";
import { clearMemorySourceDocumentsForTests } from "./source-document-memory";

const getMock = vi.mocked(get);
const delMock = vi.mocked(del);
const createMock = vi.mocked(airtableCreate);
const uploadMock = vi.mocked(airtableUploadAttachment);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryModeMock = vi.mocked(useMemoryStore);

const PATHNAME = "onboarding-uploads/abc-123-notes.pdf";

function stagedBlob(bytes: Uint8Array, contentType = "application/pdf") {
  return {
    stream: new Response(bytes).body,
    headers: new Headers(),
    blob: { contentType, size: bytes.byteLength },
  } as unknown as Awaited<ReturnType<typeof get>>;
}

describe("handleOnboardingSourceDocument", () => {
  beforeEach(() => {
    clearMemorySourceDocumentsForTests();
    getMock.mockReset();
    delMock.mockReset();
    createMock.mockReset();
    uploadMock.mockReset();
    memoryModeMock.mockReturnValue(false);
    writeTokenMock.mockReturnValue("pat_workshop_write");
    delete process.env.BRAIN_WORKSHOP_SOURCE_DOCUMENTS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Pending Source Documents row and attaches the staged bytes", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array([1, 2, 3, 4])));
    createMock.mockResolvedValue({ id: "recSourceDoc1", fields: {} });
    uploadMock.mockResolvedValue({ id: "recSourceDoc1", fields: {} });
    delMock.mockResolvedValue(undefined);

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "Team notes.pdf",
    });

    expect(createMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "pat_workshop_write",
      {
        Title: "Team notes.pdf",
        "Mine Status": "Pending",
        "Brain Slug": "astrajax-chapter-1",
        "Created By": "Website",
      },
    );
    expect(uploadMock).toHaveBeenCalledWith(
      "appWorkshop",
      "recSourceDoc1",
      "Attachment",
      "pat_workshop_write",
      {
        filename: "Team notes.pdf",
        contentType: "application/pdf",
        base64: Buffer.from([1, 2, 3, 4]).toString("base64"),
      },
    );
    expect(result).toEqual({
      mode: "airtable",
      saved: true,
      recordId: "recSourceDoc1",
      blobRetained: false,
    });
  });

  it("never marks a filed row Summarised or mines it", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array([9])));
    createMock.mockResolvedValue({ id: "recSourceDoc2", fields: {} });
    uploadMock.mockResolvedValue({ id: "recSourceDoc2", fields: {} });

    await handleOnboardingSourceDocument(PATHNAME, { filename: "deck.pdf" });

    const fields = createMock.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(fields["Mine Status"]).toBe("Pending");
    expect(fields["Attachment Summary"]).toBeUndefined();
    expect(fields["Linked Drafts"]).toBeUndefined();
  });

  it("deletes staging only after the attachment lands", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array([7])));
    createMock.mockResolvedValue({ id: "recSourceDoc3", fields: {} });
    uploadMock.mockRejectedValue(new Error("Airtable API error 500: boom"));

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
    });

    expect(delMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "airtable",
      saved: false,
      recordId: "recSourceDoc3",
      blobRetained: true,
    });
    expect(result.message).toMatch(/attachment did not upload/);
  });

  it("attaches to an existing row on retry instead of filing twice", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array([5])));
    uploadMock.mockResolvedValue({ id: "recExisting1234", fields: {} });

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
      recordId: "recExisting1234",
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(uploadMock).toHaveBeenCalledWith(
      "appWorkshop",
      "recExisting1234",
      "Attachment",
      "pat_workshop_write",
      expect.anything(),
    );
    expect(result.saved).toBe(true);
  });

  it("refuses files above Airtable's direct attachment limit without creating a row", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array(6 * 1024 * 1024)));

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "huge.pdf",
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ saved: false, blobRetained: true });
    expect(result.message).toMatch(/5 MB/);
  });

  it("returns an honest fallback when Workshop is unwired", async () => {
    writeTokenMock.mockReturnValue(undefined);

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
    });

    expect(getMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "fallback",
      saved: false,
      blobRetained: true,
    });
    expect(result.message).toMatch(/BRAIN_WORKSHOP_WRITE_TOKEN/);
  });

  it("files a local stand-in in memory mode without touching Airtable", async () => {
    memoryModeMock.mockReturnValue(true);

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(getMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ mode: "memory", saved: true });
    expect(result.recordId).toMatch(/^srcdoc_/);
  });

  it("reports a missing staged blob rather than filing an empty row", async () => {
    getMock.mockResolvedValue(null);

    await expect(
      handleOnboardingSourceDocument(PATHNAME, { filename: "gone.pdf" }),
    ).rejects.toThrow(/no longer available/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("falls back to the staging key when no filename is supplied", async () => {
    getMock.mockResolvedValue(stagedBlob(new Uint8Array([1])));
    createMock.mockResolvedValue({ id: "recTitleFallback", fields: {} });
    uploadMock.mockResolvedValue({ id: "recTitleFallback", fields: {} });

    await handleOnboardingSourceDocument(PATHNAME);

    const fields = createMock.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(fields.Title).toBe("abc-123-notes.pdf");
  });
});
