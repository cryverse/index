import { profileDataset } from "@/lib/analysis/profile";
import Papa from "papaparse";
import { MAX_CSV_ROWS_PREVIEW } from "./constants";
import { sniffCsvDelimiter, stripUtf8Bom } from "./csv-preprocess";
import { auditDatasetIntegrity } from "./dataset-integrity";
import { normalizeRows, type TabularDataset } from "./tabular";
import { previewOnlyRowNotice, takePreviewRows } from "./tabular-preview";

export function parseCsvBuffer(buffer: Buffer, fileName: string) {
  const text = stripUtf8Bom(buffer.toString("utf8"));
  const headerWarnings: string[] = [];
  const seen = new Map<string, number>();
  let blankHeaderIndex = 0;

  const transformHeader = (header: string): string => {
    const trimmed = (header ?? "").trim() || `column_${++blankHeaderIndex}`;
    const key = trimmed.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count > 1) {
      const renamed = `${trimmed}__${count}`;
      headerWarnings.push(
        `Duplicate header "${trimmed}" renamed to "${renamed}" for analysis.`,
      );
      return renamed;
    }
    return trimmed;
  };

  const delimiter = sniffCsvDelimiter(text);

  const parseConfig = {
    header: true,
    skipEmptyLines: "greedy" as const,
    dynamicTyping: false,
    ...(delimiter ? { delimiter } : {}),
    transformHeader,
  };

  const parsed = Papa.parse<Record<string, string>>(
    text,
    parseConfig as Parameters<typeof Papa.parse>[1],
  );

  const fatalErrors = parsed.errors.filter(
    (error) => error.type === "Quotes" || error.type === "Delimiter",
  );
  if (fatalErrors.length > 0) {
    const first = fatalErrors[0];
    throw new Error(
      `CSV parse error${first.row != null ? ` near row ${first.row + 1}` : ""}: ${first.message}`,
    );
  }

  const columns = (parsed.meta.fields ?? []).map((field) => field.trim());
  const warnings: string[] = [...headerWarnings];

  if (parsed.errors.length > 0) {
    warnings.push(
      `CSV parser reported ${parsed.errors.length} non-fatal issue(s); readable rows were retained.`,
    );
  }

  if (delimiter) {
    warnings.push(`Detected CSV delimiter: "${delimiter}".`);
  }

  const normalizedRows = (parsed.data ?? [])
    .map((row) => {
      const next: Record<string, unknown> = {};
      for (const column of columns) {
        const value = row[column];
        next[column] =
          typeof value === "string" ? value.trim() : (value ?? "");
      }
      return next;
    })
    .filter((row) =>
      Object.values(row).some((value) => String(value ?? "").trim().length > 0),
    );

  const previewRows = takePreviewRows(normalizedRows, MAX_CSV_ROWS_PREVIEW);
  const previewNotice = previewOnlyRowNotice(
    normalizedRows.length,
    MAX_CSV_ROWS_PREVIEW,
    fileName,
  );
  if (previewNotice) warnings.push(previewNotice);

  const summary = `${fileName}: ${normalizedRows.length} row(s), ${columns.length} column(s)`;

  const contextText = [
    `CSV file: ${fileName}`,
    `Columns: ${columns.join(", ") || "(none)"}`,
    `Row count: ${normalizedRows.length}`,
    `Sample rows (first ${previewRows.length} shown for context preview only):`,
    JSON.stringify(previewRows, null, 2),
  ].join("\n");

  const tabularDatasets: TabularDataset[] =
    normalizedRows.length > 0 && columns.length > 0
      ? [
          {
            sourceName: fileName,
            columns,
            rows: normalizeRows(normalizedRows, columns),
          },
        ]
      : [];

  for (const dataset of tabularDatasets) {
    warnings.push(...auditDatasetIntegrity(dataset, profileDataset(dataset)));
  }

  if (normalizedRows.length === 0) {
    warnings.push("CSV contains no data rows after parsing.");
  }

  return {
    contextText,
    summary,
    warnings,
    rowCount: normalizedRows.length,
    columnCount: columns.length,
    tabularDatasets,
  };
}