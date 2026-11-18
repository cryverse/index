import { NextResponse } from "next/server";
import { buildSalesIntelligence } from "@/lib/analysis/sales-intelligence";
import { dedupeLimitations } from "@/lib/sales/presentation";
import { sanitizeClientErrorDetails } from "@/lib/sales/user-messages";
import { profileDataset } from "@/lib/analysis/profile";
import { runTabularAnalysis } from "@/lib/analysis/run-tabular-analysis";
import { runResearchAnalysis, ResearchAgentError } from "@/lib/ai/run-research";
import { MAX_QUESTION_LENGTH } from "@/lib/files/constants";
import { processUploadedFiles } from "@/lib/files/process-upload";
import type {
  ProcessedFileSummary,
  ResearchAgentResult,
  ResearchApiError,
  ResearchApiErrorCode,
  ResearchApiSuccess,
} from "@/types/research";

export const maxDuration = 120;

function errorResponse(error: ResearchApiError, status: number) {
  return NextResponse.json(
    {
      ok: false as const,
      error: {
        ...error,
        details: sanitizeClientErrorDetails(error.details),
      },
    },
    { status },
  );
}

function providerErrorStatus(code: ResearchApiErrorCode): number {
  switch (code) {
    case "MISSING_API_KEY":
      return 503;
    case "INVALID_REQUEST":
      return 400;
    case "RATE_LIMIT":
      return 429;
    case "TIMEOUT":
      return 504;
    case "AUTHENTICATION":
    case "QUOTA_EXCEEDED":
    case "API_FAILURE":
      return 502;
    default:
      return 502;
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return errorResponse(
      {
        code: "MISSING_API_KEY",
        message:
          "Research is unavailable because OPENAI_API_KEY is not configured.",
      },
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message: "Expected multipart form data with a research question.",
      },
      400,
    );
  }

  const rawQuestion = formData.get("question");
  if (typeof rawQuestion !== "string") {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message: "A research question is required.",
      },
      400,
    );
  }

  const question = rawQuestion.trim();
  if (!question) {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message: "A research question is required.",
      },
      400,
    );
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message: `Research questions must be ${MAX_QUESTION_LENGTH} characters or fewer.`,
      },
      400,
    );
  }

  const fileEntries = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (fileEntries.some((file) => file.size === 0)) {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message: "One or more uploaded files are empty.",
      },
      400,
    );
  }

  let uploadResult;
  try {
    uploadResult = await processUploadedFiles(fileEntries);
  } catch (error) {
    return errorResponse(
      {
        code: "INVALID_REQUEST",
        message:
          error instanceof Error
            ? error.message
            : "The upload request is invalid.",
      },
      400,
    );
  }

  const { contexts, failures } = uploadResult;

  if (fileEntries.length > 0 && contexts.length === 0) {
    return errorResponse(
      {
        code: failures.some((file) => file.error.includes("Unsupported"))
          ? "UNSUPPORTED_FILE"
          : "PARSE_ERROR",
        message: "None of the uploaded files could be processed.",
        details: failures.map((file) => `${file.name}: ${file.error}`).join("\n"),
      },
      422,
    );
  }

  const summaries: ProcessedFileSummary[] = [
    ...contexts.map((file) => ({
      name: file.name,
      kind: file.kind,
      sizeBytes: file.sizeBytes,
      status: "ok" as const,
      summary: file.summary,
      warnings: file.warnings.length ? file.warnings : undefined,
    })),
    ...failures.map((file) => ({
      name: file.name,
      sizeBytes: file.sizeBytes,
      status: "error" as const,
      error: file.error,
    })),
  ];

  try {
    const analysisReport = runTabularAnalysis(question, contexts);
    const tabularDatasets = contexts.flatMap((file) => file.tabularDatasets);
    const intelligence = buildSalesIntelligence(
      tabularDatasets.map((dataset) => profileDataset(dataset)),
    );
    const modelOutput = await runResearchAnalysis({
      question,
      fileContexts: contexts,
      analysisReport,
    });

    const generatedAt = new Date().toISOString();
    const uploadWarnings = contexts.flatMap((context) => context.warnings);
    const mergedLimitations = dedupeLimitations([
      ...uploadWarnings,
      ...analysisReport.limitations,
      ...modelOutput.limitations,
    ]);

    const result: ResearchAgentResult = {
      title: modelOutput.title,
      executiveSummary: modelOutput.executiveSummary,
      keyFindings: modelOutput.keyFindings,
      verifiedMetrics: analysisReport.verifiedMetrics,
      recommendations: modelOutput.recommendations,
      conclusions: modelOutput.recommendations.map(
        (item) =>
          `Action: ${item.action} | Supported by: ${item.supportedBy} | Intended outcome: ${item.intendedOutcome}`,
      ),
      limitations: mergedLimitations,
      generatedAt,
      intelligence,
    };

    const payload: ResearchApiSuccess = { result, files: summaries };
    return NextResponse.json({ ok: true as const, data: payload });
  } catch (error) {
    if (error instanceof ResearchAgentError) {
      return errorResponse(
        {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        providerErrorStatus(error.code),
      );
    }

    return errorResponse(
      {
        code: "API_FAILURE",
        message: "The research request failed.",
      },
      502,
    );
  }
}