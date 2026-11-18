"use client";

import { Upload, X } from "lucide-react";
import {
  formatFileSize,
  SALES_UPLOAD_ACCEPT,
  SALES_UPLOAD_HINT,
  validateSalesUploadFile,
} from "@/lib/sales/constants";
import { fileSelectionFingerprint } from "@/lib/sales/user-messages";
import { useCallback, useId, useRef, useState } from "react";

type FileUploadZoneProps = {
  file: File | null;
  disabled?: boolean;
  validationError: string | null;
  onFileChange: (file: File | null, error: string | null) => void;
};

export function FileUploadZone({
  file,
  disabled = false,
  validationError,
  onFileChange,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hintId = useId();
  const errorId = useId();

  const applyFile = useCallback(
    (next: File | null, options?: { allowSameFile?: boolean }) => {
      if (!next) {
        onFileChange(null, null);
        return;
      }

      if (
        file &&
        !options?.allowSameFile &&
        fileSelectionFingerprint(file) === fileSelectionFingerprint(next)
      ) {
        onFileChange(file, "This file is already selected.");
        return;
      }

      const error = validateSalesUploadFile(next);
      onFileChange(error ? null : next, error);
    },
    [file, onFileChange],
  );

  const onBrowse = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    applyFile(picked);
    event.target.value = "";
  };

  const onDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const list = event.dataTransfer.files;
    if (!list || list.length === 0) return;

    const dropped = list[0];
    if (!dropped) return;

    if (list.length > 1) {
      const error = validateSalesUploadFile(dropped);
      if (error) {
        onFileChange(null, error);
        return;
      }
      onFileChange(
        dropped,
        "Only one file can be analyzed at a time. Using the first file.",
      );
      return;
    }

    applyFile(dropped);
  };

  const describedBy = [hintId, validationError ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const showDropTarget = !file;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={SALES_UPLOAD_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={onInputChange}
        aria-describedby={describedBy || undefined}
      />

      {showDropTarget ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onBrowse}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={[
            "group border-border-subtle bg-surface relative flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center transition-colors sm:py-14",
            "focus-visible:ring-accent/50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            isDragging
              ? "border-accent/60 bg-accent-muted/40"
              : "hover:border-border-strong hover:bg-surface-elevated/80",
          ].join(" ")}
        >
          <span className="bg-surface-elevated border-border-subtle mb-5 flex h-12 w-12 items-center justify-center rounded-xl border">
            <Upload
              className="text-muted group-hover:text-foreground h-5 w-5 transition-colors"
              strokeWidth={1.75}
              aria-hidden
            />
          </span>
          <p className="text-foreground text-base font-medium">
            Drop your sales file here
          </p>
          <p id={hintId} className="text-muted mt-2 text-sm text-pretty">
            or click to browse — {SALES_UPLOAD_HINT}
          </p>
        </button>
      ) : (
        <div className="border-border-subtle bg-surface-elevated flex w-full flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="bg-accent-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Upload
                className="text-accent h-4 w-4"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium break-all">{file.name}</p>
              <p className="text-muted text-xs">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              disabled={disabled}
              onClick={onBrowse}
              className="border-border-subtle hover:border-border-strong hover:bg-surface focus-visible:ring-accent/50 rounded-lg border px-3 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
            >
              Replace file
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => applyFile(null)}
              className="text-muted hover:text-foreground border-border-subtle hover:border-border-strong focus-visible:ring-accent/50 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {validationError ? (
        <p
          id={errorId}
          className="mt-3 text-sm text-red-600 dark:text-red-300/95"
          role="alert"
        >
          {validationError}
        </p>
      ) : null}
    </div>
  );
}