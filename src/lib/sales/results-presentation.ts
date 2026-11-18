import type { ColumnMissingStat, SalesIntelligence, SalesKpi } from "@/types/sales-intelligence";

export type KpiPartition = {
  hero: SalesKpi | undefined;
  supporting: SalesKpi[];
};

export function partitionSalesKpis(kpis: SalesKpi[]): KpiPartition {
  const hero = kpis.find((kpi) => kpi.id === "total_revenue");
  const supporting = kpis.filter((kpi) => kpi.id !== "total_revenue");
  return { hero, supporting };
}

export function formatPeriodCoverage(
  intelligence: SalesIntelligence | null | undefined,
): string | null {
  if (!intelligence) return null;

  const timeSeries = intelligence.charts.find(
    (chart) => chart.kind === "revenue_over_time",
  );
  if (timeSeries && timeSeries.points.length > 0) {
    const first = timeSeries.points[0].label;
    const last = timeSeries.points.at(-1)?.label;
    if (last && first !== last) return `${first} – ${last}`;
    return first;
  }

  if (intelligence.dateColumn) {
    return `Period from column “${intelligence.dateColumn}”`;
  }

  return null;
}

export function hasChartKind(
  intelligence: SalesIntelligence | null | undefined,
  kind: SalesIntelligence["charts"][number]["kind"],
): boolean {
  return intelligence?.charts.some((chart) => chart.kind === kind) ?? false;
}

export function filterRedundantIntegrityWarnings(
  items: string[],
  missingStats: ColumnMissingStat[],
): string[] {
  if (missingStats.length === 0) return items;

  return items.filter((item) => {
    const lower = item.toLowerCase();
    if (!lower.includes("missing")) return true;
    if (!lower.startsWith("integrity:")) return true;

    return !missingStats.some((row) =>
      lower.includes(row.column.toLowerCase()),
    );
  });
}

export function dedupeFindings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item.trim());
  }
  return result;
}