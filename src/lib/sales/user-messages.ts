import type { ResearchApiErrorCode } from "@/types/research";

export type UserErrorCategory = "file" | "network" | "ai" | "config" | "unknown";

export type UserFacingError = {
  title: string;
  detail?: string;
  recoveryHint: string;
  category: UserErrorCategory;
};

export function sanitizeClientErrorDetails(
  details: string | undefined,
): string | undefined {
  if (!details) return undefined;
  const trimmed = details.trim();
  if (!trimmed) return undefined;
  if (
    /stack trace|at\s+(?:\S+\s+)?\(.*:\d+:\d+\)|ECONNREFUSED|ENOTFOUND|^Error:/im.test(
      trimmed,
    )
  ) {
    return undefined;
  }
  if (trimmed.length > 600) {
    return `${trimmed.slice(0, 597)}…`;
  }
  return trimmed;
}

export function fileSelectionFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function mapAnalysisFailure(
  message: string,
  code?: ResearchApiErrorCode,
  details?: string,
): UserFacingError {
  const safeDetail = sanitizeClientErrorDetails(details);

  switch (code) {
    case "UNSUPPORTED_FILE":
      return {
        title: message || "This file type is not supported.",
        detail: safeDetail,
        recoveryHint: "Upload a CSV, XLSX, or XLS export within the size limit.",
        category: "file",
      };
    case "PARSE_ERROR":
      return {
        title: message || "The file could not be read.",
        detail: safeDetail,
        recoveryHint:
          "Check that the file opens correctly in Excel or a text editor, then try again.",
        category: "file",
      };
    case "INVALID_REQUEST":
      return {
        title: message || "The upload could not be processed.",
        detail: safeDetail,
        recoveryHint: "Choose a different file or remove and re-add your export.",
        category: "file",
      };
    case "MISSING_API_KEY":
      return {
        title: "Analysis is unavailable in this environment.",
        detail: undefined,
        recoveryHint:
          "The demo requires server configuration; KPI parsing may still work once configured.",
        category: "config",
      };
    case "RATE_LIMIT":
      return {
        title: "Too many requests. Please wait and try again.",
        detail: undefined,
        recoveryHint: "Your file is still selected — use Retry when ready.",
        category: "ai",
      };
    case "TIMEOUT":
      return {
        title: "Analysis took too long to complete.",
        detail: undefined,
        recoveryHint: "Try again with a smaller file or retry in a moment.",
        category: "ai",
      };
    case "QUOTA_EXCEEDED":
    case "API_FAILURE":
    case "AUTHENTICATION":
      return {
        title: "The AI analysis step could not be completed.",
        detail: safeDetail,
        recoveryHint:
          "Your upload may still be valid. Try again, or use a simpler export.",
        category: "ai",
      };
    default:
      break;
  }

  if (/cancelled/i.test(message)) {
    return {
      title: "Analysis was cancelled.",
      recoveryHint: "You can start again when ready.",
      category: "unknown",
    };
  }

  if (/could not reach|network|fetch/i.test(message)) {
    return {
      title: "Could not reach the analysis service.",
      detail: undefined,
      recoveryHint: "Check your connection and use Retry.",
      category: "network",
    };
  }

  if (/invalid response/i.test(message)) {
    return {
      title: "Received an unexpected response from the server.",
      detail: undefined,
      recoveryHint: "Try again. If this persists, use a different file.",
      category: "unknown",
    };
  }

  return {
    title: message || "Something went wrong during analysis.",
    detail: safeDetail,
    recoveryHint: "Your file is still selected — try again or choose another export.",
    category: "unknown",
  };
}

export const CATEGORY_LABEL: Record<UserErrorCategory, string> = {
  file: "File issue",
  network: "Connection",
  ai: "Analysis service",
  config: "Configuration",
  unknown: "Error",
};