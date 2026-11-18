import { SALES_ANALYSIS_QUESTION } from "@/lib/sales/constants";

export function isSalesAnalysisQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase();
  return (
    normalized === SALES_ANALYSIS_QUESTION.toLowerCase() ||
    normalized.includes("ai sales employee")
  );
}