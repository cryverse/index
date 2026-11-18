/** Candidates passed to Zod and server-side recommendation validation. */
export const MAX_RECOMMENDATION_CANDIDATES = 4;

export const MAX_KEY_FINDING_CANDIDATES = 6;
export const MAX_LIMITATION_CANDIDATES = 8;

function trimStringArray(value: unknown, maxItems: number): unknown {
  if (!Array.isArray(value)) return value;
  return value.slice(0, maxItems);
}

/**
 * Truncate oversized model arrays before strict schema validation so the request
 * can still succeed and server-side filters can run.
 */
export function normalizeResearchModelPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const record = { ...(raw as Record<string, unknown>) };

  if ("recommendations" in record) {
    record.recommendations = trimStringArray(
      record.recommendations,
      MAX_RECOMMENDATION_CANDIDATES,
    );
  }

  if ("keyFindings" in record) {
    record.keyFindings = trimStringArray(
      record.keyFindings,
      MAX_KEY_FINDING_CANDIDATES,
    );
  }

  if ("limitations" in record) {
    record.limitations = trimStringArray(
      record.limitations,
      MAX_LIMITATION_CANDIDATES,
    );
  }

  return record;
}