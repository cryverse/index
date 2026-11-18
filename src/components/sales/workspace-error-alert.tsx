"use client";

import {
  CATEGORY_LABEL,
  type UserFacingError,
} from "@/lib/sales/user-messages";
import { useEffect, useRef } from "react";

type WorkspaceErrorAlertProps = {
  error: UserFacingError;
  onRetry?: () => void;
  onDismiss: () => void;
};

export function WorkspaceErrorAlert({
  error,
  onRetry,
  onDismiss,
}: WorkspaceErrorAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alertRef.current?.focus();
  }, []);

  return (
    <div
      ref={alertRef}
      tabIndex={-1}
      className="border-red-500/30 bg-red-500/8 mt-5 rounded-xl border px-4 py-4 outline-none sm:px-5"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-muted text-[11px] font-semibold tracking-wide uppercase">
        {CATEGORY_LABEL[error.category]}
      </p>
      <p className="text-foreground mt-1 text-sm font-medium text-pretty">
        {error.title}
      </p>
      {error.detail ? (
        <p className="text-muted mt-2 text-xs leading-relaxed whitespace-pre-wrap break-words">
          {error.detail}
        </p>
      ) : null}
      <p className="text-foreground/75 mt-3 text-sm leading-relaxed text-pretty">
        {error.recoveryHint}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="bg-accent hover:bg-accent/90 focus-visible:ring-accent/50 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors outline-none focus-visible:ring-2"
          >
            Retry analysis
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          className="border-border-strong hover:bg-surface focus-visible:ring-accent/50 rounded-lg border px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}