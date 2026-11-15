import type { ResearchMetric } from "@/types/research";
import {
  formatNumber,
  formatPercent,
  isBlank,
  parseDate,
  parseNumber,
} from "./coerce";
import type { DatasetProfile, PlannedOperation } from "./types";

function datasetKey(profile: DatasetProfile): string {
  return profile.label;
}

function pickColumn(
  columns: string[],
  question: string,
  fallback?: string,
): string | undefined {
  const normalizedQuestion = question.toLowerCase();
  const matched = columns.find((column) =>
    normalizedQuestion.includes(column.toLowerCase().replace(/[_-]/g, " ")),
  );
  return matched ?? fallback ?? columns[0];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function metric(
  label: string,
  value: string,
  context: string,
  source: string,
): ResearchMetric {
  return { label, value, context: `${context} · ${source}` };
}

export function runOverview(
  profile: DatasetProfile,
): { lines: string[]; metrics: ResearchMetric[] } {
  if (profile.rowCount === 0) {
    return {
      lines: [`${profile.label}: empty dataset.`],
      metrics: [],
    };
  }

  const lines = [
    `${profile.label}`,
    `Rows: ${profile.rowCount}`,
    `Columns: ${profile.columns.length}`,
    ...profile.columns.map(
      (column) =>
        `- ${column.name}: ${column.kind} (${column.nonEmptyCount} non-empty)`,
    ),
  ];

  const metrics = [
    metric(
      `${profile.label} · rows`,
      formatNumber(profile.rowCount),
      "Dataset overview",
      profile.label,
    ),
    metric(
      `${profile.label} · columns`,
      formatNumber(profile.columns.length),
      "Dataset overview",
      profile.label,
    ),
  ];

  return { lines, metrics };
}

export function runMissingValues(profile: DatasetProfile): {
  lines: string[];
  metrics: ResearchMetric[];
} {
  const lines: string[] = [`${profile.label} · missing values`];
  const metrics: ResearchMetric[] = [];

  for (const column of profile.columns) {
    if (profile.rowCount === 0) continue;
    lines.push(
      `- ${column.name}: ${column.missingCount} missing (${formatPercent(column.missingPercent)})`,
    );
    if (column.missingCount > 0) {
      metrics.push(
        metric(
          `${profile.label} · ${column.name} missing`,
          formatPercent(column.missingPercent),
          `${column.missingCount} missing values`,
          profile.label,
        ),
      );
    }
  }

  return { lines, metrics };
}

export function runNumericSummaries(profile: DatasetProfile): {
  lines: string[];
  metrics: ResearchMetric[];
} {
  const lines: string[] = [`${profile.label} · numeric summaries`];
  const metrics: ResearchMetric[] = [];

  for (const columnName of profile.numericColumns) {
    const values = profile.dataset.rows
      .map((row) => parseNumber(row[columnName]))
      .filter((value): value is number => value != null);

    if (values.length === 0) {
      lines.push(`- ${columnName}: no valid numeric values`);
      continue;
    }

    const sum = values.reduce((acc, value) => acc + value, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const med = median(values);

    lines.push(
      `- ${columnName}: count=${values.length}, sum=${formatNumber(sum)}, avg=${formatNumber(avg)}, min=${formatNumber(min)}, max=${formatNumber(max)}, median=${med != null ? formatNumber(med) : "n/a"}`,
    );

    metrics.push(
      metric(
        `${profile.label} · ${columnName} average`,
        formatNumber(avg),
        `Based on ${values.length} values`,
        profile.label,
      ),
      metric(
        `${profile.label} · ${columnName} total`,
        formatNumber(sum),
        `Based on ${values.length} values`,
        profile.label,
      ),
    );
  }

  return { lines, metrics };
}

export function runGroupedAggregate(
  profile: DatasetProfile,
  question: string,
): { lines: string[]; metrics: ResearchMetric[] } {
  const valueColumn = pickColumn(profile.numericColumns, question);
  const groupColumn = pickColumn(profile.categoricalColumns, question);

  if (!valueColumn || !groupColumn) {
    return {
      lines: [
        `${profile.label} · grouped aggregate skipped (missing numeric or categorical column).`,
      ],
      metrics: [],
    };
  }

  const buckets = new Map<string, { sum: number; count: number }>();
  for (const row of profile.dataset.rows) {
    const groupValue = row[groupColumn];
    const numericValue = parseNumber(row[valueColumn]);
    if (isBlank(groupValue) || numericValue == null) continue;
    const key = String(groupValue).trim();
    const current = buckets.get(key) ?? { sum: 0, count: 0 };
    current.sum += numericValue;
    current.count += 1;
    buckets.set(key, current);
  }

  const entries = [...buckets.entries()]
    .map(([group, stats]) => ({
      group,
      sum: stats.sum,
      avg: stats.count > 0 ? stats.sum / stats.count : 0,
      count: stats.count,
    }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 12);

  const lines = [
    `${profile.label} · grouped aggregate`,
    `Group by ${groupColumn}, aggregate ${valueColumn}`,
    ...entries.map(
      (entry) =>
        `- ${entry.group}: sum=${formatNumber(entry.sum)}, avg=${formatNumber(entry.avg)}, count=${entry.count}`,
    ),
  ];

  const top = entries[0];
  const metrics = top
    ? [
        metric(
          `${profile.label} · top ${groupColumn} by ${valueColumn}`,
          top.group,
          `Sum ${formatNumber(top.sum)} across ${top.count} rows`,
          profile.label,
        ),
      ]
    : [];

  return { lines, metrics };
}

type TrendBucket = "day" | "month" | "year";

function detectTrendBucket(question: string): TrendBucket {
  const q = question.toLowerCase();
  if (q.includes("daily") || q.includes("day")) return "day";
  if (q.includes("year") || q.includes("annual")) return "year";
  return "month";
}

function bucketKey(date: Date, bucket: TrendBucket): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  if (bucket === "year") return `${year}`;
  if (bucket === "day") return `${year}-${month}-${day}`;
  return `${year}-${month}`;
}

export function runDateTrend(
  profile: DatasetProfile,
  question: string,
): { lines: string[]; metrics: ResearchMetric[] } {
  const valueColumn = pickColumn(profile.numericColumns, question);
  const dateColumn = pickColumn(profile.dateColumns, question);
  if (!valueColumn || !dateColumn) {
    return {
      lines: [
        `${profile.label} · date trend skipped (missing date or numeric column).`,
      ],
      metrics: [],
    };
  }

  const bucket = detectTrendBucket(question);
  const totals = new Map<string, { sum: number; count: number }>();

  for (const row of profile.dataset.rows) {
    const dateValue = parseDate(row[dateColumn]);
    const numericValue = parseNumber(row[valueColumn]);
    if (!dateValue || numericValue == null) continue;
    const key = bucketKey(dateValue, bucket);
    const current = totals.get(key) ?? { sum: 0, count: 0 };
    current.sum += numericValue;
    current.count += 1;
    totals.set(key, current);
  }

  const entries = [...totals.entries()]
    .map(([period, stats]) => ({
      period,
      sum: stats.sum,
      avg: stats.count > 0 ? stats.sum / stats.count : 0,
      count: stats.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-12);

  const lines = [
    `${profile.label} · date trend (${bucket})`,
    `Date column ${dateColumn}, measure ${valueColumn}`,
    ...entries.map(
      (entry) =>
        `- ${entry.period}: sum=${formatNumber(entry.sum)}, avg=${formatNumber(entry.avg)}, count=${entry.count}`,
    ),
  ];

  const last = entries.at(-1);
  const first = entries[0];
  const metrics: ResearchMetric[] = [];
  if (first && last && first.period !== last.period) {
    const change = last.sum - first.sum;
    metrics.push(
      metric(
        `${profile.label} · ${valueColumn} change`,
        formatNumber(change),
        `From ${first.period} to ${last.period} (${bucket} buckets)`,
        profile.label,
      ),
    );
  }

  return { lines, metrics };
}

export function runRanking(
  profile: DatasetProfile,
  question: string,
): { lines: string[]; metrics: ResearchMetric[] } {
  const valueColumn = pickColumn(profile.numericColumns, question);
  if (!valueColumn) {
    return {
      lines: [`${profile.label} · ranking skipped (no numeric column).`],
      metrics: [],
    };
  }

  const values = profile.dataset.rows
    .map((row, index) => ({
      index,
      value: parseNumber(row[valueColumn]),
      row,
    }))
    .filter((entry): entry is { index: number; value: number; row: Record<string, unknown> } =>
      entry.value != null,
    );

  if (values.length === 0) {
    return {
      lines: [`${profile.label} · ranking skipped (no valid values).`],
      metrics: [],
    };
  }

  const ascending = question.toLowerCase().includes("lowest") ||
    question.toLowerCase().includes("smallest") ||
    question.toLowerCase().includes("bottom");
  const sorted = [...values].sort((a, b) =>
    ascending ? a.value - b.value : b.value - a.value,
  );
  const top = sorted.slice(0, 5);

  const lines = [
    `${profile.label} · ranking (${ascending ? "lowest" : "highest"} ${valueColumn})`,
    ...top.map((entry, rank) => `- #${rank + 1}: ${formatNumber(entry.value)}`),
  ];

  const metrics = top[0]
    ? [
        metric(
          `${profile.label} · ${ascending ? "lowest" : "highest"} ${valueColumn}`,
          formatNumber(top[0].value),
          `Top ranked value from ${values.length} valid rows`,
          profile.label,
        ),
      ]
    : [];

  return { lines, metrics };
}

export function executeOperation(
  operation: PlannedOperation,
  profile: DatasetProfile,
  question: string,
): { lines: string[]; metrics: ResearchMetric[] } {
  switch (operation.kind) {
    case "overview":
      return runOverview(profile);
    case "missing_values":
      return runMissingValues(profile);
    case "numeric_summary":
      return runNumericSummaries(profile);
    case "grouped_aggregate":
      return runGroupedAggregate(profile, question);
    case "date_trend":
      return runDateTrend(profile, question);
    case "ranking":
      return runRanking(profile, question);
    default:
      return { lines: [], metrics: [] };
  }
}

export function profileLookup(
  profiles: DatasetProfile[],
  label: string,
): DatasetProfile | undefined {
  return profiles.find((profile) => datasetKey(profile) === label);
}