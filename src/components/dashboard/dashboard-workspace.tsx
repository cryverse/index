"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DATA_SOURCES,
  EXAMPLE_PROMPTS,
  RECENT_RESEARCH,
} from "./sample-data";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { ResearchPanel } from "./research-panel";
import { RecentResearchSection } from "./recent-research-section";
import { DataSourcesSection } from "./data-sources-section";
import { ResearchDetailDialog } from "./research-detail-dialog";
import type { DashboardNavId, ResearchCardItem } from "./types";
import type {
  ProcessedFileSummary,
  ResearchAgentResult,
  ResearchApiError,
  ResearchApiResponse,
} from "@/types/research";

const LOADING_STEPS = [
  "Parsing uploaded files",
  "Preparing analysis context",
  "Generating research with INDEX",
] as const;

type RunState = "idle" | "loading" | "complete" | "error";

export function DashboardWorkspace() {
  const [activeNav, setActiveNav] = useState<DashboardNavId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [attachedLabel, setAttachedLabel] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ResearchAgentResult | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFileSummary[]>(
    [],
  );
  const [error, setError] = useState<ResearchApiError | null>(null);
  const [selectedResearch, setSelectedResearch] =
    useState<ResearchCardItem | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<number | null>(null);

  const clearLoadingInterval = useCallback(() => {
    if (loadingIntervalRef.current != null) {
      window.clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearLoadingInterval, [clearLoadingInterval]);

  useEffect(() => {
    if (runState !== "loading") {
      clearLoadingInterval();
      return;
    }

    loadingIntervalRef.current = window.setInterval(() => {
      setLoadingStep((step) => Math.min(step + 1, LOADING_STEPS.length - 1));
    }, 1400);

    return () => clearLoadingInterval();
  }, [clearLoadingInterval, runState]);

  const focusResearchInput = useCallback(() => {
    setActiveNav("overview");
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  const handleNewResearch = () => {
    setMobileSidebarOpen(false);
    setRunState("idle");
    setResult(null);
    setProcessedFiles([]);
    setError(null);
    setLoadingStep(0);
    focusResearchInput();
  };

  const handleExampleSelect = (prompt: string) => {
    setQuery(prompt);
    setRunState("idle");
    setResult(null);
    setError(null);
    focusResearchInput();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setAttachedFiles([]);
      setAttachedLabel(null);
      return;
    }

    const nextFiles = [...files];
    setAttachedFiles(nextFiles);
    const names = nextFiles.map((file) => file.name).join(", ");
    setAttachedLabel(
      nextFiles.length === 1
        ? `Attached: ${names}`
        : `Attached (${nextFiles.length}): ${names}`,
    );
    setRunState("idle");
    setResult(null);
    setError(null);
  };

  const handleRunResearch = async () => {
    if (!query.trim() || runState === "loading") return;

    clearLoadingInterval();
    setRunState("loading");
    setResult(null);
    setProcessedFiles([]);
    setError(null);
    setLoadingStep(0);

    const formData = new FormData();
    formData.append("question", query.trim());
    for (const file of attachedFiles) {
      formData.append("files", file);
    }

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ResearchApiResponse;

      if (!response.ok || !payload.ok) {
        setError(
          payload.ok
            ? {
                code: "API_FAILURE",
                message: "The research request failed.",
              }
            : payload.error,
        );
        setRunState("error");
        return;
      }

      setResult(payload.data.result);
      setProcessedFiles(payload.data.files);
      setRunState("complete");
      setLoadingStep(LOADING_STEPS.length - 1);
    } catch {
      setError({
        code: "API_FAILURE",
        message: "Could not reach the research service. Try again in a moment.",
      });
      setRunState("error");
    }
  };

  return (
    <div className="dashboard-app flex min-h-full min-w-0 flex-col bg-background text-foreground lg:flex-row">
      <Sidebar
        activeNav={activeNav}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onNavChange={setActiveNav}
        onNewResearch={handleNewResearch}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onMobileOpenChange={setMobileSidebarOpen}
      />

      <main className="min-w-0 flex-1 overflow-x-clip">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          {activeNav === "overview" ? (
            <div className="space-y-8">
              <DashboardHeader agentReady={runState !== "loading"} />
              <ResearchPanel
                query={query}
                onQueryChange={setQuery}
                examplePrompts={EXAMPLE_PROMPTS}
                onExampleSelect={handleExampleSelect}
                onRun={handleRunResearch}
                onAttachClick={handleAttachClick}
                inputRef={inputRef}
                fileInputRef={fileInputRef}
                onFilesSelected={handleFilesSelected}
                attachedLabel={attachedLabel}
                runState={runState}
                loadingStep={loadingStep}
                loadingSteps={LOADING_STEPS}
                result={result}
                processedFiles={processedFiles}
                error={error}
              />
              <RecentResearchSection
                items={RECENT_RESEARCH}
                onSelect={setSelectedResearch}
              />
              <DataSourcesSection items={DATA_SOURCES} />
            </div>
          ) : null}

          {activeNav === "history" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Research History
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Browse sample research records in this portfolio workspace.
                </p>
              </div>
              <RecentResearchSection
                items={RECENT_RESEARCH}
                onSelect={setSelectedResearch}
                compact
              />
            </div>
          ) : null}

          {activeNav === "sources" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Data Sources
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Upload CSV, XLSX, or PDF files when running research. Files are
                  processed in-memory and not stored permanently.
                </p>
              </div>
              <DataSourcesSection items={DATA_SOURCES} expanded />
            </div>
          ) : null}
        </div>
      </main>

      <ResearchDetailDialog
        item={selectedResearch}
        onClose={() => setSelectedResearch(null)}
      />
    </div>
  );
}