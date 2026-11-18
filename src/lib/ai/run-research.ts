import { normalizeResearchModelPayload } from "./normalize-research-model-output";
import {
  researchJsonSchema,
  researchOutputSchema,
  type ResearchModelOutput,
} from "./research-schema";
import { RESEARCH_SYSTEM_PROMPT } from "./prompts";
import { SALES_INTERPRETATION_SYSTEM_PROMPT } from "./sales-prompts";
import { isSalesAnalysisQuestion } from "@/lib/sales/is-sales-question";
import {
  getOpenAIClient,
  getOpenAIModel,
  getOpenAIRequestTimeoutMs,
} from "./openai-client";
import { mapOpenAIError } from "./openai-errors";
import type { ParsedUploadContext } from "@/lib/files/types";
import { buildModelFileContext } from "@/lib/files/process-upload";
import type { TabularAnalysisReport } from "@/lib/analysis/types";
import { filterValidRecommendations } from "@/lib/sales/recommendation-validation";
import type { ResearchApiErrorCode } from "@/types/research";

export async function runResearchAnalysis({
  question,
  fileContexts,
  analysisReport,
}: {
  question: string;
  fileContexts: ParsedUploadContext[];
  analysisReport: TabularAnalysisReport;
}): Promise<ResearchModelOutput> {
  const client = getOpenAIClient();
  if (!client) {
    throw new ResearchAgentError(
      "MISSING_API_KEY",
      "OpenAI is not configured. Add OPENAI_API_KEY to your environment.",
    );
  }

  const fileContext = buildModelFileContext(fileContexts);
  const operationsList =
    analysisReport.operationsRun.length > 0
      ? analysisReport.operationsRun
          .map(
            (operation) =>
              `- ${operation.kind} on ${operation.datasetLabel}: ${operation.detail}`,
          )
          .join("\n")
      : "- none";

  const userPrompt = [
    `Research question:\n${question}`,
    fileContext
      ? `\nExtracted file data:\n${fileContext}`
      : "\nNo files were successfully parsed for this request.",
    fileContexts.length
      ? `\nSuccessfully parsed files: ${fileContexts
          .map((file) => `${file.name} (${file.kind})`)
          .join(", ")}`
      : "",
    `\nExecuted deterministic operations:\n${operationsList}`,
    analysisReport.analyticalBrief
      ? `\n${analysisReport.analyticalBrief}`
      : "\nNo verified sales analytical brief was produced.",
    analysisReport.analysisText
      ? `\n${analysisReport.analysisText}`
      : "\nNo supplementary server-side operation log was produced.",
    analysisReport.limitations.length
      ? `\nServer data limitations:\n${analysisReport.limitations
          .map((item) => `- ${item}`)
          .join("\n")}`
      : "",
    isSalesAnalysisQuestion(question)
      ? "\nWrite the narrative for a sales owner. Cite verified brief figures in executive summary, key findings, and recommendations."
      : "\nProvide interpretation only. Do not output numeric metrics; those are returned separately from the server.",
  ].join("\n");

  const systemPrompt = isSalesAnalysisQuestion(question)
    ? SALES_INTERPRETATION_SYSTEM_PROMPT
    : RESEARCH_SYSTEM_PROMPT;

  const requestTimeoutMs = getOpenAIRequestTimeoutMs();

  try {
    const completion = await client.chat.completions.create(
      {
        model: getOpenAIModel(),
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: researchJsonSchema,
        },
      },
      {
        timeout: requestTimeoutMs,
        maxRetries: 0,
      },
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new ResearchAgentError(
        "API_FAILURE",
        "The AI provider returned an empty response.",
      );
    }

    const raw = JSON.parse(content) as unknown;
    const parsed = researchOutputSchema.parse(normalizeResearchModelPayload(raw));

    if (isSalesAnalysisQuestion(question)) {
      return {
        ...parsed,
        recommendations: filterValidRecommendations(
          parsed.recommendations,
          analysisReport.analyticalBrief,
        ),
      };
    }

    return {
      ...parsed,
      recommendations: parsed.recommendations.filter((item) =>
        item.action.trim() && item.supportedBy.trim() && item.intendedOutcome.trim(),
      ),
    };
  } catch (error) {
    if (error instanceof ResearchAgentError) throw error;

    const mapped = mapOpenAIError(error);
    throw new ResearchAgentError(
      mapped.code,
      mapped.message,
      mapped.details,
    );
  }
}

export class ResearchAgentError extends Error {
  constructor(
    public readonly code: ResearchApiErrorCode,
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "ResearchAgentError";
  }
}