import type { SupportedUploadKind } from "@/types/research";

function isPdf(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

function isZip(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b
  );
}

function isOle(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

function looksLikeCsv(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  if (sample.includes(0x00)) return false;
  const text = sample.toString("utf8").trim();
  if (!text) return false;
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return false;
  const delimiterHits = [",", ";", "\t"].map((delimiter) =>
    lines
      .slice(0, 5)
      .reduce(
        (acc, line) => acc + (line.split(delimiter).length > 1 ? 1 : 0),
        0,
      ),
  );
  return Math.max(...delimiterHits) > 0;
}

export function sniffUploadKind(buffer: Buffer): SupportedUploadKind | null {
  if (isPdf(buffer)) return "pdf";
  if (isZip(buffer) || isOle(buffer)) return "xlsx";
  if (looksLikeCsv(buffer)) return "csv";
  return null;
}