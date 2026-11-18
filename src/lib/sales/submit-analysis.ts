import { SALES_ANALYSIS_QUESTION } from "@/lib/sales/constants";
import type {
  ResearchApiErrorCode,
  ResearchApiResponse,
  ResearchApiSuccess,
} from "@/types/research";

export type AnalysisSubmitResult =
  | { ok: true; data: ResearchApiSuccess }
  | {
      ok: false;
      message: string;
      code?: ResearchApiErrorCode;
      details?: string;
    };

export async function submitSalesAnalysis(
  file: File,
  signal?: AbortSignal,
): Promise<AnalysisSubmitResult> {
  const formData = new FormData();
  formData.set("question", SALES_ANALYSIS_QUESTION);
  formData.append("files", file);

  let response: Response;
  try {
    response = await fetch("/api/research", {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, message: "Analysis was cancelled." };
    }
    return {
      ok: false,
      message: "Could not reach the analysis service.",
    };
  }

  let payload: ResearchApiResponse;
  try {
    payload = (await response.json()) as ResearchApiResponse;
  } catch {
    return {
      ok: false,
      message: "Received an invalid response from the server.",
    };
  }

  if (!payload.ok) {
    return {
      ok: false,
      message: payload.error.message,
      code: payload.error.code,
      details: payload.error.details,
    };
  }

  return { ok: true, data: payload.data };
}