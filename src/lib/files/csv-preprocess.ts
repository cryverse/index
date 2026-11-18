export function stripUtf8Bom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function sniffCsvDelimiter(text: string): string | undefined {
  const line = text.split(/\r?\n/).find((row) => row.trim().length > 0) ?? "";
  if (line.length === 0) return undefined;

  const tabCount = line.match(/\t/g)?.length ?? 0;
  const semiCount = line.match(/;/g)?.length ?? 0;
  const commaCount = line.match(/,/g)?.length ?? 0;

  if (tabCount > commaCount && tabCount >= semiCount && tabCount > 0) return "\t";
  if (semiCount > commaCount && semiCount > 0) return ";";
  if (commaCount > 0) return ",";
  return undefined;
}

export function normalizeHeaderNames(fields: string[]): {
  columns: string[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const seen = new Map<string, number>();

  const columns = fields.map((field, index) => {
    const trimmed = (field ?? "").trim() || `column_${index + 1}`;
    const key = trimmed.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) {
      const renamed = `${trimmed}__${count}`;
      warnings.push(
        `Duplicate header "${trimmed}" renamed to "${renamed}" for analysis.`,
      );
      return renamed;
    }
    return trimmed;
  });

  return { columns, warnings };
}