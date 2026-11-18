import assert from "node:assert/strict";
import test from "node:test";
import { categorizeLimitation } from "./presentation";
import {
  formatPeriodCoverage,
  partitionSalesKpis,
} from "./results-presentation";
import type { SalesIntelligence } from "@/types/sales-intelligence";

test("categorizeLimitation routes integrity prefix and PDF scope", () => {
  assert.equal(
    categorizeLimitation(
      "Integrity: 2 duplicate row(s) detected (rows were not removed).",
    ),
    "integrity",
  );
  assert.equal(
    categorizeLimitation(
      "Very little text was extracted. The PDF may be scanned.",
    ),
    "scope",
  );
});

test("partitionSalesKpis keeps revenue as hero", () => {
  const partitioned = partitionSalesKpis([
    { id: "total_revenue", label: "Total revenue", value: "$10" },
    { id: "transaction_count", label: "Transactions", value: "2" },
  ]);
  assert.equal(partitioned.hero?.id, "total_revenue");
  assert.equal(partitioned.supporting.length, 1);
});

test("formatPeriodCoverage uses revenue over time chart", () => {
  const intelligence: SalesIntelligence = {
    datasetLabel: "sales.csv",
    recordCount: 10,
    kpis: [],
    charts: [
      {
        kind: "revenue_over_time",
        title: "Revenue over time",
        measureLabel: "revenue",
        points: [
          { label: "2026-01", value: 1 },
          { label: "2026-03", value: 2 },
        ],
      },
    ],
    missingByColumn: [],
    missingDimensions: [],
  };
  assert.equal(formatPeriodCoverage(intelligence), "2026-01 – 2026-03");
});