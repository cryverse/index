import type { SalesChartSeries, SalesIntelligence, SalesKpi } from "@/types/sales-intelligence";
import {
  missingBusinessDimensions,
  resolveSalesColumnRoles,
} from "./column-roles";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  isBlank,
  parseDate,
  parseNumber,
} from "./coerce";
import type { DatasetProfile } from "./types";

function monthBucketKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildRevenueOverTime(
  profile: DatasetProfile,
  revenueColumn: string,
  dateColumn: string,
): SalesChartSeries | null {
  const totals = new Map<string, number>();

  for (const row of profile.dataset.rows) {
    const dateValue = parseDate(row[dateColumn]);
    const revenue = parseNumber(row[revenueColumn]);
    if (!dateValue || revenue == null) continue;
    const key = monthBucketKey(dateValue);
    totals.set(key, (totals.get(key) ?? 0) + revenue);
  }

  const points = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));

  if (points.length < 2) return null;

  return {
    kind: "revenue_over_time",
    title: "Revenue over time",
    measureLabel: revenueColumn,
    points,
  };
}

function buildGroupedPerformance(
  profile: DatasetProfile,
  revenueColumn: string,
  groupColumn: string,
  kind: SalesChartSeries["kind"],
  title: string,
): SalesChartSeries | null {
  const totals = new Map<string, number>();

  for (const row of profile.dataset.rows) {
    const groupValue = row[groupColumn];
    const revenue = parseNumber(row[revenueColumn]);
    if (isBlank(groupValue) || revenue == null) continue;
    const key = String(groupValue).trim();
    totals.set(key, (totals.get(key) ?? 0) + revenue);
  }

  const points = [...totals.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  if (points.length < 2) return null;

  return {
    kind,
    title,
    measureLabel: revenueColumn,
    groupLabel: groupColumn,
    points,
  };
}

function computeGrowthFromTimeSeries(
  series: SalesChartSeries,
): SalesKpi | null {
  const first = series.points[0];
  const last = series.points.at(-1);
  if (!first || !last || first === last) return null;
  if (first.value <= 0) return null;

  const change = ((last.value - first.value) / first.value) * 100;
  return {
    id: "revenue_growth",
    label: "Revenue growth",
    value: formatPercent(change),
    helperText: `From ${first.label} to ${last.label} (verified period comparison)`,
  };
}

function primaryProfile(profiles: DatasetProfile[]): DatasetProfile | undefined {
  const nonEmpty = profiles.filter((profile) => profile.rowCount > 0);
  if (nonEmpty.length === 0) return undefined;
  return [...nonEmpty].sort((a, b) => b.rowCount - a.rowCount)[0];
}

export function buildSalesIntelligence(
  profiles: DatasetProfile[],
): SalesIntelligence | null {
  const profile = primaryProfile(profiles);
  if (!profile) return null;

  const roles = resolveSalesColumnRoles(profile);
  const revenueColumn = roles.revenue;
  const dateColumn = roles.date;
  const regionColumn = roles.region;
  const productColumn = roles.product;

  const kpis: SalesKpi[] = [];
  const charts: SalesChartSeries[] = [];

  let validRevenueRows = 0;
  let revenueTotal = 0;

  if (revenueColumn) {
    for (const row of profile.dataset.rows) {
      const revenue = parseNumber(row[revenueColumn]);
      if (revenue == null) continue;
      validRevenueRows += 1;
      revenueTotal += revenue;
    }

    if (validRevenueRows > 0) {
      kpis.push({
        id: "total_revenue",
        label: "Total revenue",
        value: formatCurrency(revenueTotal),
        helperText: `Sum of ${revenueColumn} across ${formatNumber(validRevenueRows)} rows with values`,
      });

      kpis.push({
        id: "transaction_count",
        label: "Transactions",
        value: formatNumber(validRevenueRows),
        helperText: `Rows with a valid ${revenueColumn}`,
      });

      const aov = revenueTotal / validRevenueRows;
      kpis.push({
        id: "average_order_value",
        label: "Average order value",
        value: formatCurrency(aov),
        helperText: `Total revenue ÷ ${formatNumber(validRevenueRows)} transactions`,
      });
    } else {
      kpis.push({
        id: "transaction_count",
        label: "Records",
        value: formatNumber(profile.rowCount),
        helperText: "No numeric revenue column produced valid totals",
      });
    }
  } else {
    kpis.push({
      id: "transaction_count",
      label: "Records",
      value: formatNumber(profile.rowCount),
      helperText: "No numeric measure column detected for revenue rollup",
    });
  }

  if (revenueColumn && dateColumn) {
    const timeSeries = buildRevenueOverTime(profile, revenueColumn, dateColumn);
    if (timeSeries) {
      charts.push(timeSeries);
      const growth = computeGrowthFromTimeSeries(timeSeries);
      if (growth) kpis.push(growth);
    }
  }

  if (revenueColumn && regionColumn) {
    const regional = buildGroupedPerformance(
      profile,
      revenueColumn,
      regionColumn,
      "regional_performance",
      `Performance by ${regionColumn}`,
    );
    if (regional) charts.push(regional);
  }

  if (revenueColumn && productColumn) {
    const product = buildGroupedPerformance(
      profile,
      revenueColumn,
      productColumn,
      "product_performance",
      `Performance by ${productColumn}`,
    );
    if (product) charts.push(product);
  }

  const missingByColumn = profile.columns
    .filter((column) => column.missingCount > 0)
    .map((column) => ({
      column: column.name,
      missingCount: column.missingCount,
      missingPercent: column.missingPercent,
    }))
    .sort((a, b) => b.missingPercent - a.missingPercent);

  return {
    datasetLabel: profile.label,
    recordCount: profile.rowCount,
    revenueColumn,
    dateColumn,
    regionColumn,
    productColumn,
    kpis,
    charts,
    missingByColumn,
    missingDimensions: missingBusinessDimensions(roles),
  };
}