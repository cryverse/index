"use client";

import { AlertCircle, Loader2, Paperclip, Play } from "lucide-react";
import type { RefObject } from "react";
import type {
  ProcessedFileSummary,
  ResearchAgentResult,
  ResearchApiError,
} from "@/types/research";

type RunState = "idle" | "loading" | "complete" | "error";

type ResearchPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  examplePrompts: readonly string[];
  onExampleSelect: (prompt: string) => void;
  onRun: () => void;
  onAttachClick: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | null) => void;
  attachedLabel: string | null;
  runState: RunState;
  loadingStep: number;
  loadingSteps: readonly string[];
  result: ResearchAgentResult | null;
  processedFiles: ProcessedFileSummary[];
  error: ResearchApiError | null;
};

export function ResearchPanel({
  query,
  onQueryChange,
  examplePrompts,
  onExampleSelect,
  onRun,
  onAttachClick,
  inputRef,
  fileInputRef,
  onFilesSelected,
  attachedLabel,
  runState,
  loadingStep,
  loadingSteps,
  result,
  processedFiles,
  error,
}: ResearchPanelProps) {
  const canRun = query.trim().length > 0 && runState !== "loading";

  return (
    <section
      aria-labelledby="research-panel-title"
      className="rounded-2xl border border-border-strong bg-surface/70 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.75)]"
    >
      <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
        <h2
          id="research-panel-title"
          className="text-[10px] font-medium uppercase tracking-[0.18em] text-accent"
        >
          Research input
        </h2>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Research prompt</span>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            rows={4}
            placeholder="Ask INDEX to research, analyze, or compare your data..."
            className="min-h-[120px] w-full resize-y rounded-xl border border-border-subtle bg-background/70 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted/80 outline-none transition-colors focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            multiple
            accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => onFilesSelected(event.target.files)}
          />
          <button
            type="button"
            onClick={onAttachClick}
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-elevated/50 px-3 py-2 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" aria-hidden />
            Attach
          </button>
          {attachedLabel ? (
            <span className="truncate text-xs text-muted">{attachedLabel}</span>
          ) : null}
          <button
            type="button"
            onClick={onRun}
            disabled={!canRun}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-accent/60 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {runState === "loading" ? (
              <Loader2
                className="h-4 w-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
            Run Research
          </button>
        </div>

        <ExamplePrompts
          examplePrompts={examplePrompts}
          onExampleSelect={onExampleSelect}
        />

        {runState === "error" && error ? (
          <ResearchErrorState error={error} />
        ) : null}

        {runState === "loading" ? (
          <LoadingDemo steps={loadingSteps} activeIndex={loadingStep} />
        ) : null}

        {processedFiles.length > 0 ? (
          <ProcessedFilesSummary files={processedFiles} />
        ) : null}

        {runState === "complete" && result ? (
          <ResearchRunResult result={result} />
        ) : null}
      </div>
    </section>
  );
}

function ExamplePrompts({
  examplePrompts,
  onExampleSelect,
}: {
  examplePrompts: readonly string[];
  onExampleSelect: (prompt: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        Example prompts
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {examplePrompts.map((prompt) => (
          <li key={prompt}>
            <button
              type="button"
              onClick={() => onExampleSelect(prompt)}
              className="rounded-full border border-border-subtle bg-background/40 px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-accent/30 hover:bg-accent-muted hover:text-foreground"
            >
              {prompt}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResearchErrorState({ error }: { error: ResearchApiError }) {
  const titleByCode: Record<ResearchApiError["code"], string> = {
    MISSING_API_KEY: "OpenAI is not configured",
    UNSUPPORTED_FILE: "Unsupported file type",
    INVALID_REQUEST: "Invalid research request",
    PARSE_ERROR: "Could not parse uploaded files",
    API_FAILURE: "Research request failed",
  };

  return (
    <div
      className="rounded-xl border border-red-500/30 bg-red-500/10 p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-red-100">
            {titleByCode[error.code]}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-red-100/80">
            {error.message}
          </p>
          {error.details ? (
            <pre className="mt-3 overflow-x-auto rounded-lg border border-red-500/20 bg-black/20 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-red-100/75">
              {error.details}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LoadingDemo({
  steps,
  activeIndex,
}: {
  steps: readonly string[];
  activeIndex: number;
}) {
  return (
    <div
      className="rounded-xl border border-border-subtle bg-background/50 p-4"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        Running research
      </p>
      <ul className="mt-3 space-y-2">
        {steps.map((step, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex;
          return (
            <li
              key={step}
              className={`flex items-center gap-2 text-sm ${
                active
                  ? "text-foreground"
                  : done
                    ? "text-muted"
                    : "text-muted/60"
              }`}
            >
              {active ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-accent motion-reduce:animate-none"
                  aria-hidden
                />
              ) : (
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    done ? "bg-accent" : "bg-white/20"
                  }`}
                  aria-hidden
                />
              )}
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProcessedFilesSummary({
  files,
}: {
  files: ProcessedFileSummary[];
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-background/40 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        Uploaded file processing
      </p>
      <ul className="mt-3 space-y-2">
        {files.map((file) => (
          <li
            key={`${file.name}-${file.sizeBytes}-${file.status}`}
            className="rounded-lg border border-border-subtle bg-surface/50 px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-foreground">{file.name}</span>
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  file.status === "ok" ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {file.status === "ok" ? "Parsed" : "Failed"}
              </span>
            </div>
            {file.summary ? (
              <p className="mt-1 text-xs text-muted">{file.summary}</p>
            ) : null}
            {file.error ? (
              <p className="mt-1 text-xs text-red-200/80">{file.error}</p>
            ) : null}
            {file.warnings?.length ? (
              <p className="mt-1 text-xs text-muted">
                {file.warnings.join(" ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResearchRunResult({ result }: { result: ResearchAgentResult }) {
  const generatedAt = new Date(result.generatedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="rounded-xl border border-accent/25 bg-accent-muted/40 p-4 motion-safe:animate-[fade-up_320ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none">
      <p className="text-[10px] font-medium uppercase tracking-wider text-accent">
        Research result
      </p>
      <h3 className="mt-2 text-base font-medium text-foreground">{result.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {result.executiveSummary}
      </p>

      {result.verifiedMetrics.length > 0 ? (
        <MetricsBlock
          title="Verified metrics"
          subtitle="Calculated on the server from uploaded tabular data"
          metrics={result.verifiedMetrics}
        />
      ) : null}

      <ResultSection
        title="Key findings"
        subtitle="Interpreted by the AI from provided data and verified calculations"
        items={result.keyFindings}
      />

      <ResultSection
        title="Conclusions"
        subtitle="Interpretive synthesis, not newly calculated metrics"
        items={result.conclusions}
      />
      <ResultSection
        title="Data limitations"
        items={result.limitations}
        muted
      />

      <p className="mt-4 font-mono text-[10px] text-muted">
        Generated {generatedAt}
      </p>
    </div>
  );
}

function MetricsBlock({
  title,
  subtitle,
  metrics,
}: {
  title: string;
  subtitle?: string;
  metrics: ResearchAgentResult["verifiedMetrics"];
}) {
  return (
    <div className="mt-5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-accent">
        {title}
      </p>
      {subtitle ? (
        <p className="mt-1 text-xs text-muted">{subtitle}</p>
      ) : null}
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <li
            key={`${metric.label}-${metric.value}`}
            className="rounded-lg border border-border-subtle bg-background/50 px-3 py-2"
          >
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {metric.value}
            </p>
            {metric.context ? (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {metric.context}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultSection({
  title,
  subtitle,
  items,
  muted = false,
}: {
  title: string;
  subtitle?: string;
  items: string[];
  muted?: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {title}
      </p>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-lg border border-border-subtle bg-background/50 px-3 py-2 text-sm leading-relaxed ${
              muted ? "text-muted" : "text-foreground/90"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}