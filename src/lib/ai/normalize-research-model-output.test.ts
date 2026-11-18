import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_RECOMMENDATION_CANDIDATES,
  normalizeResearchModelPayload,
} from "./normalize-research-model-output";
import { researchOutputSchema } from "./research-schema";
import { filterValidRecommendations } from "@/lib/sales/recommendation-validation";

const SAMPLE_BRIEF = `
REGIONAL REVENUE
- North: $4,700.00 (66.2% of revenue; rank #1)
- South: $2,400.00 (33.8% of revenue; rank #2)
`;

function buildCandidate(index: number) {
  return {
    action: `Investigate regional mix for scenario ${index} with the sales leadership team`,
    supportedBy: `North: $4,700.00 (66.2% of revenue; rank #1) per verified brief (item ${index})`,
    intendedOutcome: `Improve visibility into North vs South contribution ${index}`,
  };
}

test("more than four model recommendations normalize without Zod failure", () => {
  const oversized = {
    title: "Sales Analysis",
    executiveSummary: "Verified revenue totals show regional concentration.",
    keyFindings: ["North leads at 66.2% of revenue."],
    limitations: ["Product column not detected."],
    recommendations: Array.from({ length: 6 }, (_, index) =>
      buildCandidate(index),
    ),
  };

  assert.equal(oversized.recommendations.length, 6);

  const normalized = normalizeResearchModelPayload(oversized);
  const parsed = researchOutputSchema.parse(normalized);

  assert.equal(parsed.recommendations.length, MAX_RECOMMENDATION_CANDIDATES);

  const validated = filterValidRecommendations(
    parsed.recommendations,
    SAMPLE_BRIEF,
  );
  assert.ok(validated.length <= MAX_RECOMMENDATION_CANDIDATES);
  assert.ok(validated.length > 0);
});

test("six raw items fail Zod without normalization", () => {
  const oversized = {
    title: "Sales Analysis",
    executiveSummary: "Summary",
    keyFindings: ["Finding"],
    limitations: ["Limit"],
    recommendations: Array.from({ length: 6 }, (_, index) =>
      buildCandidate(index),
    ),
  };

  assert.throws(() => researchOutputSchema.parse(oversized));
});