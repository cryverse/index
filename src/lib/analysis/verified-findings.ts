import { formatCurrency, formatPercent } from "./coerce";
import type { VerifiedAnomaly } from "./anomaly-detection";
import type { ConcentrationSnapshot } from "./concentration";
import type { TemporalAnalysis } from "./temporal-insights";

export function buildVerifiedFindingCandidates(
  temporal: TemporalAnalysis | null,
  anomalies: VerifiedAnomaly[],
  concentrations: ConcentrationSnapshot[],
  revenueTotal: number,
): string[] {
  const findings: string[] = [];
  const seen = new Set<string>();

  const add = (text: string) => {
    const key = text.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    findings.push(text);
  };

  if (temporal) {
    if (temporal.firstToLastChangePercent != null) {
      const direction =
        temporal.firstToLastChangePercent >= 0 ? "increase" : "decrease";
      add(
        `Verified: Revenue ${direction}d ${formatPercent(Math.abs(temporal.firstToLastChangePercent))} from ${temporal.months[0].period} to ${temporal.months.at(-1)!.period} (observed change${temporal.insufficientForTrend ? "; short series — not an established trend" : ""}).`,
      );
    }

    if (temporal.peak.period !== temporal.low.period) {
      add(
        `Verified: Peak month ${temporal.peak.period} at ${formatCurrency(temporal.peak.revenue)}; lowest month ${temporal.low.period} at ${formatCurrency(temporal.low.revenue)}.`,
      );
    }

    if (temporal.consecutiveDecline >= 2) {
      add(
        `Verified: ${temporal.consecutiveDecline} consecutive month-over-month revenue declines observed.`,
      );
    }

    if (temporal.consecutiveGrowth >= 2) {
      add(
        `Verified: ${temporal.consecutiveGrowth} consecutive month-over-month revenue increases observed.`,
      );
    }

    if (temporal.missingMonthGaps.length > 0) {
      add(
        `Verified: Missing months within stated coverage: ${temporal.missingMonthGaps.join(", ")}.`,
      );
    }

    if (
      temporal.coefficientOfVariation != null &&
      temporal.coefficientOfVariation >= 25 &&
      temporal.months.length >= 3
    ) {
      add(
        `Verified: Monthly revenue variation is elevated (CV ${formatPercent(temporal.coefficientOfVariation)}).`,
      );
    }
  }

  for (const anomaly of anomalies) {
    add(
      `Verified anomaly (${anomaly.metric}): ${anomaly.period} is unusually ${anomaly.direction} versus median baseline (${anomaly.note.replace(" Cause not inferred.", "")}).`,
    );
  }

  for (const snapshot of concentrations) {
    add(`Verified concentration observation: ${snapshot.observation}`);
  }

  if (revenueTotal > 0 && findings.length === 0) {
    add(
      "Verified: Limited temporal or segment variation detected; additional months or dimensions would improve pattern detection.",
    );
  }

  return findings.slice(0, 8);
}

export function formatVerifiedFindingCandidates(findings: string[]): string[] {
  if (findings.length === 0) {
    return [
      "VERIFIED FINDING CANDIDATES:",
      "- No additional verified observations beyond headline metrics.",
    ];
  }

  return [
    "VERIFIED FINDING CANDIDATES (prioritize these for keyFindings; do not duplicate wording; distinct from recommendations):",
    ...findings.map((finding) => `- ${finding}`),
  ];
}