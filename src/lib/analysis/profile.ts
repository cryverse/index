import type { TabularDataset } from "@/lib/files/tabular";
import { isBlank, parseDate, parseNumber } from "./coerce";
import type { ColumnKind, ColumnProfile, DatasetProfile } from "./types";

function detectKind(values: unknown[]): ColumnKind {
  const nonBlank = values.filter((value) => !isBlank(value));
  if (nonBlank.length === 0) return "empty";

  let numeric = 0;
  let dates = 0;
  let booleans = 0;

  for (const value of nonBlank) {
    if (typeof value === "boolean") {
      booleans += 1;
      continue;
    }
    if (parseNumber(value) != null) numeric += 1;
    else if (parseDate(value) != null) dates += 1;
  }

  const total = nonBlank.length;
  if (numeric / total >= 0.6) return "number";
  if (dates / total >= 0.6) return "date";
  if (booleans === total) return "boolean";
  return "string";
}

function buildColumnProfile(name: string, rows: Record<string, unknown>[]): ColumnProfile {
  let missingCount = 0;
  const values: unknown[] = [];

  for (const row of rows) {
    const value = row[name];
    if (isBlank(value)) {
      missingCount += 1;
    } else {
      values.push(value);
    }
  }

  const rowCount = rows.length;
  const missingPercent = rowCount > 0 ? (missingCount / rowCount) * 100 : 0;

  return {
    name,
    kind: detectKind(values),
    nonEmptyCount: rowCount - missingCount,
    missingCount,
    missingPercent,
  };
}

function isCategoricalColumn(
  rows: Record<string, unknown>[],
  column: ColumnProfile,
): boolean {
  if (column.kind !== "string" && column.kind !== "boolean") return false;
  const unique = new Set<string>();
  for (const row of rows) {
    const value = row[column.name];
    if (isBlank(value)) continue;
    unique.add(String(value).trim());
    if (unique.size > 100) return false;
  }
  return unique.size >= 2;
}

export function profileDataset(dataset: TabularDataset): DatasetProfile {
  const label = dataset.sheetName
    ? `${dataset.sourceName} · ${dataset.sheetName}`
    : dataset.sourceName;
  const columns = dataset.columns.map((name) =>
    buildColumnProfile(name, dataset.rows),
  );

  const numericColumns = columns
    .filter((column) => column.kind === "number")
    .map((column) => column.name);
  const dateColumns = columns
    .filter((column) => column.kind === "date")
    .map((column) => column.name);
  const categoricalColumns = columns
    .filter((column) => isCategoricalColumn(dataset.rows, column))
    .map((column) => column.name);

  return {
    dataset,
    label,
    rowCount: dataset.rows.length,
    columns,
    numericColumns,
    categoricalColumns,
    dateColumns,
  };
}