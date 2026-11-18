import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildVerifiedAnalyticalContext } from "./analytical-context";
import { parseCsvBuffer } from "@/lib/files/parse-csv";
import { profileDataset } from "./profile";

const here = dirname(fileURLToPath(import.meta.url));

function profileFromCsv(relativePath: string) {
  const buffer = readFileSync(join(here, "..", "..", "..", relativePath));
  const parsed = parseCsvBuffer(buffer, relativePath);
  const dataset = parsed.tabularDatasets[0];
  return profileDataset(dataset);
}

function buildOrderProfile(rowCount: number) {
  const channels = ["Online", "Retail", "Wholesale"];
  const regions = ["North", "South", "East", "West"];
  const products = ["Alpha", "Beta", "Gamma"];
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const month = String((index % 12) + 1).padStart(2, "0");
    return {
      order_date: `2025-${month}-15`,
      revenue: 80 + (index % 7) * 15,
      region: regions[index % regions.length],
      product: products[index % products.length],
      channel: channels[index % channels.length],
      customer_type: index % 2 === 0 ? "New" : "Returning",
      units: 1 + (index % 4),
      discount: index % 5 === 0 ? 10 : 0,
    };
  });

  return profileDataset({
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
    rows,
  });
}

test("sample sales csv includes verified monthly and regional breakdown", () => {
  const profile = profileFromCsv("test_sales.csv");
  const { brief } = buildVerifiedAnalyticalContext([profile]);

  assert.match(brief, /MONTHLY REVENUE/);
  assert.match(brief, /2026-01/);
  assert.match(brief, /REGIONAL REVENUE/);
  assert.match(brief, /North/);
  assert.match(brief, /South/);
  assert.match(brief, /\$7,100\.00/);
  assert.doesNotMatch(brief, /not computed \(date or revenue column unavailable\)/);
});

test("240-order dataset includes multi-dimensional verified context", () => {
  const profile = buildOrderProfile(240);
  const { brief } = buildVerifiedAnalyticalContext([profile]);

  assert.equal(profile.rowCount, 240);
  assert.match(brief, /MONTHLY REVENUE/);
  assert.match(brief, /SALES CHANNEL REVENUE/);
  assert.match(brief, /Online/);
  assert.match(brief, /UNITS SOLD/);
  assert.match(brief, /DISCOUNTS/);
  assert.match(brief, /Total monetary discount amount: unavailable/);
  assert.match(brief, /CUSTOMER TYPE REVENUE/);
});