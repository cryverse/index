export type SupportedUploadKind = "csv" | "xlsx" | "pdf";

export type ResearchApiErrorCode =
  | "MISSING_API_KEY"
  | "UNSUPPORTED_FILE"
  | "INVALID_REQUEST"
  | "PARSE_ERROR"
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

export type ResearchAgentResult = {
  title: string;
  executiveSummary: string;
  keyFindings: string[];
  verifiedMetrics: ResearchMetric[];
  conclusions: string[];
  limitations: string[];
  generatedAt: string;
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