"use client";

import {
  PerformanceCharts,
  UnavailableChartCard,
} from "@/components/sales/performance-charts";
import {
  categorizeLimitation,
  classifyFindingTone,
  dedupeLimitations,
  FINDING_TONE_LABEL,
  type FindingTone,
  type LimitationCategory,
} from "@/lib/sales/presentation";
import {
  dedupeFindings,
  filterRedundantIntegrityWarnings,
  formatPeriodCoverage,
  hasChartKind,
  partitionSalesKpis,
} from "@/lib/sales/results-presentation";
import type { SalesKpi } from "@/types/sales-intelligence";
import type { ResearchAgentResult } from "@/types/research";
import { format } from "date-fns";
import type { ReactNode } from "react";
import { useMemo } from "react";

type AnalysisResultsProps = {
  result: ResearchAgentResult;
  datasetName: string;
  onStartOver?: () => void;
};

const TONE_STYLES: Record<
  Exclude<FindingTone, null>,
  { border: string; accent: string; label: string }
> = {
  critical: {
    border: "border-red-500/25",
    accent: "text-red-300/90",
    label: "text-red-300/85",
  },
  opportunity: {
    border: "border-emerald-500/25",
    accent: "text-emerald-300/90",
    label: "text-emerald-300/85",
  },
  neutral: {
    border: "border-border-subtle",
    accent: "text-foreground/75",
    label: "text-muted",
  },
};

export function AnalysisResults({
  result,
  datasetName,
  onStartOver,
}: AnalysisResultsProps) {
  const generatedLabel = format(
    new Date(result.generatedAt),
    "MMM d, yyyy · h:mm a",
  );

  const intelligence = result.intelligence;
  const hasCharts = (intelligence?.charts.length ?? 0) > 0;
  const hasKpis = (intelligence?.kpis.length ?? 0) > 0;
  const missingStats = useMemo(
    () => intelligence?.missingByColumn ?? [],
    [intelligence?.missingByColumn],
  );
  const missingDimensions = useMemo(
    () => intelligence?.missingDimensions ?? [],
    [intelligence?.missingDimensions],
  );
  const periodLabel = formatPeriodCoverage(intelligence);
  const kpiPartition = useMemo(
    () => partitionSalesKpis(intelligence?.kpis ?? []),
    [intelligence?.kpis],
  );

  const limitationsGrouped = useMemo(() => {
    const buckets: Record<LimitationCategory, string[]> = {
      integrity: [],
      scope: [],
      dimension: [],
      general: [],
    };
    const uniqueLimitations = dedupeLimitations(result.limitations);
    for (const item of uniqueLimitations) {
      const category = categorizeLimitation(item);
      if (
        category === "dimension" &&
        missingDimensions.some(
          (dim) =>
            item.toLowerCase().includes(dim.toLowerCase().slice(0, 24)) ||
            dim.toLowerCase().includes(item.toLowerCase().slice(0, 24)),
        )
      ) {
        continue;
      }
      buckets[category].push(item);
    }

    buckets.integrity = filterRedundantIntegrityWarnings(
      buckets.integrity,
      missingStats,
    );

    return buckets;
  }, [result.limitations, missingDimensions, missingStats]);

  const businessDimensionNotes = useMemo(
    () =>
      dedupeLimitations([
        ...missingDimensions,
        ...limitationsGrouped.dimension,
      ]),
    [missingDimensions, limitationsGrouped.dimension],
  );

  const keyFindings = useMemo(
    () => dedupeFindings(result.keyFindings),
    [result.keyFindings],
  );

  const recommendations = result.recommendations;

  const summaryParagraphs = useMemo(
    () =>
      result.executiveSummary
        .split(/\n{2,}|\n/)
        .map((part) => part.trim())
        .filter(Boolean),
    [result.executiveSummary],
  );
  const leadSummary = summaryParagraphs[0];
  const supportingSummary = summaryParagraphs.slice(1);

  const showDataQuality =
    intelligence != null ||
    missingStats.length > 0 ||
    result.limitations.length > 0 ||
    missingDimensions.length > 0;

  const missingChartNotes = useMemo(() => {
    if (!intelligence) return [];
    const notes: { title: string; reason: string }[] = [];
    if (
      !hasChartKind(intelligence, "revenue_over_time") &&
      !intelligence.dateColumn
    ) {
      notes.push({
        title: "Revenue over time",
        reason: "No date column was detected for a verified time series.",
      });
    }
    if (
      !hasChartKind(intelligence, "regional_performance") &&
      !intelligence.regionColumn
    ) {
      notes.push({
        title: "Performance by region",
        reason: "No regional or territory column was available in this file.",
      });
    }
    if (
      !hasChartKind(intelligence, "product_performance") &&
      !intelligence.productColumn
    ) {
      notes.push({
        title: "Performance by product",
        reason: "No product or category column was available in this file.",
      });
    }
    return notes;
  }, [intelligence]);

  return (
    <div className="w-full max-w-full space-y-10" aria-label="Sales analysis results">
      <header className="border-border-subtle bg-surface-elevated/50 flex flex-col gap-4 rounded-2xl border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            Sales intelligence
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {result.title}
          </h2>
          <dl className="text-muted mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <MetaRow label="Dataset">
              <span className="text-foreground break-all font-mono">
                {datasetName}
              </span>
            </MetaRow>
            <MetaRow label="Analyzed">{generatedLabel}</MetaRow>
            {intelligence?.datasetLabel ? (
              <MetaRow label="Source">
                <span className="break-words">{intelligence.datasetLabel}</span>
              </MetaRow>
            ) : null}
            {periodLabel ? (
              <MetaRow label="Period covered">
                <span className="text-foreground font-mono text-[11px]">
                  {periodLabel}
                </span>
              </MetaRow>
            ) : null}
            {intelligence?.recordCount != null ? (
              <MetaRow label="Records analyzed">
                <span className="text-foreground font-mono tabular-nums">
                  {intelligence.recordCount.toLocaleString("en-US")}
                </span>
              </MetaRow>
            ) : null}
          </dl>
        </div>
        {onStartOver ? (
          <button
            type="button"
            onClick={onStartOver}
            className="border-border-strong hover:bg-surface shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            New analysis
          </button>
        ) : null}
      </header>

      <section className="border-border-subtle bg-surface/40 rounded-2xl border p-5 sm:p-6">
        <SectionHeading title="Executive overview" badge="Interpretation" />
        {hasKpis ? (
          <ExecutiveKpiBlock
            hero={kpiPartition.hero}
            supporting={kpiPartition.supporting}
          />
        ) : null}

        <div className="mt-6 space-y-3">
          {leadSummary ? (
            <p className="text-foreground text-base leading-7 font-medium text-pretty sm:text-[1.0625rem]">
              {leadSummary}
            </p>
          ) : null}
          {supportingSummary.map((paragraph) => (
            <p
              key={paragraph}
              className="text-foreground/85 text-[0.9375rem] leading-7 text-pretty"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {(hasCharts || missingChartNotes.length > 0) && intelligence ? (
        <section className="border-border-subtle bg-surface/40 rounded-2xl border p-5 sm:p-6">
          <SectionHeading title="Sales performance" badge="Verified" />
          <p className="text-muted mt-2 text-xs leading-relaxed">
            Charts use the same verified totals as the KPIs above. Hover for
            exact values.
          </p>
          <div className="mt-4">
            {hasCharts ? (
              <PerformanceCharts series={intelligence.charts} />
            ) : null}
            {missingChartNotes.length > 0 ? (
              <div
                className={[
                  "grid gap-4",
                  hasCharts ? "mt-4 lg:grid-cols-2" : "lg:grid-cols-2",
                ].join(" ")}
              >
                {missingChartNotes.map((item) => (
                  <UnavailableChartCard
                    key={item.title}
                    title={item.title}
                    reason={item.reason}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {keyFindings.length > 0 ? (
        <section className="border-border-subtle/80 rounded-2xl border border-dashed px-5 py-5 sm:px-6">
          <SectionHeading title="Key findings" badge="Interpretation" />
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {keyFindings.map((finding) => (
              <FindingCard key={finding} finding={finding} />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <SectionHeading title="AI recommendations" badge="Interpretation" />
        {recommendations.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {recommendations.map((item, index) => (
              <li
                key={`${index}-${item.action}`}
                className="border-border-subtle bg-surface-elevated/50 rounded-xl border px-4 py-4 sm:px-5 sm:py-5"
              >
                <div className="flex gap-3 sm:gap-4">
                  <span
                    className="text-muted bg-surface border-border-subtle flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-semibold tabular-nums"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm leading-snug font-semibold tracking-tight text-pretty sm:text-[0.9375rem]">
                      {item.action}
                    </p>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div>
                        <dt className="text-muted text-[11px] font-medium tracking-wide uppercase">
                          Supported by
                        </dt>
                        <dd className="text-foreground/80 mt-1 leading-relaxed text-pretty">
                          {item.supportedBy}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted text-[11px] font-medium tracking-wide uppercase">
                          Intended outcome
                        </dt>
                        <dd className="text-foreground/75 mt-1 leading-relaxed text-pretty">
                          {item.intendedOutcome}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="border-border-subtle bg-surface/30 mt-4 rounded-xl border border-dashed px-4 py-5 sm:px-5">
            <p className="text-foreground/90 text-sm font-medium">
              No validated recommendations for this run
            </p>
            <p className="text-muted mt-2 text-sm leading-relaxed text-pretty">
              The model did not produce recommendations that passed server-side
              validation, or the dataset did not support confident actions.
              Review verified KPIs, charts, and data quality notes above.
            </p>
          </div>
        )}
      </section>

      {showDataQuality ? (
        <section className="border-border-subtle bg-surface/40 space-y-5 rounded-2xl border p-5 sm:p-6">
          <SectionHeading title="Data quality & scope" badge="Verified" />
          <p className="text-muted text-sm leading-relaxed text-pretty">
            Warnings describe parsing, coverage, and optional dimensions. They
            do not automatically invalidate verified totals unless noted as a
            blocking parse error.
          </p>

          <DataQualityBlock
            title="Missing values & integrity"
            description="Cell gaps and parsing issues that can affect interpretation."
          >
            {missingStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-left text-sm">
                  <thead>
                    <tr className="text-muted text-xs tracking-wide uppercase">
                      <th className="pb-2 font-medium">Column</th>
                      <th className="pb-2 font-medium">Missing</th>
                      <th className="pb-2 pr-2 text-right font-medium sm:text-left">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border-subtle divide-y">
                    {missingStats.map((row) => (
                      <tr key={row.column}>
                        <td className="py-2.5 break-all font-mono text-xs">
                          {row.column}
                        </td>
                        <td className="text-muted py-2.5 tabular-nums">
                          {row.missingCount.toLocaleString("en-US")}
                        </td>
                        <td className="text-muted py-2.5 pr-2 text-right font-mono text-xs tabular-nums sm:text-left">
                          {row.missingPercent.toLocaleString("en-US", {
                            maximumFractionDigits: 1,
                          })}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-sm">
                No column-level missing values were detected in the primary
                table.
              </p>
            )}
            {limitationsGrouped.integrity.length > 0 ? (
              <LimitationList
                items={limitationsGrouped.integrity}
                className="mt-3"
              />
            ) : null}
          </DataQualityBlock>

          <DataQualityBlock
            title="Dataset scope & file limits"
            description="Upload size, worksheets, PDF extraction, and sample coverage."
          >
            {limitationsGrouped.scope.length > 0 ||
            limitationsGrouped.general.length > 0 ? (
              <LimitationList
                items={[
                  ...limitationsGrouped.scope,
                  ...limitationsGrouped.general,
                ]}
              />
            ) : (
              <p className="text-muted text-sm">
                No file or scope limitations were reported beyond integrity
                checks.
              </p>
            )}
          </DataQualityBlock>

          <DataQualityBlock
            title="Optional business dimensions"
            description="Informational — absent columns limit segmentation, not row counts."
          >
            {businessDimensionNotes.length > 0 ? (
              <LimitationList items={businessDimensionNotes} />
            ) : (
              <p className="text-muted text-sm">
                Core segmentation columns used in this analysis were detected.
              </p>
            )}
          </DataQualityBlock>
        </section>
      ) : null}

      {result.verifiedMetrics.length > 0 ? (
        <details className="border-border-subtle bg-surface/30 rounded-2xl border px-5 py-4 sm:px-6">
          <summary className="cursor-pointer text-sm font-medium tracking-tight">
            Supporting verified calculations
            <span className="text-muted ml-2 text-xs font-normal">
              ({result.verifiedMetrics.length})
            </span>
          </summary>
          <ul className="divide-border-subtle mt-4 divide-y">
            {result.verifiedMetrics.map((metric) => (
              <li
                key={`${metric.label}-${metric.value}`}
                className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-muted mt-0.5 text-xs leading-relaxed text-pretty">
                    {metric.context}
                  </p>
                </div>
                <p className="text-foreground shrink-0 font-mono text-sm sm:text-right">
                  {metric.value}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-foreground/70 shrink-0">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function ExecutiveKpiBlock({
  hero,
  supporting,
}: {
  hero: SalesKpi | undefined;
  supporting: SalesKpi[];
}) {
  return (
    <div className="mt-5 space-y-3">
      {hero ? (
        <div className="border-border-subtle bg-surface-elevated/70 rounded-xl border px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-muted text-xs tracking-wide uppercase">
            {hero.label}
          </p>
          <p className="text-foreground mt-2 font-mono text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {hero.value}
          </p>
          {hero.helperText ? (
            <p className="text-muted mt-3 max-w-prose text-xs leading-relaxed">
              {hero.helperText}
            </p>
          ) : null}
        </div>
      ) : null}

      {supporting.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {supporting.map((kpi) => (
            <div
              key={kpi.id}
              className="border-border-subtle bg-surface/50 rounded-xl border px-4 py-4"
            >
              <dt className="text-muted text-xs tracking-wide uppercase">
                {kpi.label}
              </dt>
              <dd className="text-foreground mt-2 font-mono text-xl font-medium tracking-tight tabular-nums">
                {kpi.value}
              </dd>
              {kpi.helperText ? (
                <p className="text-muted mt-2 text-xs leading-relaxed">
                  {kpi.helperText}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function FindingCard({ finding }: { finding: string }) {
  const tone = classifyFindingTone(finding);
  const borderClass =
    tone != null ? TONE_STYLES[tone].border : "border-border-subtle";

  return (
    <li
      className={`bg-surface/40 rounded-xl border px-4 py-4 sm:px-5 ${borderClass}`}
    >
      {tone != null ? (
        <p
          className={`mb-2 text-[11px] font-semibold tracking-wide uppercase ${TONE_STYLES[tone].label}`}
        >
          {FINDING_TONE_LABEL[tone]}
        </p>
      ) : null}
      <p
        className={
          tone != null
            ? "text-foreground/85 text-sm leading-relaxed text-pretty"
            : "text-foreground/90 text-sm leading-relaxed text-pretty"
        }
      >
        {finding}
      </p>
    </li>
  );
}

function DataQualityBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border-subtle rounded-xl border px-4 py-4 sm:px-5">
      <h4 className="text-sm font-medium tracking-tight">{title}</h4>
      <p className="text-muted mt-1 text-xs leading-relaxed">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function LimitationList({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul
      className={`text-muted list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-foreground/35 ${className}`}
    >
      {items.map((item) => (
        <li key={item} className="break-words text-pretty">
          {item}
        </li>
      ))}
    </ul>
  );
}

function SectionHeading({
  title,
  badge,
}: {
  title: string;
  badge: string;
}) {
  const isVerified = badge === "Verified";
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <span
        className={[
          "rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
          isVerified
            ? "border-border-strong text-foreground/75 border"
            : "text-muted border-border-subtle border",
        ].join(" ")}
      >
        {badge}
      </span>
    </div>
  );
}