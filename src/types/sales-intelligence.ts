export type SalesKpiId =
  | "total_revenue"
  | "transaction_count"
  | "average_order_value"
  | "revenue_growth";

export type SalesKpi = {
  id: SalesKpiId;
  label: string;
  value: string;
  helperText?: string;
};

export type SalesChartPoint = {
  label: string;
  value: number;
};

export type SalesChartKind =
  | "revenue_over_time"
  | "regional_performance"
  | "product_performance";

export type SalesChartSeries = {
  kind: SalesChartKind;
  title: string;
  measureLabel: string;
  groupLabel?: string;
  points: SalesChartPoint[];
};

export type ColumnMissingStat = {
  column: string;
  missingCount: number;
  missingPercent: number;
};

export type SalesIntelligence = {
  datasetLabel: string;
  recordCount: number;
  revenueColumn?: string;
  dateColumn?: string;
  regionColumn?: string;
  productColumn?: string;
  kpis: SalesKpi[];
  charts: SalesChartSeries[];
  missingByColumn: ColumnMissingStat[];
  /** Factual notes about absent analytical dimensions (not data quality defects). */
  missingDimensions: string[];
};