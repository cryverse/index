import {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseNumber,
} from "./coerce";
import { matchColumn, type SalesColumnRoles } from "./column-roles";
import type { DatasetProfile } from "./types";

const DISCOUNT_PERCENT_NAME_PATTERNS = [
  "discountpercent",
  "discountpct",
  "discountrate",
  "discount_rate",
  "pctdiscount",
];

const DISCOUNT_AMOUNT_NAME_PATTERNS = [
  "discountamount",
  "discountvalue",
  "rebateamount",
  "markdownamount",
];

export type DiscountValueKind = "percentage" | "monetary";

export type DiscountMetrics = {
  column: string;
  valueKind: DiscountValueKind;
  monetaryAvailable: boolean;
  rowsWithValues: number;
  ordersWithDiscount: number;
  ordersWithDiscountShare: number;
  averageDiscountPercent: number | null;
  maxDiscountPercent: number | null;
  totalMonetaryDiscount: number | null;
  averageMonetaryDiscount: number | null;
  maxMonetaryDiscount: number | null;
  interpretationNote: string | null;
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[_\s-]+/g, "");
}

function inferValueKind(column: string, values: number[]): DiscountValueKind {
  const name = normalizeName(column);
  if (
    matchColumn([column], DISCOUNT_PERCENT_NAME_PATTERNS) ||
    /percent|pct|rate/.test(name)
  ) {
    return "percentage";
  }
  if (
    matchColumn([column], DISCOUNT_AMOUNT_NAME_PATTERNS) ||
    /amount|value|dollar|usd|monetary/.test(name)
  ) {
    return "monetary";
  }

  if (values.some((value) => value > 100)) {
    return "monetary";
  }

  if (values.length > 0 && values.every((value) => value >= 0 && value <= 100)) {
    return "percentage";
  }

  return "percentage";
}

export function pickDiscountColumns(
  profile: DatasetProfile,
): Pick<SalesColumnRoles, "discount"> & {
  percentColumn?: string;
  amountColumn?: string;
} {
  const percentColumn = matchColumn(
    profile.numericColumns,
    DISCOUNT_PERCENT_NAME_PATTERNS,
  );
  const amountColumn = matchColumn(
    profile.numericColumns,
    DISCOUNT_AMOUNT_NAME_PATTERNS,
  );
  const discount =
    percentColumn ??
    amountColumn ??
    matchColumn(profile.numericColumns, ["discount", "rebate", "markdown", "promo"]);

  return { discount, percentColumn, amountColumn };
}

function collectValues(
  profile: DatasetProfile,
  column: string,
): number[] {
  const values: number[] = [];
  for (const row of profile.dataset.rows) {
    const value = parseNumber(row[column]);
    if (value == null) continue;
    values.push(value);
  }
  return values;
}

export function computeDiscountMetrics(
  profile: DatasetProfile,
  column: string,
): DiscountMetrics | null {
  const values = collectValues(profile, column);
  if (values.length === 0) return null;

  const valueKind = inferValueKind(column, values);
  const ordersWithDiscount = values.filter((value) => value > 0).length;
  const ordersWithDiscountShare =
    values.length > 0 ? (ordersWithDiscount / values.length) * 100 : 0;

  let interpretationNote: string | null = null;
  const name = normalizeName(column);
  if (
    valueKind === "percentage" &&
    !/percent|pct|rate/.test(name) &&
    values.every((value) => value >= 0 && value <= 100)
  ) {
    interpretationNote =
      "Column name is ambiguous; values are in the 0–100 range and are reported as percentages. Total monetary discount is not computed from this column.";
  }

  if (valueKind === "percentage") {
    const positive = values.filter((value) => value > 0);
    const avg =
      positive.length > 0
        ? positive.reduce((sum, value) => sum + value, 0) / positive.length
        : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    return {
      column,
      valueKind: "percentage",
      monetaryAvailable: false,
      rowsWithValues: values.length,
      ordersWithDiscount,
      ordersWithDiscountShare,
      averageDiscountPercent: avg,
      maxDiscountPercent: max,
      totalMonetaryDiscount: null,
      averageMonetaryDiscount: null,
      maxMonetaryDiscount: null,
      interpretationNote,
    };
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  const avg = sum / values.length;
  const maxPositive = Math.max(0, ...values);

  return {
    column,
    valueKind: "monetary",
    monetaryAvailable: true,
    rowsWithValues: values.length,
    ordersWithDiscount,
    ordersWithDiscountShare,
    averageDiscountPercent: null,
    maxDiscountPercent: null,
    totalMonetaryDiscount: sum,
    averageMonetaryDiscount: avg,
    maxMonetaryDiscount: maxPositive,
    interpretationNote:
      values.some((value) => value > 0 && value <= 100)
        ? "Some values resemble percentages but column is treated as monetary based on magnitude or naming."
        : null,
  };
}

export function formatDiscountMetricsBrief(metrics: DiscountMetrics): string[] {
  const lines = [
    `DISCOUNTS (${metrics.column}, verified; value type: ${metrics.valueKind}):`,
    `- Orders with discount > 0: ${formatNumber(metrics.ordersWithDiscount)} of ${formatNumber(metrics.rowsWithValues)} row(s) (${formatPercent(metrics.ordersWithDiscountShare)}).`,
  ];

  if (metrics.valueKind === "percentage") {
    lines.push(
      `- Average discount percentage (on discounted rows): ${formatPercent(metrics.averageDiscountPercent ?? 0)}.`,
      `- Maximum discount percentage: ${formatPercent(metrics.maxDiscountPercent ?? 0)}.`,
      `- Total monetary discount amount: unavailable (not computed from percentage column).`,
    );
  } else {
    lines.push(
      `- Total monetary discount amount: ${formatCurrency(metrics.totalMonetaryDiscount ?? 0)}.`,
      `- Average monetary discount per row: ${formatCurrency(metrics.averageMonetaryDiscount ?? 0)}.`,
      `- Maximum single-row monetary discount: ${formatCurrency(metrics.maxMonetaryDiscount ?? 0)}.`,
      `- Average discount percentage: unavailable (column stores monetary amounts).`,
    );
  }

  if (metrics.interpretationNote) {
    lines.push(`- Note: ${metrics.interpretationNote}`);
  }

  return lines;
}