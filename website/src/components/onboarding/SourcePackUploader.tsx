"use client";

/**
 * Real file picker and uploader for the onboarding Source Pack.
 *
 * - Browser file picker (click) + drag-and-drop
 * - Uploads to /api/onboarding/upload (Vercel Blob)
 * - Enforces Ruth's Source Pack limits
 * - Shows honest upload state: selecting → uploading → uploaded / failed
 */
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

export function SourcePackUploader({ state, onFileSelect, onFileUpdate, onFileRemove, maxFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  /** Keep the original File around so a failed upload can retry without re-picking. */
  const fileHandles = useRef(new Map<string, File>());
  const abortControllers = useRef(new Map<string, AbortController>());
  const removedIds = useRef(new Set<string>());
  const [dragOver, setDragOver] = useState(false);
  const effectiveMaxFiles = maxFiles ?? SOURCE_PACK_LIMITS.maxFiles;

  const postUpload = useCallback(
    async (fileId: string, file: File) => {
      removedIds.current.delete(fileId);
      const controller = new AbortController();
      abortControllers.current.set(fileId, controller);
      onFileUpdate(fileId, { state: "uploading", progress: 0, error: undefined });
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/onboarding/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (removedIds.current.has(fileId)) return;

        const result = await response.json();

        if (removedIds.current.has(fileId)) return;

        if (!response.ok || !result.success) {
          onFileUpdate(fileId, {
            state: "failed",
            error: result.error || "Upload failed",
          });
          return;
        }

        onFileUpdate(fileId, {
          state: "uploaded",
          blobUrl: result.blobUrl,
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
   * kick off upload. Returns the staged row so callers can accumulate totals
   * before React re-renders.
   */
  const stageAndUpload = useCallback(
    (file: File, limitState: OnboardingState): SourcePackFile => {
      const ext = getExtension(file.name);
      const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Check extension
      if (!SOURCE_PACK_LIMITS.allowedExtensions.includes(ext as typeof SOURCE_PACK_LIMITS.allowedExtensions[number])) {
        const failed: SourcePackFile = {
          id: fileId,
          name: file.name,
          extension: ext,
          sizeBytes: file.size,
          state: "failed",
          error: `File type not allowed: ${ext}`,
        };
        onFileSelect(failed);
        return failed;
      }

      // Check limits against the provided snapshot (batch-aware)
      const check = canAddFile(limitState, file.size);
      if (!check.ok) {
        const failed: SourcePackFile = {
          id: fileId,
          name: file.name,
          extension: ext,
          sizeBytes: file.size,
          state: "failed",
          error: check.reason,
        };
        onFileSelect(failed);
        return failed;
      }

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
        workingFiles = [...workingFiles, staged];
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

  const activeFiles = filesCountingTowardLimit(state.files);
  const totalBytes = activeFiles.reduce((sum, f) => sum + f.sizeBytes, 0);
  const atLimit = activeFiles.length >= effectiveMaxFiles;

  return (
    <div className="source-pack-uploader">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple={effectiveMaxFiles > 1}
        accept={SOURCE_PACK_LIMITS.allowedExtensions.join(",")}
        onChange={handleInputChange}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {/* File list */}
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
                onClick={() => {
                  removedIds.current.add(f.id);
                  abortControllers.current.get(f.id)?.abort();
                  abortControllers.current.delete(f.id);
                  fileHandles.current.delete(f.id);
                  onFileRemove(f.id);
                }}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone */}
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
            {SOURCE_PACK_LIMITS.allowedExtensions.join(", ")} · max {formatBytes(SOURCE_PACK_LIMITS.maxBytesPerFile)} each
          </p>
        </div>
      )}

      {/* Status */}
      <p className="source-pack-uploader__status">
        {activeFiles.length} of {effectiveMaxFiles} files · {formatBytes(totalBytes)} of{" "}
        {formatBytes(SOURCE_PACK_LIMITS.maxBytesTotal)}
      </p>
    </div>
  );
}
