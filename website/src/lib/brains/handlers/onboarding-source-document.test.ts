import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  head: vi.fn(),
  del: vi.fn(),
  issueSignedToken: vi.fn(),
  presignUrl: vi.fn(),
}));

vi.mock("../airtable-rest", async () => {
  const actual = await vi.importActual<typeof import("../airtable-rest")>("../airtable-rest");
  return {
    ...actual,
    airtableCreate: vi.fn(),
    airtableAttachFromUrl: vi.fn(),
    airtableUploadAttachment: vi.fn(),
  };
});

vi.mock("../config", () => ({
  getWorkshopBaseId: vi.fn(() => "appWorkshop"),
  getWorkshopWriteToken: vi.fn(() => "pat_workshop_write"),
  useMemoryStore: vi.fn(() => false),
}));

import { del, head, issueSignedToken, presignUrl } from "@vercel/blob";
import {
  airtableAttachFromUrl,
  airtableCreate,
  airtableUploadAttachment,
} from "../airtable-rest";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { getWorkshopWriteToken, useMemoryStore } from "../config";
import { handleOnboardingSourceDocument } from "./onboarding-source-document";
import { clearMemorySourceDocumentsForTests } from "./source-document-memory";

const headMock = vi.mocked(head);
const delMock = vi.mocked(del);
const issueSignedTokenMock = vi.mocked(issueSignedToken);
const presignUrlMock = vi.mocked(presignUrl);
const createMock = vi.mocked(airtableCreate);
const attachFromUrlMock = vi.mocked(airtableAttachFromUrl);
const uploadBytesMock = vi.mocked(airtableUploadAttachment);
const writeTokenMock = vi.mocked(getWorkshopWriteToken);
const memoryModeMock = vi.mocked(useMemoryStore);

const PATHNAME = "onboarding-uploads/abc-123-notes.pdf";
const PRESIGNED = "https://example.private.blob.vercel-storage.com/onboarding-uploads/abc-123-notes.pdf?sig=test";

function stubStagingOk(size = 4) {
  headMock.mockResolvedValue({
    size,
    contentType: "application/pdf",
    pathname: PATHNAME,
    url: "https://example.private.blob.vercel-storage.com/" + PATHNAME,
  } as Awaited<ReturnType<typeof head>>);
  issueSignedTokenMock.mockResolvedValue({
    delegationToken: "delegation",
    clientSigningToken: "client-signing",
    validUntil: Date.now() + 12 * 60 * 1000,
  });
  presignUrlMock.mockResolvedValue({ presignedUrl: PRESIGNED });
}

describe("handleOnboardingSourceDocument", () => {
  beforeEach(() => {
    clearMemorySourceDocumentsForTests();
    headMock.mockReset();
    delMock.mockReset();
    issueSignedTokenMock.mockReset();
    presignUrlMock.mockReset();
    createMock.mockReset();
    attachFromUrlMock.mockReset();
    uploadBytesMock.mockReset();
    memoryModeMock.mockReturnValue(false);
    writeTokenMock.mockReturnValue("pat_workshop_write");
    delete process.env.BRAIN_WORKSHOP_SOURCE_DOCUMENTS_TABLE_ID;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Pending Source Documents row and attaches via signed URL", async () => {
    stubStagingOk();
    createMock.mockResolvedValue({ id: "recSourceDoc1", fields: {} });
    attachFromUrlMock.mockResolvedValue({ id: "recSourceDoc1", fields: {} });
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
    expect(issueSignedTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: PATHNAME,
        operations: ["get"],
      }),
    );
    expect(presignUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        delegationToken: "delegation",
        clientSigningToken: "client-signing",
      }),
      expect.objectContaining({
        operation: "get",
        pathname: PATHNAME,
        access: "private",
      }),
    );
    expect(attachFromUrlMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "recSourceDoc1",
      "Attachment",
      "pat_workshop_write",
      { url: PRESIGNED, filename: "Team notes.pdf" },
    );
    expect(uploadBytesMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      mode: "airtable",
      saved: true,
      recordId: "recSourceDoc1",
      blobRetained: false,
    });
  });

  it("never marks a filed row Summarised or mines it", async () => {
    stubStagingOk();
    createMock.mockResolvedValue({ id: "recSourceDoc2", fields: {} });
    attachFromUrlMock.mockResolvedValue({ id: "recSourceDoc2", fields: {} });

    await handleOnboardingSourceDocument(PATHNAME, { filename: "deck.pdf" });

    const fields = createMock.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(fields["Mine Status"]).toBe("Pending");
    expect(fields["Attachment Summary"]).toBeUndefined();
    expect(fields["Linked Drafts"]).toBeUndefined();
  });

  it("deletes staging only after the attachment lands", async () => {
    stubStagingOk();
    createMock.mockResolvedValue({ id: "recSourceDoc3", fields: {} });
    attachFromUrlMock.mockRejectedValue(new Error("Airtable API error 500: boom"));

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
    stubStagingOk();
    attachFromUrlMock.mockResolvedValue({ id: "recExisting1234", fields: {} });

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
      recordId: "recExisting1234",
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(attachFromUrlMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "recExisting1234",
      "Attachment",
      "pat_workshop_write",
      expect.objectContaining({ url: PRESIGNED }),
    );
    expect(uploadBytesMock).not.toHaveBeenCalled();
    expect(result.saved).toBe(true);
  });

  it("files files above Airtable's direct byte-upload limit via signed URL attach", async () => {
    const sixMb = 6 * 1024 * 1024;
    stubStagingOk(sixMb);
    createMock.mockResolvedValue({ id: "recLargeDoc1", fields: {} });
    attachFromUrlMock.mockResolvedValue({ id: "recLargeDoc1", fields: {} });
    delMock.mockResolvedValue(undefined);

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "huge.pdf",
    });

    expect(createMock).toHaveBeenCalled();
    expect(attachFromUrlMock).toHaveBeenCalledWith(
      "appWorkshop",
      BRAIN_WORKSHOP_TABLES.sourceDocuments,
      "recLargeDoc1",
      "Attachment",
      "pat_workshop_write",
      { url: PRESIGNED, filename: "huge.pdf" },
    );
    expect(uploadBytesMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "airtable",
      saved: true,
      recordId: "recLargeDoc1",
      blobRetained: false,
    });
    expect(result.message ?? "").not.toMatch(/by hand/i);
    expect(result.message ?? "").not.toMatch(/5 MB/);
  });

  it("keeps staging and offers retry when signed URL mint fails", async () => {
    stubStagingOk();
    createMock.mockResolvedValue({ id: "recSignFail1", fields: {} });
    issueSignedTokenMock.mockRejectedValue(new Error("Blob signed-token unavailable"));

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
    });

    expect(attachFromUrlMock).not.toHaveBeenCalled();
    expect(uploadBytesMock).not.toHaveBeenCalled();
    expect(delMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "airtable",
      saved: false,
      recordId: "recSignFail1",
      blobRetained: true,
    });
    expect(result.message).toMatch(/temporary download link/i);
    expect(result.message).toMatch(/retry/i);
    expect(result.message ?? "").not.toMatch(/by hand/i);
  });

  it("returns an honest fallback when Workshop is unwired", async () => {
    writeTokenMock.mockReturnValue(undefined);

    const result = await handleOnboardingSourceDocument(PATHNAME, {
      filename: "notes.pdf",
    });

    expect(headMock).not.toHaveBeenCalled();
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
    expect(headMock).not.toHaveBeenCalled();
    expect(result).toMatchObject({ mode: "memory", saved: true });
    expect(result.recordId).toMatch(/^srcdoc_/);
  });

  it("reports a missing staged blob rather than filing an empty row", async () => {
    headMock.mockRejectedValue(new Error("Not found"));

    await expect(
      handleOnboardingSourceDocument(PATHNAME, { filename: "gone.pdf" }),
    ).rejects.toThrow(/no longer available/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("falls back to the staging key when no filename is supplied", async () => {
    stubStagingOk();
    createMock.mockResolvedValue({ id: "recTitleFallback", fields: {} });
    attachFromUrlMock.mockResolvedValue({ id: "recTitleFallback", fields: {} });

    await handleOnboardingSourceDocument(PATHNAME);

    const fields = createMock.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(fields.Title).toBe("abc-123-notes.pdf");
    expect(attachFromUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ filename: "abc-123-notes.pdf" }),
    );
  });
});
