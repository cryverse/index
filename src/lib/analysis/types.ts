import type { ResearchMetric } from "@/types/research";
import type { TabularDataset } from "@/lib/files/tabular";

export type ColumnKind = "number" | "string" | "date" | "boolean" | "empty";

export type ColumnProfile = {
  name: string;
  kind: ColumnKind;
  nonEmptyCount: number;
  missingCount: number;
  missingPercent: number;
};

export type DatasetProfile = {
  dataset: TabularDataset;
  label: string;
  rowCount: number;
  columns: ColumnProfile[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
};

export type AnalysisOperationKind =
  | "overview"
  | "numeric_summary"
  | "missing_values"
  | "grouped_aggregate"
  | "date_trend"
  | "ranking";

export type PlannedOperation = {
  kind: AnalysisOperationKind;
  datasetLabel: string;
  detail: string;
};

export type TabularAnalysisReport = {
  operationsRun: PlannedOperation[];
  verifiedMetrics: ResearchMetric[];
  analysisText: string;
  limitations: string[];
};