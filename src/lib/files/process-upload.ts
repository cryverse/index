import type { SupportedUploadKind } from "@/types/research";
import {
  MAX_CHARS_PER_FILE,
  MAX_CHARS_TOTAL_CONTEXT,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_UPLOAD_FILE_BYTES,
  MAX_UPLOAD_FILES,
} from "./constants";
import { sniffUploadKind } from "./detect-kind";
import { parseCsvBuffer } from "./parse-csv";
import { parsePdfBuffer } from "./parse-pdf";
import { parseXlsxBuffer } from "./parse-xlsx";
import type { ParsedUploadContext, ParsedUploadFailure } from "./types";

export type UploadProcessResult = {
  contexts: ParsedUploadContext[];
  failures: ParsedUploadFailure[];
};

function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "upload";
  return base.replace(/[^\w.\-()+\s]/g, "_").slice(0, 180) || "upload";
}

function truncateContext(text: string, maxChars: number): {
  text: string;
  warnings: string[];
} {
  if (text.length <= maxChars) return { text, warnings: [] };
  return {
    text: `${text.slice(0, maxChars)}\n\n[Context truncated for model input.]`,
    warnings: [`Context truncated to ${maxChars.toLocaleString()} characters.`],
  };
}

export async function processUploadedFiles(
  files: File[],
): Promise<UploadProcessResult> {
  if (files.length > MAX_UPLOAD_FILES) {
    throw new Error(`You can upload at most ${MAX_UPLOAD_FILES} files.`);
  }

  const contexts: ParsedUploadContext[] = [];
  const failures: ParsedUploadFailure[] = [];
  let totalBytes = 0;

  for (const file of files) {
    const safeName = sanitizeFileName(file.name || "upload");
    const buffer = Buffer.from(await file.arrayBuffer());
    const sizeBytes = buffer.length;
    totalBytes += sizeBytes;

    if (sizeBytes === 0) {
      failures.push({
        name: safeName,
        sizeBytes,
        error: "File is empty.",
      });
      continue;
    }

    if (sizeBytes > MAX_UPLOAD_FILE_BYTES) {
      failures.push({
        name: safeName,
        sizeBytes,
        error: `File exceeds the ${Math.round(MAX_UPLOAD_FILE_BYTES / (1024 * 1024))} MB limit.`,
      });
      continue;
    }

    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      failures.push({
        name: safeName,
        sizeBytes,
        error: "Total upload size exceeds the allowed limit for this request.",
      });
      continue;
    }

    const kind = sniffUploadKind(buffer);
    if (!kind) {
      failures.push({
        name: safeName,
        sizeBytes,
        error: "Unsupported file type. Use CSV, XLSX, or PDF.",
      });
      continue;
    }

    try {
      const parsed = await parseByKind(kind, buffer, safeName);
      const truncated = truncateContext(parsed.contextText, MAX_CHARS_PER_FILE);
      contexts.push({
        name: safeName,
        kind,
        sizeBytes,
        warnings: [...parsed.warnings, ...truncated.warnings],
        contextText: truncated.text,
        summary: parsed.summary,
        tabularDatasets: parsed.tabularDatasets,
      });
    } catch (error) {
      failures.push({
        name: safeName,
        sizeBytes,
        error:
          error instanceof Error ? error.message : "Failed to parse this file.",
      });
    }
  }

  let running = 0;
  for (const context of contexts) {
    if (running + context.contextText.length > MAX_CHARS_TOTAL_CONTEXT) {
      const remaining = Math.max(500, MAX_CHARS_TOTAL_CONTEXT - running);
      const truncated = truncateContext(context.contextText, remaining);
      context.contextText = truncated.text;
      context.warnings.push(...truncated.warnings);
      context.warnings.push(
        "Further files were shortened to stay within the combined context limit.",
      );
    }
    running += context.contextText.length;
  }

  return { contexts, failures };
}

async function parseByKind(
  kind: SupportedUploadKind,
  buffer: Buffer,
  fileName: string,
) {
  if (kind === "csv") return parseCsvBuffer(buffer, fileName);
  if (kind === "xlsx") return parseXlsxBuffer(buffer, fileName);
  return parsePdfBuffer(buffer, fileName);
}

export function buildModelFileContext(contexts: ParsedUploadContext[]): string {
  if (contexts.length === 0) return "";
  return contexts
    .map(
      (file, index) =>
        `### File ${index + 1}: ${file.name} (${file.kind}, ${file.sizeBytes} bytes)\n${file.contextText}`,
    )
    .join("\n\n");
}