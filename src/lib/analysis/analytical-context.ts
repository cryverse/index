import {
  formatCurrency,
  formatNumber,
  formatPercent,
  isBlank,
  parseDate,
  parseNumber,
} from "./coerce";
import {
  detectMonthlyAnomalies,
  formatAnomalySection,
} from "./anomaly-detection";
import {
  missingBusinessDimensions,
  resolveSalesColumnRoles,
  type SalesColumnRoles,
} from "./column-roles";
import { analyzeConcentration, type SegmentContribution } from "./concentration";
import {
  computeDiscountMetrics,
  formatDiscountMetricsBrief,
  pickDiscountColumns,
} from "./discount-metrics";
import {
  analyzeTemporalPattern,
  buildMonthSeries,
  formatMonthlyRevenueSection,
  formatTemporalInsightsSection,
  monthBucketKey,
} from "./temporal-insights";
import type { DatasetProfile } from "./types";
import {
  buildVerifiedFindingCandidates,
  formatVerifiedFindingCandidates,
} from "./verified-findings";

export type VerifiedAnalyticalContext = {
  brief: string;
  limitations: string[];
};

type BreakdownLine = {
  label: string;
  sum: number;
  count: number;
  share: number;
  rank: number;
};

function aggregateSumByGroup(
  profile: DatasetProfile,
  groupColumn: string,
  valueColumn: string,
  total: number,
): BreakdownLine[] {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const row of profile.dataset.rows) {
    const groupValue = row[groupColumn];
    const value = parseNumber(row[valueColumn]);
    if (isBlank(groupValue) || value == null) continue;
    const key = String(groupValue).trim();
    const current = buckets.get(key) ?? { sum: 0, count: 0 };
    current.sum += value;
    current.count += 1;
    buckets.set(key, current);
  }

  const sorted = [...buckets.entries()]
    .map(([label, stats]) => ({
      label,
      sum: stats.sum,
      count: stats.count,
      share: total > 0 ? (stats.sum / total) * 100 : 0,
      rank: 0,
    }))
    .sort((a, b) => b.sum - a.sum);

  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function primaryProfile(
  profiles: DatasetProfile[],
): DatasetProfile | undefined {
  const nonEmpty = profiles.filter((profile) => profile.rowCount > 0);
  if (nonEmpty.length === 0) return undefined;
  return [...nonEmpty].sort((a, b) => b.rowCount - a.rowCount)[0];
}

function sumNumericColumn(
  profile: DatasetProfile,
  column: string,
): { sum: number; count: number; values: number[] } {
  const values: number[] = [];
  for (const row of profile.dataset.rows) {
    const value = parseNumber(row[column]);
    if (value == null) continue;
    values.push(value);
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return { sum, count: values.length, values };
}

function buildBreakdownSection(
  title: string,
  profile: DatasetProfile,
  groupColumn: string | undefined,
  valueColumn: string | undefined,
  revenueTotal: number,
): { lines: string[]; segments: SegmentContribution[] } {
  if (!groupColumn) {
    return {
      lines: [`${title}: not computed (column not detected).`],
      segments: [],
    };
  }
  if (!valueColumn || revenueTotal <= 0) {
    return {
      lines: [`${title}: not computed (revenue measure unavailable).`],
      segments: [],
    };
  }

  const breakdown = aggregateSumByGroup(
    profile,
    groupColumn,
    valueColumn,
    revenueTotal,
  );
  if (breakdown.length === 0) {
    return {
      lines: [`${title}: not computed (no valid rows for ${groupColumn}).`],
      segments: [],
    };
  }

  const out = [
    `${title} (${valueColumn} by ${groupColumn}, verified):`,
    ...breakdown.map(
      (entry) =>
        `- ${entry.label}: ${formatCurrency(entry.sum)} (${formatNumber(entry.count)} row(s)); ${formatPercent(entry.share)} of revenue; rank #${entry.rank}`,
    ),
  ];

  if (breakdown.length >= 2) {
    const top = breakdown[0];
    const bottom = breakdown.at(-1)!;
    const gap = top.sum - bottom.sum;
    const ratio = bottom.sum > 0 ? (top.sum / bottom.sum - 1) * 100 : null;
    out.push(
      `- Top segment (${top.label}) vs lowest (${bottom.label}): ${formatCurrency(gap)} absolute gap${ratio != null ? `; top is ${formatPercent(ratio)} higher` : ""}.`,
    );
    if (breakdown.length === 2) {
      out.push(
        "- Comparison note: only two segments present; avoid labeling either as underperforming without an external benchmark.",
      );
    }
  }

  return {
    lines: out,
    segments: breakdown.map((entry) => ({
      label: entry.label,
      share: entry.share,
      rank: entry.rank,
    })),
  };
}

function buildUnitsSection(
  profile: DatasetProfile,
  roles: SalesColumnRoles,
): string[] {
  if (!roles.units) {
    return ["UNITS SOLD: not computed (units/quantity column not detected)."];
  }
  const { sum, count, values } = sumNumericColumn(profile, roles.units);
  if (count === 0) {
    return [`UNITS SOLD: not computed (no valid values in ${roles.units}).`];
  }
  const avg = sum / count;
  const max = Math.max(...values);
  const min = Math.min(...values);
  return [
    `UNITS SOLD (${roles.units}, verified):`,
    `- Total units: ${formatNumber(sum)} across ${formatNumber(count)} row(s).`,
    `- Average per row: ${formatNumber(avg)}; min ${formatNumber(min)}; max ${formatNumber(max)}.`,
  ];
}

function buildDiscountSection(profile: DatasetProfile): string[] {
  const discountColumns = pickDiscountColumns(profile);
  const columns = [
    discountColumns.amountColumn,
    discountColumns.percentColumn,
    discountColumns.discount,
  ].filter((value, index, array): value is string => {
    return Boolean(value) && array.indexOf(value) === index;
  });

  if (columns.length === 0) {
    return ["DISCOUNTS: not computed (discount column not detected)."];
  }

  const sections: string[] = [];
  for (const column of columns) {
    const metrics = computeDiscountMetrics(profile, column);
    if (!metrics) {
      sections.push(`DISCOUNTS (${column}): not computed (no valid values).`);
      continue;
    }
    sections.push(...formatDiscountMetricsBrief(metrics));
    sections.push("");
  }
  return sections.length > 0 ? sections.slice(0, -1) : sections;
}

export function buildVerifiedAnalyticalContext(
  profiles: DatasetProfile[],
): VerifiedAnalyticalContext {
  const profile = primaryProfile(profiles);
  if (!profile) {
    return {
      brief:
        "VERIFIED SALES ANALYTICAL BRIEF: no non-empty tabular dataset available.",
      limitations: ["No tabular rows were available for verified sales analysis."],
    };
  }

  const roles = resolveSalesColumnRoles(profile);
  const limitations: string[] = [];

  let revenueTotal = 0;
  let revenueRows = 0;
  if (roles.revenue) {
    const rollup = sumNumericColumn(profile, roles.revenue);
    revenueTotal = rollup.sum;
    revenueRows = rollup.count;
    if (revenueRows === 0) {
      limitations.push(
        `Revenue column "${roles.revenue}" had no parseable numeric values.`,
      );
    }
  } else {
    limitations.push("No primary revenue/numeric measure column was detected.");
  }

  const dateBounds: string[] = [];
  if (roles.date) {
    const dates: Date[] = [];
    for (const row of profile.dataset.rows) {
      const parsed = parseDate(row[roles.date]);
      if (parsed) dates.push(parsed);
    }
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      const first = monthBucketKey(dates[0]);
      const last = monthBucketKey(dates.at(-1)!);
      dateBounds.push(
        `Date coverage (${roles.date}): ${first} through ${last} (${formatNumber(dates.length)} dated row(s)).`,
      );
    } else {
      limitations.push(`Date column "${roles.date}" had no parseable values.`);
    }
  }

  const aov = revenueRows > 0 ? revenueTotal / revenueRows : null;
  const monthSeries = buildMonthSeries(profile, roles);
  const temporal =
    monthSeries.length > 0 ? analyzeTemporalPattern(monthSeries) : null;
  const anomalies = detectMonthlyAnomalies(monthSeries);

  const regional = buildBreakdownSection(
    "REGIONAL REVENUE",
    profile,
    roles.region,
    roles.revenue,
    revenueTotal,
  );
  const product = buildBreakdownSection(
    "PRODUCT / CATEGORY REVENUE",
    profile,
    roles.product,
    roles.revenue,
    revenueTotal,
  );
  const channel = buildBreakdownSection(
    "SALES CHANNEL REVENUE",
    profile,
    roles.channel,
    roles.revenue,
    revenueTotal,
  );
  const customer = buildBreakdownSection(
    "CUSTOMER TYPE REVENUE",
    profile,
    roles.customer,
    roles.revenue,
    revenueTotal,
  );

  const concentrations = [
    analyzeConcentration("region", regional.segments),
    analyzeConcentration("product/category", product.segments),
    analyzeConcentration("sales channel", channel.segments),
    analyzeConcentration("customer type", customer.segments),
  ].filter((item): item is NonNullable<typeof item> => item != null);

  const verifiedFindingCandidates = buildVerifiedFindingCandidates(
    temporal,
    anomalies,
    concentrations,
    revenueTotal,
  );

  const sections: string[] = [
    "VERIFIED SALES ANALYTICAL BRIEF (authoritative — cite only these figures for numeric claims; do not estimate missing metrics):",
    "",
    "DATASET",
    `- Label: ${profile.label}`,
    `- Rows in table: ${formatNumber(profile.rowCount)}`,
    `- Detected roles: revenue=${roles.revenue ?? "n/a"}, date=${roles.date ?? "n/a"}, region=${roles.region ?? "n/a"}, product=${roles.product ?? "n/a"}, channel=${roles.channel ?? "n/a"}, customer=${roles.customer ?? "n/a"}, units=${roles.units ?? "n/a"}, discount=${roles.discount ?? "n/a"}`,
    ...dateBounds,
    "",
    "HEADLINE METRICS",
  ];

  if (roles.revenue && revenueRows > 0) {
    sections.push(
      `- Total revenue (${roles.revenue}): ${formatCurrency(revenueTotal)} across ${formatNumber(revenueRows)} row(s) with values.`,
    );
    if (aov != null) {
      sections.push(`- Average order value: ${formatCurrency(aov)}.`);
    }
  } else {
    sections.push("- Total revenue: not computed.");
  }

  sections.push(
    "",
    ...(roles.revenue && monthSeries.length > 0
      ? formatMonthlyRevenueSection(monthSeries, revenueTotal, roles.revenue!)
      : ["MONTHLY REVENUE: not computed (date or revenue column unavailable)."]),
    "",
    ...(temporal ? formatTemporalInsightsSection(temporal) : []),
    "",
    ...formatAnomalySection(anomalies),
    "",
    "REVENUE CONCENTRATION (observations only — not risk labels):",
    ...(concentrations.length > 0
      ? concentrations.map((item) => `- ${item.observation}`)
      : ["- Concentration not computed (insufficient dimensional breakdowns)."]),
    "",
    ...regional.lines,
    "",
    ...product.lines,
    "",
    ...channel.lines,
    "",
    ...customer.lines,
    "",
    ...buildUnitsSection(profile, roles),
    "",
    ...buildDiscountSection(profile),
    "",
    ...formatVerifiedFindingCandidates(verifiedFindingCandidates),
    "",
    "MISSING BUSINESS DIMENSIONS (informational — not a data defect):",
    ...missingBusinessDimensions(roles).map((note) => `- ${note}`),
  );

  if (temporal?.insufficientForTrend) {
    limitations.push(
      "Fewer than 3 months of revenue history — trend language should stay cautious.",
    );
  }

  return {
    brief: sections.join("\n"),
    limitations,
  };
}