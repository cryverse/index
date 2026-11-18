import {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseDate,
  parseNumber,
} from "./coerce";
import type { SalesColumnRoles } from "./column-roles";
import type { DatasetProfile } from "./types";

export type MonthPoint = {
  period: string;
  revenue: number;
  transactions: number;
  aov: number;
};

export type TemporalAnalysis = {
  months: MonthPoint[];
  missingMonthGaps: string[];
  consecutiveGrowth: number;
  consecutiveDecline: number;
  firstToLastChangePercent: number | null;
  peak: MonthPoint;
  low: MonthPoint;
  coefficientOfVariation: number | null;
  insufficientForTrend: boolean;
  insufficientForSeasonality: boolean;
};

export function monthBucketKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function periodIndex(period: string): number {
  const [year, month] = period.split("-").map(Number);
  return year * 12 + (month - 1);
}

function enumerateExpectedMonths(start: string, end: string): string[] {
  let cursor = periodIndex(start);
  const last = periodIndex(end);
  const out: string[] = [];
  while (cursor <= last) {
    const year = Math.floor(cursor / 12);
    const month = (cursor % 12) + 1;
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    cursor += 1;
  }
  return out;
}

export function buildMonthSeries(
  profile: DatasetProfile,
  roles: Pick<SalesColumnRoles, "revenue" | "date">,
): MonthPoint[] {
  if (!roles.revenue || !roles.date) return [];

  const totals = new Map<string, { sum: number; count: number }>();
  for (const row of profile.dataset.rows) {
    const dateValue = parseDate(row[roles.date]);
    const revenue = parseNumber(row[roles.revenue]);
    if (!dateValue || revenue == null) continue;
    const key = monthBucketKey(dateValue);
    const current = totals.get(key) ?? { sum: 0, count: 0 };
    current.sum += revenue;
    current.count += 1;
    totals.set(key, current);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, stats]) => ({
      period,
      revenue: stats.sum,
      transactions: stats.count,
      aov: stats.count > 0 ? stats.sum / stats.count : 0,
    }));
}

export function analyzeTemporalPattern(months: MonthPoint[]): TemporalAnalysis | null {
  if (months.length === 0) return null;

  const start = months[0].period;
  const end = months.at(-1)!.period;
  const expected = enumerateExpectedMonths(start, end);
  const present = new Set(months.map((month) => month.period));
  const missingMonthGaps = expected.filter((period) => !present.has(period));

  let consecutiveGrowth = 0;
  let consecutiveDecline = 0;
  let growthRun = 0;
  let declineRun = 0;

  for (let index = 1; index < months.length; index += 1) {
    const prev = months[index - 1].revenue;
    const current = months[index].revenue;
    if (prev <= 0) continue;
    const change = (current - prev) / prev;
    if (change > 0.01) {
      growthRun += 1;
      declineRun = 0;
      consecutiveGrowth = Math.max(consecutiveGrowth, growthRun);
    } else if (change < -0.01) {
      declineRun += 1;
      growthRun = 0;
      consecutiveDecline = Math.max(consecutiveDecline, declineRun);
    } else {
      growthRun = 0;
      declineRun = 0;
    }
  }

  const first = months[0].revenue;
  const last = months.at(-1)!.revenue;
  const firstToLastChangePercent =
    first > 0 ? ((last - first) / first) * 100 : null;

  const peak = months.reduce((best, month) =>
    month.revenue > best.revenue ? month : best,
  );
  const low = months.reduce((worst, month) =>
    month.revenue < worst.revenue ? month : worst,
  );

  const revenues = months.map((month) => month.revenue);
  const mean = revenues.reduce((sum, value) => sum + value, 0) / revenues.length;
  const variance =
    revenues.reduce((acc, value) => acc + (value - mean) ** 2, 0) /
    revenues.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation =
    mean > 0 && revenues.length >= 2 ? (stdDev / mean) * 100 : null;

  return {
    months,
    missingMonthGaps,
    consecutiveGrowth,
    consecutiveDecline,
    firstToLastChangePercent,
    peak,
    low,
    coefficientOfVariation,
    insufficientForTrend: months.length < 3,
    insufficientForSeasonality: months.length < 12,
  };
}

export function formatMonthlyRevenueSection(
  months: MonthPoint[],
  revenueTotal: number,
  revenueColumn: string,
): string[] {
  if (months.length === 0) {
    return ["MONTHLY REVENUE: not computed (no valid monthly rows)."];
  }

  const lines = [
    `MONTHLY REVENUE (${revenueColumn} by calendar month, verified):`,
    `Coverage: ${months[0].period} through ${months.at(-1)!.period} (${months.length} month(s)).`,
  ];

  let priorRevenue: number | null = null;
  for (const month of months) {
    const share = revenueTotal > 0 ? (month.revenue / revenueTotal) * 100 : 0;
    const mom =
      priorRevenue != null && priorRevenue > 0
        ? ((month.revenue - priorRevenue) / priorRevenue) * 100
        : null;
    const momText =
      mom == null
        ? "vs prior month: n/a"
        : `vs prior month: ${formatPercent(mom)}`;
    lines.push(
      `- ${month.period}: ${formatCurrency(month.revenue)} across ${formatNumber(month.transactions)} row(s); AOV ${formatCurrency(month.aov)}; ${formatPercent(share)} of total; ${momText}`,
    );
    priorRevenue = month.revenue;
  }

  return lines;
}

export function formatTemporalInsightsSection(
  analysis: TemporalAnalysis,
): string[] {
  const lines = [
    "TEMPORAL INSIGHTS (verified observations — not causal explanations):",
  ];

  if (analysis.insufficientForTrend) {
    lines.push(
      "- Trend note: fewer than 3 months of data — do not describe an established revenue trend.",
    );
  }
  if (analysis.insufficientForSeasonality) {
    lines.push(
      "- Seasonality note: fewer than 12 months — do not attribute patterns to seasonal cycles.",
    );
  }

  if (analysis.missingMonthGaps.length > 0) {
    lines.push(
      `- Missing calendar months within coverage: ${analysis.missingMonthGaps.join(", ")}.`,
    );
  }

  if (analysis.firstToLastChangePercent != null) {
    lines.push(
      `- First-to-last month revenue change: ${formatPercent(analysis.firstToLastChangePercent)} (${analysis.months[0].period} → ${analysis.months.at(-1)!.period}).`,
    );
  }

  lines.push(
    `- Peak month: ${analysis.peak.period} at ${formatCurrency(analysis.peak.revenue)}; lowest month: ${analysis.low.period} at ${formatCurrency(analysis.low.revenue)}.`,
  );

  if (analysis.consecutiveGrowth >= 2) {
    lines.push(
      `- Longest consecutive month-over-month revenue increases: ${formatNumber(analysis.consecutiveGrowth)} month(s).`,
    );
  }
  if (analysis.consecutiveDecline >= 2) {
    lines.push(
      `- Longest consecutive month-over-month revenue decreases: ${formatNumber(analysis.consecutiveDecline)} month(s).`,
    );
  }
  if (
    analysis.coefficientOfVariation != null &&
    analysis.months.length >= 3
  ) {
    const volatility =
      analysis.coefficientOfVariation >= 25 ? "elevated" : "moderate";
    lines.push(
      `- Month-to-month revenue variation: ${volatility} (CV ${formatPercent(analysis.coefficientOfVariation)} across ${analysis.months.length} months).`,
    );
  }

  return lines;
}