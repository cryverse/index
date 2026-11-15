import {
  researchJsonSchema,
  researchOutputSchema,
  type ResearchModelOutput,
} from "./research-schema";
import { RESEARCH_SYSTEM_PROMPT } from "./prompts";
import { getOpenAIClient, getOpenAIModel } from "./openai-client";
import type { ParsedUploadContext } from "@/lib/files/types";
import { buildModelFileContext } from "@/lib/files/process-upload";
import type { TabularAnalysisReport } from "@/lib/analysis/types";

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
    analysisReport.analysisText
      ? `\n${analysisReport.analysisText}`
      : "\nNo server-side tabular calculations were produced.",
    analysisReport.limitations.length
      ? `\nServer data limitations:\n${analysisReport.limitations
          .map((item) => `- ${item}`)
          .join("\n")}`
      : "",
    "\nProvide interpretation only. Do not output numeric metrics; those are returned separately from the server.",
  ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.2,
      messages: [
        { role: "system", content: RESEARCH_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: researchJsonSchema,
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new ResearchAgentError(
        "API_FAILURE",
        "The AI provider returned an empty response.",
      );
    }

    return researchOutputSchema.parse(JSON.parse(content));
  } catch (error) {
    if (error instanceof ResearchAgentError) throw error;
    throw new ResearchAgentError(
      "API_FAILURE",
      "The research request failed. Check your API configuration and try again.",
      error instanceof Error ? error.message : undefined,
    );
  }
}

export class ResearchAgentError extends Error {
  constructor(
    public readonly code: "MISSING_API_KEY" | "API_FAILURE",
    message: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "ResearchAgentError";
  }
}