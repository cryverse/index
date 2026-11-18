import { isLikelyIdentifierColumn } from "@/lib/files/column-identifiers";
import type { DatasetProfile } from "./types";

export const REVENUE_PATTERNS = [
  "revenue",
  "sales",
  "amount",
  "total",
  "value",
  "price",
  "gmv",
  "income",
];

export const DATE_PATTERNS = [
  "date",
  "time",
  "period",
  "timestamp",
  "day",
  "month",
  "year",
];

export const REGION_PATTERNS = [
  "region",
  "territory",
  "market",
  "area",
  "country",
  "state",
  "zone",
  "location",
  "geo",
];

export const PRODUCT_PATTERNS = [
  "product",
  "sku",
  "item",
  "category",
  "brand",
  "line",
  "service",
];

export const CHANNEL_PATTERNS = [
  "channel",
  "source",
  "medium",
  "store",
  "platform",
  "outlet",
];

export const CUSTOMER_PATTERNS = [
  "customertype",
  "customer_type",
  "clienttype",
  "accounttype",
  "customer",
  "client",
  "buyer",
  "segment",
];

export const UNITS_PATTERNS = [
  "units",
  "quantity",
  "qty",
  "volume",
  "unitssold",
];

export const DISCOUNT_PATTERNS = [
  "discount",
  "rebate",
  "markdown",
  "promo",
  "deduction",
];

export type SalesColumnRoles = {
  revenue?: string;
  date?: string;
  region?: string;
  product?: string;
  channel?: string;
  customer?: string;
  units?: string;
  discount?: string;
};

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[_\s-]+/g, "");
}

export function matchColumn(
  candidates: string[],
  patterns: string[],
): string | undefined {
  for (const pattern of patterns) {
    const hit = candidates.find((column) =>
      normalizeName(column).includes(pattern.replace(/_/g, "")),
    );
    if (hit) return hit;
  }
  return undefined;
}

function pickUniqueCategorical(
  profile: DatasetProfile,
  patterns: string[],
  taken: Set<string>,
): string | undefined {
  const hit = matchColumn(
    profile.categoricalColumns.filter((c) => !taken.has(c)),
    patterns,
  );
  if (hit) return hit;
  return undefined;
}

export function resolveSalesColumnRoles(
  profile: DatasetProfile,
): SalesColumnRoles {
  const taken = new Set<string>();

  const revenueCandidates = profile.numericColumns.filter(
    (column) => !isLikelyIdentifierColumn(column),
  );
  const revenue =
    matchColumn(revenueCandidates, REVENUE_PATTERNS) ??
    revenueCandidates[0];
  if (revenue) taken.add(revenue);

  const date =
    matchColumn(profile.dateColumns, DATE_PATTERNS) ?? profile.dateColumns[0];

  const region = (() => {
    const matched = matchColumn(profile.categoricalColumns, REGION_PATTERNS);
    if (matched) {
      taken.add(matched);
      return matched;
    }
    return undefined;
  })();

  const product = (() => {
    const candidates = profile.categoricalColumns.filter((c) => !taken.has(c));
    const matched = matchColumn(candidates, PRODUCT_PATTERNS);
    if (matched) {
      taken.add(matched);
      return matched;
    }
    return undefined;
  })();

  const channel = (() => {
    const hit = pickUniqueCategorical(profile, CHANNEL_PATTERNS, taken);
    if (hit) taken.add(hit);
    return hit;
  })();

  const customer = (() => {
    const hit = pickUniqueCategorical(profile, CUSTOMER_PATTERNS, taken);
    if (hit) taken.add(hit);
    return hit;
  })();

  const units = matchColumn(profile.numericColumns, UNITS_PATTERNS);
  const discount = matchColumn(profile.numericColumns, DISCOUNT_PATTERNS);

  if (!region) {
    const nonProduct = profile.categoricalColumns.filter(
      (column) =>
        !taken.has(column) && !matchColumn([column], PRODUCT_PATTERNS),
    );
    if (nonProduct.length === 1) {
      taken.add(nonProduct[0]);
      return {
        revenue,
        date,
        region: nonProduct[0],
        product,
        channel,
        customer,
        units,
        discount,
      };
    }
  }

  return {
    revenue,
    date,
    region,
    product,
    channel,
    customer,
    units,
    discount,
  };
}

export function missingBusinessDimensions(
  roles: SalesColumnRoles,
): string[] {
  const notes: string[] = [];
  if (!roles.date) {
    notes.push("Date column not detected — monthly trends were not computed.");
  }
  if (!roles.region) {
    notes.push(
      "Regional/territory column not detected — geographic breakdowns were not computed.",
    );
  }
  if (!roles.product) {
    notes.push(
      "Product/SKU/category column not detected — product mix breakdowns were not computed.",
    );
  }
  if (!roles.channel) {
    notes.push(
      "Sales channel column not detected — channel mix breakdowns were not computed.",
    );
  }
  if (!roles.customer) {
    notes.push(
      "Customer type/segment column not detected — customer mix breakdowns were not computed.",
    );
  }
  if (!roles.units) {
    notes.push("Units/quantity column not detected — volume statistics were not computed.");
  }
  if (!roles.discount) {
    notes.push(
      "Discount column not detected — discount statistics were not computed.",
    );
  }
  return notes;
}