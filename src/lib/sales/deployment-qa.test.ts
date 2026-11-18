import assert from "node:assert/strict";
import test from "node:test";
import { buildSalesIntelligence } from "@/lib/analysis/sales-intelligence";
import { profileDataset } from "@/lib/analysis/profile";
import { parseCsvBuffer } from "@/lib/files/parse-csv";
import { validateSalesUploadFile } from "@/lib/sales/constants";
import { filterValidRecommendations } from "@/lib/sales/recommendation-validation";
import type { ResearchRecommendation } from "@/types/research";

test("validateSalesUploadFile rejects unsupported extensions server-side", () => {
  const file = new File(["a"], "notes.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "size", { value: 10 });
  const error = validateSalesUploadFile(file);
  assert.ok(error);
  assert.match(error, /CSV|XLSX|XLS/);
});

test("parseCsvBuffer surfaces malformed numeric revenue without coercing to zero", () => {
  const csv = "date,revenue\n2026-01-01,not-a-number\n";
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "malformed.csv");
  assert.equal(parsed.rowCount, 1);
  assert.ok(
    parsed.warnings.some((warning) => warning.includes("unparseable numeric")),
  );
});

test("validateSalesUploadFile rejects empty files", () => {
  const file = new File([], "empty.csv", { type: "text/csv" });
  assert.match(validateSalesUploadFile(file) ?? "", /empty/i);
});

test("buildSalesIntelligence works without date column", () => {
  const profile = profileDataset({
    sourceName: "no-dates.csv",
    columns: ["revenue", "region"],
    rows: [
      { revenue: "100", region: "North" },
      { revenue: "200", region: "South" },
    ],
  });
  const intelligence = buildSalesIntelligence([profile]);
  assert.ok(intelligence);
  assert.equal(intelligence!.dateColumn, undefined);
  assert.ok(
    !intelligence!.charts.some((chart) => chart.kind === "revenue_over_time"),
  );
  assert.ok(intelligence!.kpis.some((kpi) => kpi.id === "total_revenue"));
});

test("filterValidRecommendations tolerates zero valid items", () => {
  const junk: ResearchRecommendation[] = [
    {
      action: "Revenue is strong overall.",
      supportedBy: "Brief says revenue is up.",
      intendedOutcome: "Better decisions.",
    },
  ];
  assert.deepEqual(filterValidRecommendations(junk, "Brief with $10 total."), []);
});