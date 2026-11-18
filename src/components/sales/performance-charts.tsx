"use client";

import type { SalesChartSeries } from "@/types/sales-intelligence";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PerformanceChartsProps = {
  series: SalesChartSeries[];
};

const CHART_ACCENT = "var(--accent, #3b82f6)";
const CHART_GRID = "color-mix(in srgb, var(--muted, #a1a1aa) 22%, transparent)";
const CHART_TICK = "var(--muted, #a1a1aa)";
const CHART_TICK_MUTED = "color-mix(in srgb, var(--foreground, #fafafa) 72%, var(--muted, #a1a1aa))";

function isRevenueMeasure(measureLabel: string): boolean {
  return /revenue|sales|amount|gmv|price|total|value|income/i.test(
    measureLabel,
  );
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatTooltipValue(value: number, currency: boolean): string {
  if (currency) {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function truncateLabel(label: string, max = 20): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  currency: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border-strong bg-surface-elevated text-foreground max-w-[min(100vw-2rem,18rem)] rounded-lg border px-3 py-2 text-xs shadow-lg">
      <p className="font-medium break-words">{label}</p>
      <p className="text-muted mt-1 font-mono tabular-nums">
        {formatTooltipValue(payload[0].value, currency)}
      </p>
    </div>
  );
}

function chartDescription(chart: SalesChartSeries): string {
  if (chart.kind === "revenue_over_time") {
    return `Monthly verified totals from ${chart.measureLabel}.`;
  }
  return `Top segments by ${chart.measureLabel}${chart.groupLabel ? ` · grouped by ${chart.groupLabel}` : ""}.`;
}

export function PerformanceCharts({ series }: PerformanceChartsProps) {
  if (series.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {series.map((chart) => (
        <ChartPanel key={`${chart.kind}-${chart.title}`} chart={chart} />
      ))}
    </div>
  );
}

function ChartPanel({ chart }: { chart: SalesChartSeries }) {
  const currency = isRevenueMeasure(chart.measureLabel);
  const yAxisWidth = useMemo(() => {
    if (chart.kind === "revenue_over_time") return 52;
    const maxLen = Math.max(...chart.points.map((point) => point.label.length), 8);
    return Math.min(148, Math.max(76, Math.ceil(maxLen * 6.2)));
  }, [chart]);

  const points = useMemo(
    () =>
      chart.points.map((point) => ({
        ...point,
        shortLabel: truncateLabel(point.label),
        fullLabel: point.label,
      })),
    [chart.points],
  );

  return (
    <article className="border-border-subtle bg-surface/60 flex min-w-0 flex-col rounded-xl border p-4 sm:p-5">
      <header className="mb-3">
        <h4 className="text-sm font-medium tracking-tight">{chart.title}</h4>
        <p className="text-muted mt-1 text-xs leading-relaxed text-pretty">
          {chartDescription(chart)}
        </p>
      </header>
      <div className="h-56 w-full min-w-0 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          {chart.kind === "revenue_over_time" ? (
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatAxisValue}
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={yAxisWidth}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as
                    | { fullLabel?: string; label?: string }
                    | undefined;
                  return row?.fullLabel ?? row?.label ?? "";
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={CHART_ACCENT}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_ACCENT, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={points}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_GRID} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatAxisValue}
                tick={{ fill: CHART_TICK, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={yAxisWidth}
                tick={{ fill: CHART_TICK_MUTED, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltip currency={currency} />}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as
                    | { fullLabel?: string; shortLabel?: string }
                    | undefined;
                  return row?.fullLabel ?? row?.shortLabel ?? "";
                }}
              />
              <Bar
                dataKey="value"
                fill={CHART_ACCENT}
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </article>
  );
}

type UnavailableChartProps = {
  title: string;
  reason: string;
};

export function UnavailableChartCard({ title, reason }: UnavailableChartProps) {
  return (
    <article className="border-border-subtle bg-surface/30 flex min-h-56 min-w-0 flex-col justify-center rounded-xl border border-dashed px-5 py-6">
      <h4 className="text-foreground/85 text-sm font-medium tracking-tight">
        {title}
      </h4>
      <p className="text-muted mt-2 text-xs leading-relaxed text-pretty">
        {reason}
      </p>
    </article>
  );
}