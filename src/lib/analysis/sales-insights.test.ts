import assert from "node:assert/strict";
import test from "node:test";
import { buildVerifiedAnalyticalContext } from "./analytical-context";
import {
  analyzeTemporalPattern,
  buildMonthSeries,
} from "./temporal-insights";
import { detectMonthlyAnomalies } from "./anomaly-detection";
import { analyzeConcentration } from "./concentration";
import { buildVerifiedFindingCandidates } from "./verified-findings";
import { profileDataset } from "./profile";
import { resolveSalesColumnRoles } from "./column-roles";

function monthlyProfile(
  months: Array<{ period: string; revenue: number; count?: number }>,
) {
  const rows = months.flatMap((month) =>
    Array.from({ length: month.count ?? 3 }, (_, index) => ({
      order_date: `${month.period}-${String(index + 1).padStart(2, "0")}`,
      revenue: month.revenue / (month.count ?? 3),
      region: index % 2 === 0 ? "North" : "South",
    })),
  );
  return profileDataset({
    sourceName: "temporal.csv",
    columns: ["order_date", "revenue", "region"],
    rows,
  });
}

test("detects consecutive growth and decline without calling single move a trend", () => {
  const profile = monthlyProfile([
    { period: "2026-01", revenue: 1000 },
    { period: "2026-02", revenue: 1100 },
    { period: "2026-03", revenue: 1200 },
  ]);
  const roles = resolveSalesColumnRoles(profile);
  const months = buildMonthSeries(profile, roles);
  const analysis = analyzeTemporalPattern(months);
  assert.ok(analysis);
  assert.equal(analysis.consecutiveGrowth, 2);
  assert.equal(analysis.insufficientForTrend, false);
  assert.equal(analysis.insufficientForSeasonality, true);
});

test("flags missing months in coverage", () => {
  const profile = monthlyProfile([
    { period: "2026-01", revenue: 1000 },
    { period: "2026-03", revenue: 1200 },
  ]);
  const roles = resolveSalesColumnRoles(profile);
  const analysis = analyzeTemporalPattern(buildMonthSeries(profile, roles));
  assert.ok(analysis);
  assert.deepEqual(analysis?.missingMonthGaps, ["2026-02"]);
});

test("detects revenue spike against median baseline", () => {
  const profile = monthlyProfile([
    { period: "2026-01", revenue: 10000 },
    { period: "2026-02", revenue: 11000 },
    { period: "2026-03", revenue: 12000 },
    { period: "2026-04", revenue: 30000, count: 5 },
    { period: "2026-05", revenue: 13000 },
    { period: "2026-06", revenue: 14000 },
  ]);
  const roles = resolveSalesColumnRoles(profile);
  const months = buildMonthSeries(profile, roles);
  const anomalies = detectMonthlyAnomalies(months);
  assert.ok(
    anomalies.some(
      (item) => item.period === "2026-04" && item.metric === "monthly revenue",
    ),
  );
});

test("small monthly sample is cautious about trend and seasonality", () => {
  const profile = monthlyProfile([
    { period: "2026-01", revenue: 1000 },
    { period: "2026-02", revenue: 1800 },
  ]);
  const { brief, limitations } = buildVerifiedAnalyticalContext([profile]);
  assert.match(brief, /fewer than 3 months/i);
  assert.match(brief, /do not attribute patterns to seasonal cycles/i);
  assert.ok(
    limitations.some((item) => item.includes("Fewer than 3 months")),
  );
});

test("concentration is observation-only in brief", () => {
  const profile = profileDataset({
    sourceName: "region.csv",
    columns: ["revenue", "region"],
    rows: [
      { revenue: 800, region: "North" },
      { revenue: 100, region: "South" },
      { revenue: 100, region: "East" },
    ],
  });
  const { brief } = buildVerifiedAnalyticalContext([profile]);
  assert.match(brief, /concentration observation only/i);
  assert.doesNotMatch(brief, /concentration risk/i);
});

test("verified finding candidates are non-duplicative", () => {
  const profile = monthlyProfile([
    { period: "2026-01", revenue: 1000 },
    { period: "2026-02", revenue: 1100 },
    { period: "2026-03", revenue: 1200 },
  ]);
  const roles = resolveSalesColumnRoles(profile);
  const months = buildMonthSeries(profile, roles);
  const temporal = analyzeTemporalPattern(months);
  const findings = buildVerifiedFindingCandidates(temporal, [], [], 3300);
  const unique = new Set(findings.map((item) => item.toLowerCase()));
  assert.equal(unique.size, findings.length);
});

test("insufficient data produces cautious finding candidate", () => {
  const profile = profileDataset({
    sourceName: "tiny.csv",
    columns: ["revenue"],
    rows: [{ revenue: 50 }],
  });
  const { brief } = buildVerifiedAnalyticalContext([profile]);
  assert.match(brief, /VERIFIED FINDING CANDIDATES/);
});

test("concentration metrics are transparent", () => {
  const snapshot = analyzeConcentration("region", [
    { label: "North", share: 80, rank: 1 },
    { label: "South", share: 20, rank: 2 },
  ]);
  assert.ok(snapshot);
  assert.match(snapshot!.observation, /80%/);
});