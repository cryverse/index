import { formatCurrency, formatNumber, formatPercent } from "./coerce";
import type { MonthPoint } from "./temporal-insights";

export type VerifiedAnomaly = {
  metric: string;
  period: string;
  value: number;
  baselineLabel: string;
  baselineValue: number;
  deviationPercent: number;
  direction: "high" | "low";
  note: string;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function detectSeriesAnomalies(
  metric: string,
  months: MonthPoint[],
  selector: (month: MonthPoint) => number,
  formatter: (value: number) => string,
  minMonths: number,
  thresholdRatio: number,
): VerifiedAnomaly[] {
  if (months.length < minMonths) return [];

  const values = months.map(selector);
  const baseline = median(values);
  if (baseline <= 0) return [];

  const anomalies: VerifiedAnomaly[] = [];
  for (const month of months) {
    const value = selector(month);
    const deviation = ((value - baseline) / baseline) * 100;
    if (Math.abs(deviation) < thresholdRatio * 100) continue;

    anomalies.push({
      metric,
      period: month.period,
      value,
      baselineLabel: `median ${metric} across ${months.length} months`,
      baselineValue: baseline,
      deviationPercent: deviation,
      direction: deviation > 0 ? "high" : "low",
      note: `${formatter(value)} vs baseline ${formatter(baseline)} (${deviation > 0 ? "+" : ""}${formatPercent(deviation)}). Cause not inferred.`,
    });
  }

  return anomalies.slice(0, 4);
}

export function detectMonthlyAnomalies(months: MonthPoint[]): VerifiedAnomaly[] {
  const revenue = detectSeriesAnomalies(
    "monthly revenue",
    months,
    (month) => month.revenue,
    formatCurrency,
    4,
    0.35,
  );
  const volume =
    months.length >= 4
      ? detectSeriesAnomalies(
          "transaction count",
          months,
          (month) => month.transactions,
          (value) => formatNumber(value),
          4,
          0.4,
        )
      : [];
  const aov =
    months.length >= 4
      ? detectSeriesAnomalies(
          "average order value",
          months,
          (month) => month.aov,
          formatCurrency,
          4,
          0.25,
        )
      : [];

  return [...revenue, ...volume, ...aov];
}

export function formatAnomalySection(anomalies: VerifiedAnomaly[]): string[] {
  if (anomalies.length === 0) {
    return [
      "ANOMALY SCREEN (relative to within-period median; verified):",
      "- No unusual monthly movements met the detection threshold for this dataset size.",
    ];
  }

  return [
    "ANOMALY SCREEN (relative to within-period median; verified; causes not assigned):",
    ...anomalies.map(
      (item) =>
        `- ${item.period} · ${item.metric}: ${item.note} Baseline: ${item.baselineLabel}.`,
    ),
  ];
}