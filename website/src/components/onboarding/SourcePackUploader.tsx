"use client";

/**
 * Real file picker and uploader for the onboarding Source Pack.
 *
 * - Browser file picker (click) + drag-and-drop
 * - Client-direct upload to Vercel Blob (token minted by /api/onboarding/upload)
 * - Enforces Ruth's Source Pack limits (browser UX + server token)
 * - Shows honest upload state: uploading → uploaded / failed
 */
import { upload } from "@vercel/blob/client";
import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  SOURCE_PACK_LIMITS,
  canAddFile,
  filesCountingTowardLimit,
  type OnboardingState,
  type SourcePackFile,
} from "@/lib/onboarding/machine";

type Props = {
  state: OnboardingState;
  onFileSelect: (file: SourcePackFile) => void;
  onFileUpdate: (fileId: string, update: Partial<SourcePackFile>) => void;
  onFileRemove: (fileId: string) => void;
  /** For Route B: limit to 1 file. */
  maxFiles?: number;
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function buildUploadPathname(filename: string): string {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${SOURCE_PACK_LIMITS.uploadPrefix}${unique}-${safeFilename}`;
}

async function deleteOrphanBlob(blobUrl: string): Promise<void> {
  try {
    await fetch("/api/onboarding/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: blobUrl }),
    });
  } catch {
    // Best-effort cleanup — private store + rate limit bound residual orphans.
  }
}

export function SourcePackUploader({ state, onFileSelect, onFileUpdate, onFileRemove, maxFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** Keep the original File around so a failed upload can retry without re-picking. */
  const fileHandles = useRef(new Map<string, File>());
  const abortControllers = useRef(new Map<string, AbortController>());
  const removedIds = useRef(new Set<string>());
  const [dragOver, setDragOver] = useState(false);
  /** Browser-side rejections are not staged into the file list (they must not burn slots). */
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);
  const effectiveMaxFiles = maxFiles ?? SOURCE_PACK_LIMITS.maxFiles;

  const postUpload = useCallback(
    async (fileId: string, file: File) => {
      removedIds.current.delete(fileId);
      const controller = new AbortController();
      abortControllers.current.set(fileId, controller);
      onFileUpdate(fileId, { state: "uploading", progress: 0, error: undefined });
      try {
        const pathname = buildUploadPathname(file.name);
        const result = await upload(pathname, file, {
          access: "private",
          handleUploadUrl: "/api/onboarding/upload",
          multipart: file.size > 4 * 1024 * 1024,
          abortSignal: controller.signal,
          clientPayload: JSON.stringify({ sizeBytes: file.size, fileId }),
          contentType: file.type || undefined,
        });

        if (removedIds.current.has(fileId)) {
          await deleteOrphanBlob(result.url);
          return;
        }

        onFileUpdate(fileId, {
          state: "uploaded",
          blobUrl: result.url,
          progress: 100,
          error: undefined,
        });
      } catch (error) {
        if (removedIds.current.has(fileId)) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        onFileUpdate(fileId, {
          state: "failed",
          error: error instanceof Error ? error.message : "Upload failed",
        });
      } finally {
        abortControllers.current.delete(fileId);
      }
    },
    [onFileUpdate],
  );

  /**
   * Stage one file against `limitState` (may be a batch-local snapshot), then
   * kick off upload. Returns the staged row when accepted, or null when the
   * browser rejects the pick (type/size) without consuming a Source Pack slot.
   */
  const stageAndUpload = useCallback(
    (file: File, limitState: OnboardingState): SourcePackFile | null => {
      const ext = getExtension(file.name);
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      if (!SOURCE_PACK_LIMITS.allowedExtensions.includes(ext as (typeof SOURCE_PACK_LIMITS.allowedExtensions)[number])) {
        setRejectionNotice(`File type not allowed: ${ext}`);
        return null;
      }

      const check = canAddFile(limitState, file.size);
      if (!check.ok) {
        setRejectionNotice(check.reason || "File rejected");
        return null;
      }

      setRejectionNotice(null);
      fileHandles.current.set(fileId, file);
      const staged: SourcePackFile = {
        id: fileId,
        name: file.name,
        extension: ext,
        sizeBytes: file.size,
        state: "uploading",
        progress: 0,
      };
      onFileSelect(staged);
      void postUpload(fileId, file);
      return staged;
    },
    [onFileSelect, postUpload],
  );

  const retryFile = useCallback(
    async (fileId: string) => {
      const file = fileHandles.current.get(fileId);
      if (!file) return;
      await postUpload(fileId, file);
    },
    [postUpload],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const currentCount = filesCountingTowardLimit(state.files).length;
      const remaining = effectiveMaxFiles - currentCount;
      if (remaining <= 0) return;
      const toProcess = Array.from(files).slice(0, remaining);

      // Accumulate within this gesture so canAddFile sees cumulative bytes/count
      // (React state from onFileSelect is not applied until the handler finishes).
      let workingFiles = state.files;
      for (const file of toProcess) {
        const staged = stageAndUpload(file, { ...state, files: workingFiles });
        if (staged) {
          workingFiles = [...workingFiles, staged];
        }
      }
    },
    [state, effectiveMaxFiles, stageAndUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles],
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFileRow = useCallback(
    (file: SourcePackFile) => {
      removedIds.current.add(file.id);
      abortControllers.current.get(file.id)?.abort();
      abortControllers.current.delete(file.id);
      fileHandles.current.delete(file.id);
      if (file.blobUrl) {
        void deleteOrphanBlob(file.blobUrl);
      }
      onFileRemove(file.id);
    },
    [onFileRemove],
  );

  const activeFiles = filesCountingTowardLimit(state.files);
  const totalBytes = activeFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
  const atLimit = activeFiles.length >= effectiveMaxFiles;

  return (
    <div className="source-pack-uploader">
      <input
        ref={inputRef}
        type="file"
        multiple={effectiveMaxFiles > 1}
        accept={SOURCE_PACK_LIMITS.allowedExtensions.join(",")}
        onChange={handleInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {state.files.length > 0 && (
        <ul className="source-pack-uploader__list">
          {state.files.map((f) => (
            <li
              key={f.id}
              className={`source-pack-uploader__file source-pack-uploader__file--${f.state}`}
            >
              <span className="source-pack-uploader__name">{f.name}</span>
              <span className="source-pack-uploader__meta">
                {formatBytes(f.sizeBytes)}
                {f.state === "uploading" && " · uploading…"}
                {f.state === "uploaded" && " · uploaded"}
                {f.state === "failed" && ` · ${f.error || "failed"}`}
              </span>
              {f.state === "failed" && fileHandles.current.has(f.id) && (
                <button
                  type="button"
                  className="source-pack-uploader__retry"
                  onClick={() => void retryFile(f.id)}
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                className="source-pack-uploader__remove"
                onClick={() => removeFileRow(f)}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!atLimit && (
        <div
          className={`source-pack-uploader__drop${dragOver ? " source-pack-uploader__drop--active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => e.key === "Enter" && openPicker()}
        >
          <p className="source-pack-uploader__prompt">
            Drop files here, or <span className="source-pack-uploader__link">browse</span>
          </p>
          <p className="source-pack-uploader__hint">
            {SOURCE_PACK_LIMITS.allowedExtensions.join(", ")} · max{" "}
            {formatBytes(SOURCE_PACK_LIMITS.maxBytesPerFile)} each
          </p>
        </div>
      )}

      {rejectionNotice && (
        <p className="source-pack-uploader__rejection" role="status">
          {rejectionNotice}
        </p>
      )}

      <p className="source-pack-uploader__status">
        {activeFiles.length} of {effectiveMaxFiles} files · {formatBytes(totalBytes)} of{" "}
        {formatBytes(SOURCE_PACK_LIMITS.maxBytesTotal)}
      </p>
    </div>
  );
}
