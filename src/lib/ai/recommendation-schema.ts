import { z } from "zod";

export const modelRecommendationSchema = z.object({
  action: z.string().min(1),
  supportedBy: z.string().min(1),
  intendedOutcome: z.string().min(1),
});

export type ModelRecommendation = z.infer<typeof modelRecommendationSchema>;

export const modelRecommendationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: { type: "string" },
    supportedBy: { type: "string" },
    intendedOutcome: { type: "string" },
  },
  required: ["action", "supportedBy", "intendedOutcome"],
} as const;