import { NextResponse } from "next/server";
import { runTabularAnalysis } from "@/lib/analysis/run-tabular-analysis";
import { runResearchAnalysis, ResearchAgentError } from "@/lib/ai/run-research";
import { MAX_QUESTION_LENGTH } from "@/lib/files/constants";
import { processUploadedFiles } from "@/lib/files/process-upload";
import type {
  ProcessedFileSummary,
  ResearchAgentResult,
  ResearchApiError,
  ResearchApiSuccess,
} from "@/types/research";

function errorResponse(error: ResearchApiError, status: number) {
  return NextResponse.json({ ok: false as const, error }, { status });
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
    const modelOutput = await runResearchAnalysis({
      question,
      fileContexts: contexts,
      analysisReport,
    });

    const generatedAt = new Date().toISOString();
    const mergedLimitations = [
      ...analysisReport.limitations,
      ...modelOutput.limitations,
    ].filter(
      (value, index, array) => array.indexOf(value) === index,
    );

    const result: ResearchAgentResult = {
      title: modelOutput.title,
      executiveSummary: modelOutput.executiveSummary,
      keyFindings: modelOutput.keyFindings,
      verifiedMetrics: analysisReport.verifiedMetrics,
      conclusions: modelOutput.conclusions,
      limitations: mergedLimitations,
      generatedAt,
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
        error.code === "MISSING_API_KEY" ? 503 : 502,
      );
    }

    return errorResponse(
      {
        code: "API_FAILURE",
        message: "The research request failed.",
        details: error instanceof Error ? error.message : undefined,
      },
      502,
    );
  }
}