import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { buildVerifiedAnalyticalContext } from "@/lib/analysis/analytical-context";
import { profileDataset } from "@/lib/analysis/profile";
import { buildSalesIntelligence } from "@/lib/analysis/sales-intelligence";
import { runTabularAnalysis } from "@/lib/analysis/run-tabular-analysis";
import { SALES_ANALYSIS_QUESTION } from "@/lib/sales/constants";
import { formatCurrency } from "@/lib/analysis/coerce";
import { parseCsvBuffer } from "./parse-csv";
import { parseXlsxBuffer } from "./parse-xlsx";
import type { ParsedUploadContext } from "./types";

const ROW_COUNT = 250;
const REVENUE_PER_ROW = 10;
const EXPECTED_TOTAL = formatCurrency(ROW_COUNT * REVENUE_PER_ROW);

function buildRevenueCsv(rowCount: number): Buffer {
  const header = "date,region,revenue\n";
  const body = Array.from(
    { length: rowCount },
    (_, index) =>
      `2026-01-${String((index % 28) + 1).padStart(2, "0")},North,${REVENUE_PER_ROW}`,
  ).join("\n");
  return Buffer.from(`${header}${body}`, "utf8");
}

function buildRevenueXlsx(rowCount: number): Buffer {
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    date: `2026-01-${String((index % 28) + 1).padStart(2, "0")}`,
    region: "North",
    revenue: REVENUE_PER_ROW,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sales");
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}

type ParsedTabularResult = {
  rowCount: number;
  warnings: string[];
  tabularDatasets: ReturnType<typeof parseCsvBuffer>["tabularDatasets"];
  contextText: string;
  summary: string;
};

function assertFullDatasetAnalysis(
  parsed: ParsedTabularResult,
  label: "csv" | "xlsx",
) {
  assert.equal(parsed.rowCount, ROW_COUNT);
  assert.equal(parsed.tabularDatasets[0]?.rows.length, ROW_COUNT);

  const previewNotice = parsed.warnings.find((warning) =>
    warning.includes("Verified calculations use every parsed row"),
  );
  assert.ok(previewNotice, `${label} should note preview-only truncation`);

  const profiles = parsed.tabularDatasets.map((dataset) =>
    profileDataset(dataset),
  );
  const intelligence = buildSalesIntelligence(profiles);
  assert.ok(intelligence);

  const totalRevenue = intelligence.kpis.find((kpi) => kpi.id === "total_revenue");
  assert.equal(totalRevenue?.value, EXPECTED_TOTAL);

  const transactions = intelligence.kpis.find(
    (kpi) => kpi.id === "transaction_count",
  );
  assert.equal(transactions?.value, String(ROW_COUNT));

  const { brief } = buildVerifiedAnalyticalContext(profiles);
  assert.match(brief, new RegExp(EXPECTED_TOTAL.replace("$", "\\$")));

  const contexts: ParsedUploadContext[] = [
    {
      name: `${label}-orders`,
      kind: label === "csv" ? "csv" : "xlsx",
      sizeBytes: 1_024,
      warnings: parsed.warnings,
      contextText: parsed.contextText,
      summary: parsed.summary,
      tabularDatasets: parsed.tabularDatasets,
    },
  ];
  const report = runTabularAnalysis(SALES_ANALYSIS_QUESTION, contexts);
  assert.doesNotMatch(
    report.analyticalBrief,
    /truncated to first 200/i,
    `${label} verified brief must not claim row truncation`,
  );
  assert.match(
    report.analyticalBrief,
    new RegExp(EXPECTED_TOTAL.replace("$", "\\$")),
  );
}

test("csv parse-to-analysis uses every row beyond preview limit", () => {
  const parsed = parseCsvBuffer(buildRevenueCsv(ROW_COUNT), "large-orders.csv");
  assertFullDatasetAnalysis(parsed, "csv");
});

test("xlsx parse-to-analysis uses every row beyond preview limit", () => {
  const parsed = parseXlsxBuffer(
    buildRevenueXlsx(ROW_COUNT),
    "large-orders.xlsx",
  );
  assertFullDatasetAnalysis(parsed, "xlsx");
});