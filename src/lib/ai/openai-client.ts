import OpenAI from "openai";

const DEFAULT_OPENAI_TIMEOUT_MS = 120_000;

let client: OpenAI | null = null;

export function getOpenAIRequestTimeoutMs(): number {
  const raw = process.env.OPENAI_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_OPENAI_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 10_000) {
    return DEFAULT_OPENAI_TIMEOUT_MS;
  }
  return Math.min(parsed, 600_000);
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      timeout: getOpenAIRequestTimeoutMs(),
      // Retries on connection/body timeouts repeat full model calls; disable for research.
      maxRetries: 0,
    });
  }
  return client;
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}