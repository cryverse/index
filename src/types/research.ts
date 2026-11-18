import type { SalesIntelligence } from "@/types/sales-intelligence";

export type SupportedUploadKind = "csv" | "xlsx" | "pdf";

export type ResearchApiErrorCode =
  | "MISSING_API_KEY"
  | "UNSUPPORTED_FILE"
  | "INVALID_REQUEST"
  | "PARSE_ERROR"
  | "AUTHENTICATION"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT"
  | "API_FAILURE";

export type ResearchApiError = {
  code: ResearchApiErrorCode;
  message: string;
  details?: string;
};

export type ResearchMetric = {
  label: string;
  value: string;
  context: string;
};

export type ResearchRecommendation = {
  action: string;
  supportedBy: string;
  intendedOutcome: string;
};

export type ResearchAgentResult = {
  title: string;
  executiveSummary: string;
  keyFindings: string[];
  verifiedMetrics: ResearchMetric[];
  recommendations: ResearchRecommendation[];
  /** Legacy string list for older dashboard views. */
  conclusions: string[];
  limitations: string[];
  generatedAt: string;
  /** Server-computed KPIs and chart series for the sales workspace UI. */
  intelligence: SalesIntelligence | null;
};

export type ProcessedFileSummary = {
  name: string;
  sizeBytes: number;
  status: "ok" | "error";
  kind?: SupportedUploadKind;
  summary?: string;
  error?: string;
  warnings?: string[];
};

export type ResearchApiSuccess = {
  result: ResearchAgentResult;
  files: ProcessedFileSummary[];
};

export type ResearchApiResponse =
  | { ok: true; data: ResearchApiSuccess }
  | { ok: false; error: ResearchApiError };