import * as XLSX from "xlsx";
import { MAX_XLSX_ROWS_PREVIEW } from "./constants";
import { normalizeRows, type TabularDataset } from "./tabular";

export function parseXlsxBuffer(buffer: Buffer, fileName: string) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const warnings: string[] = [];
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error("Workbook contains no sheets.");
  }

  const sections: string[] = [`Spreadsheet file: ${fileName}`, `Sheets: ${sheetNames.join(", ")}`];
  const tabularDatasets: TabularDataset[] = [];
  let totalRows = 0;

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    totalRows += rows.length;
    const previewRows = rows.slice(0, MAX_XLSX_ROWS_PREVIEW);
    if (rows.length > MAX_XLSX_ROWS_PREVIEW) {
      warnings.push(
        `Sheet "${sheetName}" truncated to first ${MAX_XLSX_ROWS_PREVIEW} of ${rows.length} rows.`,
      );
    }

    sections.push(
      `\n[Sheet: ${sheetName}] (${rows.length} rows)`,
      JSON.stringify(previewRows, null, 2),
    );

    if (rows.length > 0) {
      const columns = Object.keys(rows[0] ?? {});
      if (columns.length > 0) {
        tabularDatasets.push({
          sourceName: fileName,
          sheetName,
          columns,
          rows: normalizeRows(rows, columns),
        });
      }
    }
  }

  const summary = `${fileName}: ${sheetNames.length} sheet(s), ${totalRows} total row(s)`;

  return {
    contextText: sections.join("\n"),
    summary,
    warnings,
    sheetNames,
    rowCount: totalRows,
    tabularDatasets,
  };
}