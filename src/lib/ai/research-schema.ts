import { z } from "zod";
import {
  modelRecommendationJsonSchema,
  modelRecommendationSchema,
} from "./recommendation-schema";

export const researchOutputSchema = z.object({
  title: z.string().min(1),
  executiveSummary: z.string().min(1),
  keyFindings: z.array(z.string()).min(1).max(6),
  recommendations: z.array(modelRecommendationSchema).max(4),
  limitations: z.array(z.string()).min(1).max(8),
});

export type ResearchModelOutput = z.infer<typeof researchOutputSchema>;

export const researchJsonSchema = {
  name: "index_research_result",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      executiveSummary: { type: "string" },
      keyFindings: {
        type: "array",
        items: { type: "string" },
      },
      recommendations: {
        type: "array",
        maxItems: 4,
        items: modelRecommendationJsonSchema,
      },
      limitations: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "executiveSummary",
      "keyFindings",
      "recommendations",
      "limitations",
    ],
  },
} as const;