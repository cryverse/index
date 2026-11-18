import { formatPercent } from "./coerce";

export type SegmentContribution = {
  label: string;
  share: number;
  rank: number;
};

export type ConcentrationSnapshot = {
  dimension: string;
  segmentCount: number;
  topShare: number;
  topLabel: string;
  topTwoShare: number;
  observation: string;
};

export function analyzeConcentration(
  dimension: string,
  segments: SegmentContribution[],
): ConcentrationSnapshot | null {
  if (segments.length < 2) return null;

  const sorted = [...segments].sort((a, b) => b.share - a.share);
  const top = sorted[0];
  const second = sorted[1];
  const topTwoShare = top.share + second.share;

  let observation =
    `Top segment (${top.label}) contributes ${formatPercent(top.share)} of revenue in ${dimension}.`;
  if (topTwoShare >= 70) {
    observation += ` Top two segments combine for ${formatPercent(topTwoShare)} (concentration observation only — not labeled as risk).`;
  }

  return {
    dimension,
    segmentCount: segments.length,
    topShare: top.share,
    topLabel: top.label,
    topTwoShare,
    observation,
  };
}