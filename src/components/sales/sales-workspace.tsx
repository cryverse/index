"use client";

import { AnalysisProgress } from "@/components/sales/analysis-progress";
import { AnalysisResults } from "@/components/sales/analysis-results";
import { FileUploadZone } from "@/components/sales/file-upload-zone";
import { WorkspaceErrorAlert } from "@/components/sales/workspace-error-alert";
import {
  PROCESSING_STAGES,
  SAMPLE_DATA_FILENAME,
  SAMPLE_DATA_PATH,
} from "@/lib/sales/constants";
import { submitSalesAnalysis } from "@/lib/sales/submit-analysis";
import {
  mapAnalysisFailure,
  type UserFacingError,
} from "@/lib/sales/user-messages";
import type { ResearchAgentResult } from "@/types/research";
import { useCallback, useEffect, useRef, useState } from "react";

type WorkspacePhase = "idle" | "processing" | "success" | "error";

export function SalesWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState<string>("Uploaded dataset");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userError, setUserError] = useState<UserFacingError | null>(null);
  const [phase, setPhase] = useState<WorkspacePhase>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<ResearchAgentResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const isProcessing = phase === "processing";
  const blockingValidation = Boolean(
    validationError &&
      !/already selected|using the first file/i.test(validationError),
  );
  const canAnalyze = Boolean(file) && !isProcessing && !blockingValidation;
  const showingResults = phase === "success" && result != null;

  const handleFileChange = useCallback(
    (next: File | null, error: string | null) => {
      setFile(next);
      setValidationError(error);
      if (next) {
        setUserError(null);
      }
    },
    [],
  );

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current += 1;
    setPhase("idle");
    setStageIndex(0);
    setResult(null);
  }, []);

  const dismissError = useCallback(() => {
    setUserError(null);
    if (phase === "error") setPhase("idle");
  }, [phase]);

  const loadSampleData = async () => {
    if (isProcessing) return;
    setUserError(null);

    try {
      const response = await fetch(SAMPLE_DATA_PATH);
      if (!response.ok) {
        setValidationError("Sample data could not be loaded.");
        return;
      }
      const blob = await response.blob();
      const sample = new File([blob], SAMPLE_DATA_FILENAME, {
        type: "text/csv",
      });
      handleFileChange(sample, null);
    } catch {
      setValidationError("Sample data could not be loaded.");
    }
  };

  const runAnalysis = useCallback(async () => {
    if (!file || isProcessing || blockingValidation) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setPhase("processing");
    setStageIndex(0);
    setUserError(null);
    setResult(null);
    setDatasetName(file.name);

    const outcome = await submitSalesAnalysis(file, controller.signal);

    if (controller.signal.aborted) return;
    if (requestId !== requestIdRef.current) return;

    if (!outcome.ok) {
      setStageIndex(0);
      setPhase("error");
      setUserError(
        mapAnalysisFailure(outcome.message, outcome.code, outcome.details),
      );
      return;
    }

    setStageIndex(PROCESSING_STAGES.length - 1);
    setResult(outcome.data.result);
    setPhase("success");
    abortRef.current = null;
  }, [file, isProcessing, blockingValidation]);

  const startOver = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    requestIdRef.current += 1;
    setPhase("idle");
    setStageIndex(0);
    setResult(null);
    setUserError(null);
    setFile(null);
    setValidationError(null);
    setDatasetName("Uploaded dataset");
  }, []);

  useEffect(() => {
    if (!isProcessing) return;

    const interval = window.setInterval(() => {
      setStageIndex((current) =>
        Math.min(current + 1, PROCESSING_STAGES.length - 2),
      );
    }, 1600);

    return () => window.clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (!isProcessing) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelAnalysis();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isProcessing, cancelAnalysis]);

  useEffect(() => {
    if (phase === "success" && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, []);

  const shellWidth = showingResults ? "max-w-6xl" : "max-w-2xl";

  return (
    <div
      className={`mx-auto flex w-full max-w-full flex-col px-4 py-10 sm:px-6 sm:py-14 ${shellWidth}`}
    >
      <header className="mb-8 flex flex-col gap-3 sm:mb-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-foreground text-sm font-semibold tracking-[0.2em] uppercase">
              INDEX
            </span>
            <span className="bg-accent/80 h-1 w-1 rounded-full" aria-hidden />
            <span className="text-muted inline-flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-35" />
                <span className="bg-accent relative inline-flex h-2 w-2 rounded-full" />
              </span>
              AI Sales Employee
            </span>
          </div>
        </div>

        {!showingResults ? (
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Turn your sales data into decisions.
            </h1>
            <p className="text-muted mt-3 max-w-xl text-base leading-relaxed text-pretty">
              Upload your sales export. INDEX verifies the numbers, charts
              performance, and explains what to do next.
            </p>
          </div>
        ) : null}
      </header>

      {!showingResults && !isProcessing ? (
        <div className="space-y-5">
          <FileUploadZone
            file={file}
            disabled={isProcessing}
            validationError={validationError}
            onFileChange={handleFileChange}
          />

          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={!canAnalyze}
              onClick={() => void runAnalysis()}
              aria-busy={isProcessing}
              className={[
                "w-full rounded-xl px-6 py-3.5 text-sm font-medium transition-colors",
                "focus-visible:ring-accent/50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
                canAnalyze
                  ? "bg-accent hover:bg-accent/90 text-white shadow-[0_0_24px_-6px_var(--accent-glow)]"
                  : "bg-surface-elevated text-muted border-border-subtle cursor-not-allowed border",
              ].join(" ")}
            >
              Analyze Sales
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => void loadSampleData()}
              className="text-muted hover:text-foreground focus-visible:ring-accent/50 rounded-lg py-2 text-center text-sm transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
            >
              Try with sample data
            </button>
          </div>
        </div>
      ) : null}

      {isProcessing ? (
        <div className="space-y-5">
          <FileUploadZone
            file={file}
            disabled
            validationError={null}
            onFileChange={handleFileChange}
          />
          <AnalysisProgress
            activeStageIndex={stageIndex}
            fileName={file?.name}
            onCancel={cancelAnalysis}
          />
        </div>
      ) : null}

      {userError ? (
        <WorkspaceErrorAlert
          error={userError}
          onRetry={
            file && !blockingValidation ? () => void runAnalysis() : undefined
          }
          onDismiss={dismissError}
        />
      ) : null}

      {showingResults ? (
        <div ref={resultsRef} className="mt-2">
          <AnalysisResults
            result={result}
            datasetName={datasetName}
            onStartOver={startOver}
          />
        </div>
      ) : null}
    </div>
  );
}