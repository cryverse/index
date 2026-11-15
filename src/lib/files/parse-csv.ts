import Papa from "papaparse";
import { MAX_CSV_ROWS_PREVIEW } from "./constants";
import { normalizeRows, type TabularDataset } from "./tabular";

export function parseCsvBuffer(buffer: Buffer, fileName: string) {
  const text = buffer.toString("utf8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(
      `CSV parse error${first.row != null ? ` near row ${first.row + 1}` : ""}: ${first.message}`,
    );
  }

  const fields = parsed.meta.fields ?? [];
  const rows = (parsed.data ?? []).filter((row: Record<string, string>) =>
    Object.values(row).some((value) => String(value ?? "").trim().length > 0),
  );

  const previewRows = rows.slice(0, MAX_CSV_ROWS_PREVIEW);
  const warnings: string[] = [];

  if (rows.length > MAX_CSV_ROWS_PREVIEW) {
    warnings.push(
      `Truncated to first ${MAX_CSV_ROWS_PREVIEW} of ${rows.length} rows for analysis.`,
    );
  }

  const summary = `${fileName}: ${rows.length} row(s), ${fields.length} column(s)`;

  const contextText = [
    `CSV file: ${fileName}`,
    `Columns: ${fields.join(", ") || "(none)"}`,
    `Row count: ${rows.length}`,
    `Sample rows (JSON):`,
    JSON.stringify(previewRows, null, 2),
  ].join("\n");

  const tabularDatasets: TabularDataset[] =
    rows.length > 0 && fields.length > 0
      ? [
          {
            sourceName: fileName,
            columns: fields,
            rows: normalizeRows(
              rows.map((row) => row as Record<string, unknown>),
              fields,
            ),
          },
        ]
      : [];

  return {
    contextText,
    summary,
    warnings,
    rowCount: rows.length,
    columnCount: fields.length,
    tabularDatasets,
  };
}