import type { DatasetProfile, PlannedOperation } from "./types";

function questionIncludes(question: string, patterns: string[]): boolean {
  const normalized = question.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

export function planAnalysisOperations(
  question: string,
  profiles: DatasetProfile[],
): PlannedOperation[] {
  if (profiles.length === 0) return [];

  const operations: PlannedOperation[] = [];

  for (const profile of profiles) {
    if (profile.rowCount === 0) continue;

    operations.push({
      kind: "overview",
      datasetLabel: profile.label,
      detail: "Dataset overview and column typing",
    });

    operations.push({
      kind: "missing_values",
      datasetLabel: profile.label,
      detail: "Missing value counts and percentages",
    });

    if (profile.numericColumns.length > 0) {
      operations.push({
        kind: "numeric_summary",
        datasetLabel: profile.label,
        detail: "Numeric summaries for detected numeric columns",
      });
    }

    const wantsGrouping = questionIncludes(question, [
      "by ",
      "group",
      "segment",
      "per ",
      "broken down",
      "compare",
    ]);
    if (
      wantsGrouping &&
      profile.numericColumns.length > 0 &&
      profile.categoricalColumns.length > 0
    ) {
      operations.push({
        kind: "grouped_aggregate",
        datasetLabel: profile.label,
        detail: "Grouped aggregation for a numeric measure by category",
      });
    }

    const wantsTrend = questionIncludes(question, [
      "trend",
      "over time",
      "month",
      "quarter",
      "year",
      "weekly",
      "daily",
      "time series",
    ]);
    if (
      wantsTrend &&
      profile.numericColumns.length > 0 &&
      profile.dateColumns.length > 0
    ) {
      operations.push({
        kind: "date_trend",
        datasetLabel: profile.label,
        detail: "Time-based aggregation for a numeric measure",
      });
    }

    const wantsRanking = questionIncludes(question, [
      "highest",
      "lowest",
      "top ",
      "bottom",
      "rank",
      "largest",
      "smallest",
      "maximum",
      "minimum",
      "best",
      "worst",
    ]);
    if (wantsRanking && profile.numericColumns.length > 0) {
      operations.push({
        kind: "ranking",
        datasetLabel: profile.label,
        detail: "Highest and lowest values for a numeric column",
      });
    } else if (
      !wantsGrouping &&
      !wantsTrend &&
      profile.numericColumns.length > 0
    ) {
      operations.push({
        kind: "ranking",
        datasetLabel: profile.label,
        detail: "Default high/low ranking for the primary numeric column",
      });
    }
  }

  return operations;
}