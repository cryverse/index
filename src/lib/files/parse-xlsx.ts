import { profileDataset } from "@/lib/analysis/profile";
import * as XLSX from "xlsx";
import { MAX_XLSX_ROWS_PREVIEW } from "./constants";
import { normalizeHeaderNames } from "./csv-preprocess";
import { auditDatasetIntegrity } from "./dataset-integrity";
import { normalizeRows, type TabularDataset } from "./tabular";
import { previewOnlyRowNotice, takePreviewRows } from "./tabular-preview";

function trimCellValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "").trim();
}

function parseWorksheet(
  sheet: XLSX.WorkSheet,
): { rows: Record<string, unknown>[]; columns: string[]; warnings: string[] } {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  let headerRowIndex = -1;
  for (let index = 0; index < matrix.length; index += 1) {
    const row = matrix[index];
    if (!Array.isArray(row)) continue;
    if (row.some((cell) => trimCellValue(cell).length > 0)) {
      headerRowIndex = index;
      break;
    }
  }

  if (headerRowIndex < 0) {
    return { rows: [], columns: [], warnings: [] };
  }

  const headerRow = matrix[headerRowIndex] as unknown[];
  const { columns, warnings } = normalizeHeaderNames(
    headerRow.map((cell) => trimCellValue(cell)),
  );

  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => {
      const record: Record<string, unknown> = {};
      let hasValue = false;
      for (let index = 0; index < columns.length; index += 1) {
        const value = trimCellValue(row[index]);
        if (value.length > 0) hasValue = true;
        record[columns[index]] = value;
      }
      return hasValue ? record : null;
    })
    .filter((row): row is Record<string, unknown> => row != null);

  return { rows, columns, warnings };
}

export function parseXlsxBuffer(buffer: Buffer, fileName: string) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const warnings: string[] = [
    "Verified tabular analysis uses every non-empty worksheet in this workbook.",
  ];
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

    const { rows, columns, warnings: sheetWarnings } = parseWorksheet(sheet);
    warnings.push(...sheetWarnings);

    if (rows.length === 0) {
      warnings.push(`Sheet "${sheetName}" is empty and was skipped for analysis.`);
      sections.push(`\n[Sheet: ${sheetName}] (empty — skipped for analysis)`);
      continue;
    }

    totalRows += rows.length;
    const previewRows = takePreviewRows(rows, MAX_XLSX_ROWS_PREVIEW);
    const previewNotice = previewOnlyRowNotice(
      rows.length,
      MAX_XLSX_ROWS_PREVIEW,
      `Sheet "${sheetName}"`,
    );
    if (previewNotice) warnings.push(previewNotice);

    sections.push(
      `\n[Sheet: ${sheetName}] (${rows.length} rows analyzed; showing first ${previewRows.length} in context preview)`,
      JSON.stringify(previewRows, null, 2),
    );

    if (columns.length > 0) {
      const dataset: TabularDataset = {
        sourceName: fileName,
        sheetName,
        columns,
        rows: normalizeRows(rows, columns),
      };
      tabularDatasets.push(dataset);
      warnings.push(...auditDatasetIntegrity(dataset, profileDataset(dataset)));
    }
  }

  if (tabularDatasets.length === 0) {
    warnings.push("No non-empty worksheets were available for tabular analysis.");
  }

  const summary = `${fileName}: ${sheetNames.length} sheet(s), ${totalRows} analyzed row(s)`;

  return {
    contextText: sections.join("\n"),
    summary,
    warnings,
    sheetNames,
    rowCount: totalRows,
    tabularDatasets,
  };
}