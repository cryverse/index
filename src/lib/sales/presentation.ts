export type FindingTone = "critical" | "opportunity" | "neutral" | null;

const POSITIVE_DATA_QUALITY =
  /no missing|without missing|no gaps|no null|complete (dataset|data|records)|data (is |are )?(clean|complete|reliable)|data quality is (good|strong)|integrity (is )?(good|strong)|missing (values |data )?(were )?not found|no data quality issues/i;

const GENUINE_RISK =
  /decline|drop|decreas(ed|ing)?|at risk|risk of|underperform|weak(ness)?|shortfall|churn|revenue loss|below (target|plan)|lagging|deteriorat|slump|stagnant|concentration risk|over[- ]?reliance|single point of failure/i;

const MISSING_AS_ISSUE =
  /(?<!no )\bmissing\b(?!\s+(data points were )?found)|\bincomplete\b|\bnull values\b|\bdata gap\b/i;

const OPPORTUNITY_SIGNAL =
  /opportunit|upside|expand|strong (growth|performance)|outperform|momentum|improve(d|ment)?|potential to|favorable|winning/i;

const GROWTH_POSITIVE =
  /revenue growth|sales growth|growing\b|increased?\b|increases\b/;

const CONCENTRATION_OBSERVATION =
  /(?:concentrat|dominat|accounts for \d|largest share|leading (?:product|region|channel|segment)|top[- ]perform|rank #?1\b|highest[- ]revenue|#1\b)/i;

const VOLATILITY_OR_SPIKE =
  /(?:volatile|volatility|spike|surge|peak month|unusual (?:increase|jump))/i;

export function classifyFindingTone(finding: string): FindingTone {
  const text = finding.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  if (POSITIVE_DATA_QUALITY.test(text)) {
    return "neutral";
  }

  if (
    (CONCENTRATION_OBSERVATION.test(text) || VOLATILITY_OR_SPIKE.test(text)) &&
    !GENUINE_RISK.test(lower) &&
    !/problem|concern/.test(lower)
  ) {
    return null;
  }

  if (GENUINE_RISK.test(lower)) {
    return "critical";
  }

  if (MISSING_AS_ISSUE.test(lower)) {
    return "critical";
  }

  if (OPPORTUNITY_SIGNAL.test(lower)) {
    if (/slow|declin|weak|low/.test(lower) && !/growth/.test(lower)) {
      return "critical";
    }
    return "opportunity";
  }

  if (
    GROWTH_POSITIVE.test(lower) &&
    !/slow|declin|negative|flat/.test(lower)
  ) {
    return "opportunity";
  }

  if (/monitor|variance|uncertain|mixed results|inconsistent/.test(lower)) {
    return null;
  }

  return null;
}

export const FINDING_TONE_LABEL: Record<
  Exclude<FindingTone, null>,
  string
> = {
  critical: "Risk",
  opportunity: "Opportunity",
  neutral: "Insight",
};

export type LimitationCategory =
  | "integrity"
  | "scope"
  | "dimension"
  | "general";

export function dedupeLimitations(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function categorizeLimitation(text: string): LimitationCategory {
  const lower = text.toLowerCase();
  if (
    /^integrity:/.test(lower) ||
    /duplicate row|duplicate header|unparseable|invalid date|negative value|explicit zero|entirely empty|repeated value/.test(
      lower,
    )
  ) {
    return "integrity";
  }
  if (
    /missing|null|parse|empty|invalid|excluded|could not|truncat|integrity|data quality/.test(
      lower,
    )
  ) {
    return "integrity";
  }
  if (
    /row|sample|small|limited|period|time range|single file|pdf|scanned|image-based|worksheet|delimiter|preview|no tabular|verified tabular/.test(
      lower,
    )
  ) {
    return "scope";
  }
  if (
    /column|segment|product|region|customer|dimension|categorical|date/.test(
      lower,
    )
  ) {
    return "dimension";
  }
  return "general";
}