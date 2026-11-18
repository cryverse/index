import type { ModelRecommendation } from "@/lib/ai/recommendation-schema";

export type ValidatedRecommendation = ModelRecommendation;

export const MAX_ACCEPTED_RECOMMENDATIONS = 4;

const ACTION_VERBS =
  /^(investigate|review|compare|audit|run|schedule|analyze|analyse|examine|assess|prioritize|prioritise|align|test|pilot|track|hold|develop|create|reduce|increase|rebalance|adjust|focus|validate|confirm|drill|break down|deepen|strengthen|expand|revisit|coordinate|implement|establish|set up|map|segment|benchmark|collect|document|quantify)/i;

const DESCRIPTIVE_OBSERVATION =
  /^(?:revenue|sales|the\s+)?.*\b(?:is|are|was|were)\b.*\b(?:highest|largest|dominant|volatile|growing|declining)\b|^(?:\w+\s+){0,6}(?:generates|accounts for|represents)\s+(?:the\s+)?(?:most|largest|dominant|\d)/i;

const GUARANTEED_OUTCOME =
  /\b(?:guarantee|will increase revenue by|will boost revenue|expected roi|increase profits? by|\d+%\s+(?:revenue|profit|growth)\s+(?:lift|increase|gain))\b/i;

const UNSUPPORTED_CAUSAL =
  /\b(?:because of|due to|driven by|caused by)\s+(?:marketing|seasonality|market conditions|customer behavior|brand strength)\b/i;

const RETENTION_INFERENCE =
  /\b(?:proves?|demonstrates?|shows?)\s+(?:strong|weak|poor|high)\s+retention\b|\bretention is (?:strong|weak|poor)\b/i;

const PROFIT_INFERENCE =
  /\b(?:high revenue (?:proves?|means)|implies)\s+(?:high )?profit(?:ability)?\b|\bprofit(?:ability)?\s+(?:is|will) improve\b/i;

const INVENTORY_ACTION_WITHOUT_UNITS =
  /\b(?:increase|raise|expand|reorder|restock)\b[\s\S]{0,48}\b(?:inventory|stock)\b/i;

const VAGUE_INTENDED_OUTCOME =
  /^(?:better performance|improve results|increase success|grow revenue|higher sales|improve outcomes|optimize performance)\.?$/i;

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "into",
  "across",
  "about",
  "their",
  "your",
  "than",
  "versus",
  "sales",
  "revenue",
  "team",
]);

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNumericClaim(value: string): string {
  return value.replace(/[$,\s]/g, "").toLowerCase();
}

function combinedText(recommendation: ModelRecommendation): string {
  return `${recommendation.action} ${recommendation.supportedBy} ${recommendation.intendedOutcome}`;
}

function extractBriefNumberTokens(brief: string): Set<string> {
  const tokens = new Set<string>();
  const patterns = [
    /\$[\d,]+(?:\.\d+)?/g,
    /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g,
    /\b\d+(?:\.\d+)?%/g,
    /\b\d{4}-\d{2}\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of brief.match(pattern) ?? []) {
      tokens.add(normalizeToken(match));
    }
  }
  return tokens;
}

function extractBriefSegmentTokens(brief: string): Set<string> {
  const segments = new Set<string>();
  const lines = brief.split("\n");
  for (const line of lines) {
    const bullet = line.match(/^-\s+([^:(]+)/);
    if (bullet) {
      const label = bullet[1].trim();
      if (label.length >= 2) segments.add(normalizeToken(label));
    }
  }
  return segments;
}

function supportedByReferencesBrief(
  supportedBy: string,
  brief: string,
): boolean {
  const text = supportedBy.trim();
  if (text.length < 16) return false;

  const briefNumbers = extractBriefNumberTokens(brief);
  const lower = normalizeToken(text);
  const numericClaims = [
    ...(text.match(/\$[\d,]+(?:\.\d+)?/g) ?? []),
    ...(text.match(/\b\d+(?:\.\d+)?%/g) ?? []),
  ];

  if (numericClaims.length > 0) {
    return numericClaims.every((claim) =>
      [...briefNumbers].some(
        (token) =>
          normalizeNumericClaim(token) === normalizeNumericClaim(claim) ||
          lower.includes(normalizeToken(token)),
      ),
    );
  }

  const segments = extractBriefSegmentTokens(brief);
  for (const segment of segments) {
    if (segment.length >= 3 && lower.includes(segment)) {
      return true;
    }
  }

  return /\b(verified|rank|month|revenue|share|growth|comparison|brief|period)\b/i.test(
    text,
  );
}

export function isDescriptiveObservation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (ACTION_VERBS.test(trimmed)) return false;
  return DESCRIPTIVE_OBSERVATION.test(trimmed);
}

export function hasActionableVerb(action: string): boolean {
  const trimmed = action.trim();
  if (trimmed.length < 12) return false;
  return ACTION_VERBS.test(trimmed);
}

export function isVagueIntendedOutcome(intendedOutcome: string): boolean {
  const trimmed = intendedOutcome.trim();
  if (trimmed.length < 20) return true;
  if (VAGUE_INTENDED_OUTCOME.test(trimmed)) return true;
  if (GUARANTEED_OUTCOME.test(trimmed)) return true;
  return false;
}

export function hasUnsupportedInference(
  recommendation: ModelRecommendation,
  verifiedBrief: string,
): boolean {
  const text = combinedText(recommendation);
  const brief = verifiedBrief.toLowerCase();

  if (UNSUPPORTED_CAUSAL.test(text)) return true;
  if (RETENTION_INFERENCE.test(text)) return true;
  if (PROFIT_INFERENCE.test(text)) return true;

  const briefHasInventoryOrDemandData =
    /\b(inventory|stock on hand|on-hand|warehouse level|demand forecast)\b/i.test(
      brief,
    );

  if (
    INVENTORY_ACTION_WITHOUT_UNITS.test(recommendation.action) &&
    !briefHasInventoryOrDemandData
  ) {
    return true;
  }

  if (/\bprofit(?:ability)?\b/i.test(text) && !/\bprofit|margin\b/i.test(brief)) {
    return true;
  }

  if (
    /\bretention\b/i.test(text) &&
    /customer type revenue/i.test(brief) &&
    RETENTION_INFERENCE.test(text)
  ) {
    return true;
  }

  if (
    /\bexplain why\b/i.test(recommendation.action) &&
    !/\b(customer|channel|campaign)\b/i.test(brief)
  ) {
    return true;
  }

  return false;
}

function tokenizeForSimilarity(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !STOPWORDS.has(word)),
  );
}

export function actionSimilarity(a: string, b: string): number {
  const setA = tokenizeForSimilarity(a);
  const setB = tokenizeForSimilarity(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

function recommendationTheme(action: string): string | null {
  const lower = action.toLowerCase();
  const themes: Array<[RegExp, string]> = [
    [/\binvestigate\b.*\bapril\b.*\bspike\b/, "investigate-april-spike"],
    [/\breview\b.*\beast\b.*\bregion\b/, "review-east-region"],
    [/\bcompare\b.*\bchannel\b/, "compare-channel-mix"],
    [/\bcompare\b.*\bcustomer\b/, "compare-customer-mix"],
  ];
  for (const [pattern, key] of themes) {
    if (pattern.test(lower)) return key;
  }
  return null;
}

export function isNearDuplicateAction(
  candidate: string,
  accepted: string[],
): boolean {
  const theme = recommendationTheme(candidate);
  if (
    theme &&
    accepted.some((existing) => recommendationTheme(existing) === theme)
  ) {
    return true;
  }
  return accepted.some(
    (existing) => actionSimilarity(candidate, existing) >= 0.48,
  );
}

export function validateRecommendationFields(
  recommendation: ModelRecommendation,
): boolean {
  const action = recommendation.action.trim();
  const supportedBy = recommendation.supportedBy.trim();
  const intendedOutcome = recommendation.intendedOutcome.trim();

  if (!action || !supportedBy || !intendedOutcome) return false;
  if (action === supportedBy || action === intendedOutcome) return false;
  if (isDescriptiveObservation(action)) return false;
  if (!hasActionableVerb(action)) return false;
  if (isDescriptiveObservation(intendedOutcome)) return false;
  if (isVagueIntendedOutcome(intendedOutcome)) return false;
  if (supportedBy.length < 16) return false;
  return true;
}

export function validateRecommendationAgainstBrief(
  recommendation: ModelRecommendation,
  verifiedBrief: string,
): boolean {
  if (!validateRecommendationFields(recommendation)) return false;
  if (!verifiedBrief.trim()) return false;
  if (hasUnsupportedInference(recommendation, verifiedBrief)) return false;
  return supportedByReferencesBrief(recommendation.supportedBy, verifiedBrief);
}

export function filterValidRecommendations(
  recommendations: ModelRecommendation[],
  verifiedBrief: string,
): ValidatedRecommendation[] {
  const acceptedActions: string[] = [];
  const valid: ValidatedRecommendation[] = [];

  for (const item of recommendations) {
    if (!validateRecommendationAgainstBrief(item, verifiedBrief)) continue;

    const action = item.action.trim();
    if (isNearDuplicateAction(action, acceptedActions)) continue;

    acceptedActions.push(action);
    valid.push({
      action,
      supportedBy: item.supportedBy.trim(),
      intendedOutcome: item.intendedOutcome.trim(),
    });

    if (valid.length >= MAX_ACCEPTED_RECOMMENDATIONS) break;
  }

  return valid;
}