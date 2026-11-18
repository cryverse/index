"use client";

import { PROCESSING_STAGES } from "@/lib/sales/constants";
import { Loader2 } from "lucide-react";

type AnalysisProgressProps = {
  activeStageIndex: number;
  fileName?: string;
  onCancel?: () => void;
};

export function AnalysisProgress({
  activeStageIndex,
  fileName,
  onCancel,
}: AnalysisProgressProps) {
  const activeLabel =
    PROCESSING_STAGES[
      Math.min(activeStageIndex, PROCESSING_STAGES.length - 1)
    ];

  return (
    <section
      className="border-border-subtle bg-surface-elevated/60 w-full rounded-2xl border px-5 py-6 sm:px-6 sm:py-8"
      aria-busy="true"
      aria-live="polite"
      aria-label="Analysis in progress"
    >
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Loader2
            className="text-accent mt-0.5 h-5 w-5 shrink-0 animate-spin"
            strokeWidth={1.75}
            aria-hidden
          />
          <div>
            <p className="text-foreground text-sm font-medium">
              Analyzing sales data
            </p>
            <p className="text-muted mt-1 text-xs leading-relaxed">
              Currently: {activeLabel}. Steps advance while work is in progress
              — timing varies with file size and AI response.
            </p>
            {fileName ? (
              <p className="text-muted mt-2 text-xs break-all">
                File: <span className="text-foreground/80">{fileName}</span>
              </p>
            ) : null}
          </div>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="border-border-strong hover:bg-surface focus-visible:ring-accent/50 shrink-0 self-start rounded-lg border px-3 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2"
          >
            Cancel
          </button>
        ) : null}
      </div>
      <ol className="space-y-3">
        {PROCESSING_STAGES.map((label, index) => {
          const isComplete = index < activeStageIndex;
          const isActive = index === activeStageIndex;

          return (
            <li
              key={label}
              className={[
                "flex items-center gap-3 text-sm transition-colors",
                isComplete
                  ? "text-muted"
                  : isActive
                    ? "text-foreground font-medium"
                    : "text-muted/50",
              ].join(" ")}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                  isComplete
                    ? "border-accent/40 bg-accent-muted text-accent"
                    : isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border-subtle",
                ].join(" ")}
                aria-hidden
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}