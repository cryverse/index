import assert from "node:assert/strict";
import test from "node:test";
import { classifyFindingTone } from "./presentation";
import {
  MAX_ACCEPTED_RECOMMENDATIONS,
  actionSimilarity,
  filterValidRecommendations,
  hasUnsupportedInference,
  isDescriptiveObservation,
  isNearDuplicateAction,
  isVagueIntendedOutcome,
  validateRecommendationAgainstBrief,
  validateRecommendationFields,
} from "./recommendation-validation";

const SAMPLE_BRIEF = `
HEADLINE METRICS
- Total revenue (revenue): $7,100.00 across 6 row(s) with values.
MONTHLY REVENUE
- 2026-03: $2,900.00; 51.0% of total revenue
REGIONAL REVENUE
- North: $4,700.00 (66.2% of revenue; rank #1)
- South: $2,400.00 (33.8% of revenue; rank #2)
`;

/** Reference brief for portfolio demo quality checks — not used in production code. */
const REFERENCE_240_ORDER_BRIEF = `
HEADLINE METRICS
- Total revenue (revenue): $110,719.77 across 240 row(s).
- Average order value: $461.33.
MONTHLY REVENUE
- 2026-01 through 2026-06 with first-to-last month change: 8.5%
- 2026-04: $30,418.29
- 2026-03: $17,115.88
REGIONAL REVENUE
- North: $38,709.89 (rank #1)
- East: $22,012.36 (rank #4)
PRODUCT / CATEGORY REVENUE
- Monitor 27-inch: $30,499.23
SALES CHANNEL REVENUE
- Online: $46,460.82
CUSTOMER TYPE REVENUE
- Returning customer: $43,536.04
- New customer: $32,646.69
UNITS SOLD (units, verified):
- Total units: 520 across 240 row(s).
`;

test("accepts valid actionable recommendations with brief evidence", () => {
  const input = [
    {
      action:
        "Investigate the revenue increase from February to March by product and region",
      supportedBy:
        "Verified brief shows March revenue at $2,900.00 (51.0% of total) vs lower prior months",
      intendedOutcome:
        "Clarify whether March strength is repeatable across North and South",
    },
  ];
  const valid = filterValidRecommendations(input, SAMPLE_BRIEF);
  assert.equal(valid.length, 1);
  assert.ok(validateRecommendationFields(valid[0]));
});

test("accepts reasonable reference-style recommendations from verified brief", () => {
  const valid = filterValidRecommendations(
    [
      {
        action:
          "Investigate the April revenue spike by product, region, and channel mix",
        supportedBy:
          "Verified brief lists April revenue at $30,418.29 versus $17,115.88 in March",
        intendedOutcome:
          "Determine whether the April spike is concentrated in specific segments before planning spend",
      },
      {
        action:
          "Review East region deal flow and pricing against North for the same product set",
        supportedBy:
          "East revenue is $22,012.36 compared with North at $38,709.89 in the verified brief",
        intendedOutcome:
          "Identify executable reasons East trails North without assuming an external market cause",
      },
    ],
    REFERENCE_240_ORDER_BRIEF,
  );
  assert.equal(valid.length, 2);
});

test("rejects descriptive-only recommendations", () => {
  const invalid = [
    {
      action: "Revenue is highly volatile.",
      supportedBy: "Monthly revenue varies across the period",
      intendedOutcome: "Better forecasting visibility across months",
    },
    {
      action: "The North region generates the most revenue.",
      supportedBy: "North leads in the dataset",
      intendedOutcome: "Maintain North momentum with the sales team",
    },
  ];
  const valid = filterValidRecommendations(invalid, SAMPLE_BRIEF);
  assert.equal(valid.length, 0);
  for (const item of invalid) {
    assert.equal(isDescriptiveObservation(item.action), true);
  }
});

test("rejects unsupported numerical claims", () => {
  const valid = filterValidRecommendations(
    [
      {
        action: "Review South region pipeline stages with the account owners",
        supportedBy: "South revenue is $99,999.99 in the verified brief",
        intendedOutcome: "Improve South win rate relative to North",
      },
    ],
    SAMPLE_BRIEF,
  );
  assert.equal(valid.length, 0);
});

test("rejects unsupported causal and inference claims", () => {
  const retention = {
    action: "Shift budget to Returning customers because retention is strong",
    supportedBy:
      "Returning customer revenue is $43,536.04 in the verified brief",
    intendedOutcome: "Improve retention quality across the customer base",
  };
  assert.equal(
    hasUnsupportedInference(retention, REFERENCE_240_ORDER_BRIEF),
    true,
  );

  const inventory = {
    action: "Increase Monitor 27-inch inventory to match its revenue contribution",
    supportedBy: "Monitor 27-inch revenue is $30,499.23 in the verified brief",
    intendedOutcome: "Reduce stockouts for the top revenue SKU",
  };
  assert.equal(
    validateRecommendationAgainstBrief(inventory, REFERENCE_240_ORDER_BRIEF),
    false,
  );

  const causal = filterValidRecommendations(
    [
      {
        action: "Investigate North channel mix changes with the sales leads",
        supportedBy:
          "North revenue is $38,709.89 because of marketing seasonality",
        intendedOutcome: "Align future campaigns with proven demand drivers",
      },
    ],
    REFERENCE_240_ORDER_BRIEF,
  );
  assert.equal(causal.length, 0);
});

test("rejects vague intended outcomes", () => {
  assert.equal(isVagueIntendedOutcome("better performance"), true);
  assert.equal(
    validateRecommendationFields({
      action: "Investigate March to April revenue change with finance",
      supportedBy: "Verified brief shows monthly revenue movement in the period",
      intendedOutcome: "improve results",
    }),
    false,
  );
});

test("rejects duplicate and near-duplicate recommendations", () => {
  const base = {
    supportedBy: "Verified brief shows April revenue at $30,418.29",
    intendedOutcome:
      "Understand which segments drove the April uplift before changing targets",
  };
  const valid = filterValidRecommendations(
    [
      {
        action: "Investigate the April revenue spike across product and region",
        ...base,
      },
      {
        action: "Investigate the April revenue spike by channel and customer type",
        ...base,
      },
    ],
    REFERENCE_240_ORDER_BRIEF,
  );
  assert.equal(valid.length, 1);
  assert.ok(
    isNearDuplicateAction(
      "Investigate April revenue spike by channel",
      ["Investigate April revenue spike across product"],
    ),
  );
  assert.ok(
    actionSimilarity(
      "Investigate the April revenue spike across product",
      "Investigate the April revenue spike by channel",
    ) >= 0.55,
  );
});

test("returns empty array when none are valid", () => {
  const valid = filterValidRecommendations(
    [
      {
        action: "Sales increased over time",
        supportedBy: "Revenue trend is upward",
        intendedOutcome: "Keep growing sales quarter over quarter",
      },
    ],
    SAMPLE_BRIEF,
  );
  assert.deepEqual(valid, []);
});

test("accepts at most four recommendations after validation", () => {
  const candidates = Array.from({ length: 6 }, (_, index) => ({
    action: `Compare channel contribution for scenario ${index} with verified monthly totals`,
    supportedBy: `Online revenue is $46,460.82 in the verified brief (case ${index})`,
    intendedOutcome: `Clarify channel mix implications for scenario ${index} planning`,
  }));
  const valid = filterValidRecommendations(candidates, REFERENCE_240_ORDER_BRIEF);
  assert.ok(valid.length <= MAX_ACCEPTED_RECOMMENDATIONS);
});

test("revenue spikes and concentration are not automatically risk", () => {
  assert.equal(
    classifyFindingTone(
      "April shows a revenue spike to $30,418.29, the peak month in the brief.",
    ),
    null,
  );
  assert.equal(
    classifyFindingTone(
      "North is the leading region with 66.2% of verified revenue (rank #1).",
    ),
    null,
  );
});