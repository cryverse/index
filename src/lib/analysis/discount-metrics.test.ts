import assert from "node:assert/strict";
import test from "node:test";
import { buildVerifiedAnalyticalContext } from "./analytical-context";
import {
  computeDiscountMetrics,
  formatDiscountMetricsBrief,
} from "./discount-metrics";
import { profileDataset } from "./profile";

function profileWithDiscount(
  columnName: string,
  values: number[],
) {
  return profileDataset({
    sourceName: "discount-test.csv",
    columns: ["revenue", columnName],
    rows: values.map((discount, index) => ({
      revenue: 100 + index,
      [columnName]: discount,
    })),
  });
}

test("percentage discount column never reports monetary total", () => {
  const profile = profileWithDiscount("discount_pct", [0, 10, 15, 0, 5]);
  const metrics = computeDiscountMetrics(profile, "discount_pct");
  assert.ok(metrics);
  assert.equal(metrics.valueKind, "percentage");
  assert.equal(metrics.monetaryAvailable, false);
  assert.equal(metrics.totalMonetaryDiscount, null);

  const brief = formatDiscountMetricsBrief(metrics).join("\n");
  assert.match(brief, /Average discount percentage/);
  assert.match(brief, /unavailable/);
  assert.doesNotMatch(brief, /Total monetary discount amount: \$30/);
});

test("monetary discount column reports currency totals", () => {
  const profile = profileWithDiscount("discount_amount", [0, 12.5, 8, 0]);
  const metrics = computeDiscountMetrics(profile, "discount_amount");
  assert.ok(metrics);
  assert.equal(metrics.valueKind, "monetary");
  assert.equal(metrics.monetaryAvailable, true);
  assert.equal(metrics.totalMonetaryDiscount, 20.5);

  const brief = formatDiscountMetricsBrief(metrics).join("\n");
  assert.match(brief, /Total monetary discount amount: \$20\.50/);
  assert.match(brief, /unavailable \(column stores monetary amounts\)/);
});

test("ambiguous 0-100 discount values are treated as percentages in analytical brief", () => {
  const profile = profileDataset({
    sourceName: "synthetic-orders.csv",
    columns: [
      "order_date",
      "revenue",
      "region",
      "product",
      "channel",
      "customer_type",
      "units",
      "discount",
    ],
    rows: Array.from({ length: 240 }, (_, index) => ({
      order_date: `2025-01-15`,
      revenue: 80,
      region: "North",
      product: "Alpha",
      channel: "Online",
      customer_type: "New",
      units: 2,
      discount: index % 5 === 0 ? 10 : 0,
    })),
  });

  const { brief } = buildVerifiedAnalyticalContext([profile]);
  assert.match(brief, /value type: percentage/i);
  assert.match(brief, /Orders with discount > 0/);
  assert.match(brief, /Average discount percentage/);
  assert.match(brief, /Total monetary discount amount: unavailable/);
  assert.doesNotMatch(brief, /Total monetary discount amount: \$480/);
});