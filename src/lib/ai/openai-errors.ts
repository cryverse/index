import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  RateLimitError,
} from "openai";
import type { ResearchApiErrorCode } from "@/types/research";

export type MappedProviderError = {
  code: ResearchApiErrorCode;
  message: string;
  details?: string;
};

function providerDetail(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  return undefined;
}

function nestedProviderCode(error: APIError): string | undefined {
  const payload = error.error as { code?: string; type?: string } | undefined;
  return payload?.code ?? error.code ?? undefined;
}

export function mapOpenAIError(error: unknown): MappedProviderError {
  if (error instanceof APIConnectionTimeoutError) {
    return {
      code: "TIMEOUT",
      message:
        "OpenAI did not respond in time. Check your network connection and try again.",
      details: providerDetail(error),
    };
  }

  if (error instanceof APIConnectionError) {
    return {
      code: "TIMEOUT",
      message:
        "Could not reach OpenAI. Verify network access to the API and try again.",
      details: providerDetail(error),
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      code: "AUTHENTICATION",
      message:
        "OpenAI rejected the API key. Verify OPENAI_API_KEY is valid for this project.",
      details: providerDetail(error),
    };
  }

  if (error instanceof RateLimitError) {
    return {
      code: "RATE_LIMIT",
      message: "OpenAI rate limit reached. Wait a moment and try again.",
      details: providerDetail(error),
    };
  }

  if (error instanceof BadRequestError) {
    return {
      code: "INVALID_REQUEST",
      message: "OpenAI rejected the analysis request.",
      details: providerDetail(error),
    };
  }

  if (error instanceof APIError) {
    const providerCode = nestedProviderCode(error);

    if (
      providerCode === "insufficient_quota" ||
      providerCode === "billing_hard_limit_reached"
    ) {
      return {
        code: "QUOTA_EXCEEDED",
        message:
          "OpenAI quota or billing limit reached. Check usage and billing in your OpenAI account.",
        details: providerDetail(error),
      };
    }

    if (error.status === 402) {
      return {
        code: "QUOTA_EXCEEDED",
        message:
          "OpenAI billing or quota issue prevented this request. Check your OpenAI account.",
        details: providerDetail(error),
      };
    }

    if (error.status === 403) {
      return {
        code: "AUTHENTICATION",
        message:
          "OpenAI denied access to this request. Verify API key permissions and project access.",
        details: providerDetail(error),
      };
    }

    return {
      code: "API_FAILURE",
      message: "OpenAI returned an unexpected error.",
      details: providerDetail(error),
    };
  }

  return {
    code: "API_FAILURE",
    message: "The research request failed. Check your API configuration and try again.",
    details: providerDetail(error),
  };
}