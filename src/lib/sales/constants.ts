import { MAX_UPLOAD_FILE_BYTES } from "@/lib/files/constants";

export const SALES_UPLOAD_ACCEPT = ".csv,.xlsx,.xls";

export const SALES_UPLOAD_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

/** Sent to `/api/research` so the user never has to write a prompt. */
export const SALES_ANALYSIS_QUESTION =
  "You are INDEX, an AI sales employee. Analyze the uploaded sales dataset using the VERIFIED SALES ANALYTICAL BRIEF: summarize performance, cite verified figures, identify material risks and opportunities, and recommend concrete next actions grounded in those numbers.";

export const PROCESSING_STAGES = [
  "Reading sales data",
  "Calculating performance",
  "Finding patterns",
  "Preparing recommendations",
] as const;

export const SAMPLE_DATA_PATH = "/test_sales.csv";
export const SAMPLE_DATA_FILENAME = "test_sales.csv";

export const SALES_UPLOAD_MAX_LABEL = `${Math.round(
  MAX_UPLOAD_FILE_BYTES / (1024 * 1024),
)} MB per file`;

export const SALES_UPLOAD_HINT =
  `CSV, XLSX, or XLS · one file per analysis · up to ${SALES_UPLOAD_MAX_LABEL}`;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateSalesUploadFile(file: File): string | null {
  if (file.size === 0) return "The file is empty.";
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    const mb = Math.round(MAX_UPLOAD_FILE_BYTES / (1024 * 1024));
    return `File exceeds the ${mb} MB limit.`;
  }

  const name = file.name.toLowerCase();
  const hasAllowedExtension = SALES_UPLOAD_EXTENSIONS.some((ext) =>
    name.endsWith(ext),
  );
  if (!hasAllowedExtension) {
    return "Use a CSV, XLSX, or XLS sales export.";
  }

  return null;
}