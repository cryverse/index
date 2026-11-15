import { z } from "zod";

export const researchOutputSchema = z.object({
  title: z.string().min(1),
  executiveSummary: z.string().min(1),
  keyFindings: z.array(z.string()).min(1),
  conclusions: z.array(z.string()).min(1),
  limitations: z.array(z.string()).min(1),
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
      conclusions: {
        type: "array",
        items: { type: "string" },
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
      "conclusions",
      "limitations",
    ],
  },
} as const;