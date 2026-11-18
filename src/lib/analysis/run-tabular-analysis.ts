import type { ParsedUploadContext } from "@/lib/files/types";
import { buildVerifiedAnalyticalContext } from "./analytical-context";
import { executeOperation, profileLookup } from "./calculations";
import { planAnalysisOperations } from "./plan";
import { profileDataset } from "./profile";
import type { TabularAnalysisReport } from "./types";

export function runTabularAnalysis(
  question: string,
  fileContexts: ParsedUploadContext[],
): TabularAnalysisReport {
  const datasets = fileContexts.flatMap((file) => file.tabularDatasets);
  if (datasets.length === 0) {
    return {
      operationsRun: [],
      verifiedMetrics: [],
      analysisText:
        "No tabular datasets were available for deterministic analysis. PDF-only or empty uploads were not analyzed as tables.",
      analyticalBrief:
        "VERIFIED SALES ANALYTICAL BRIEF: no tabular datasets were parsed.",
      limitations: [
        "Deterministic calculations were not run because no CSV/XLSX tables were parsed.",
      ],
    };
  }

  const profiles = datasets.map((dataset) => profileDataset(dataset));
  const operationsRun = planAnalysisOperations(question, profiles);

  const textBlocks: string[] = [
    "SERVER-CALCULATED ANALYSIS (authoritative; do not recalculate or alter these values):",
  ];
  const verifiedMetrics = [];
  const limitations: string[] = [];

  for (const profile of profiles) {
    if (profile.rowCount === 0) {
      limitations.push(`${profile.label} is empty and was excluded from calculations.`);
    }
  }

  const executed = new Set<string>();
  for (const operation of operationsRun) {
    const dedupeKey = `${operation.datasetLabel}:${operation.kind}`;
    if (executed.has(dedupeKey)) continue;
    executed.add(dedupeKey);

    const profile = profileLookup(profiles, operation.datasetLabel);
    if (!profile || profile.rowCount === 0) continue;

    const result = executeOperation(operation, profile, question);
    textBlocks.push(
      `\n[Operation: ${operation.kind}] ${operation.detail}`,
      ...result.lines,
    );
    verifiedMetrics.push(...result.metrics);
  }

  if (operationsRun.length === 0) {
    limitations.push(
      "No analysis operations were selected for the uploaded tabular data.",
    );
  }

  const analytical = buildVerifiedAnalyticalContext(profiles);
  const mergedLimitations = dedupeStrings([
    ...limitations,
    ...analytical.limitations,
  ]);

  return {
    operationsRun,
    verifiedMetrics: dedupeMetrics(verifiedMetrics),
    analysisText: textBlocks.join("\n"),
    analyticalBrief: analytical.brief,
    limitations: mergedLimitations,
  };
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeMetrics(
  metrics: TabularAnalysisReport["verifiedMetrics"],
): TabularAnalysisReport["verifiedMetrics"] {
  const seen = new Set<string>();
  return metrics.filter((metric) => {
    const key = `${metric.label}::${metric.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}