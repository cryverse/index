"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ResearchCardItem } from "./types";
import { StatusBadge } from "./status-badge";

type ResearchDetailDialogProps = {
  item: ResearchCardItem | null;
  onClose: () => void;
};

export function ResearchDetailDialog({
  item,
  onClose,
}: ResearchDetailDialogProps) {
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const Icon = item.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="research-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 motion-safe:animate-[fade-in_180ms_ease-out] motion-reduce:animate-none"
        aria-label="Close research detail"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border-strong bg-surface-elevated shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] motion-safe:animate-[fade-up_280ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-background/60 text-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="research-detail-title"
                className="text-base font-medium text-foreground"
              >
                {item.title}
              </h2>
              <p className="mt-1 text-xs text-muted">{item.date}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-muted transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-xs text-muted">Sample research record</span>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Objective
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {item.detail.objective}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {item.detail.summary}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Key findings
            </p>
            <ul className="mt-3 space-y-2">
              {item.detail.findings.map((finding) => (
                <li
                  key={finding}
                  className="rounded-lg border border-border-subtle bg-background/40 px-3 py-2 text-sm leading-relaxed text-foreground/90"
                >
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}