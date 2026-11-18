import { REVENUE_PATTERNS } from "@/lib/analysis/column-roles";
import { isBlank, parseDate, parseNumber } from "@/lib/analysis/coerce";
import type { DatasetProfile } from "@/lib/analysis/types";
import { isLikelyIdentifierColumn } from "./column-identifiers";
import type { TabularDataset } from "./tabular";

function columnLooksRevenue(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[_\s-]+/g, "");
  return REVENUE_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase().replace(/[_\s-]+/g, "")),
  );
}

export function auditDatasetIntegrity(
  dataset: TabularDataset,
  profile: DatasetProfile,
): string[] {
  const warnings: string[] = [];

  const rowKeys = new Set<string>();
  let duplicateRows = 0;
  for (const row of dataset.rows) {
    const key = JSON.stringify(row);
    if (rowKeys.has(key)) duplicateRows += 1;
    else rowKeys.add(key);
  }
  if (duplicateRows > 0) {
    warnings.push(
      `Integrity: ${duplicateRows} duplicate row(s) detected (rows were not removed).`,
    );
  }

  const identifierColumn = dataset.columns.find(isLikelyIdentifierColumn);
  if (identifierColumn) {
    const counts = new Map<string, number>();
    for (const row of dataset.rows) {
      const value = String(row[identifierColumn] ?? "").trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const repeated = [...counts.values()].filter((count) => count > 1).length;
    if (repeated > 0) {
      warnings.push(
        `Integrity: ${repeated} repeated value(s) in identifier column "${identifierColumn}".`,
      );
    }
  }

  for (const columnName of profile.dateColumns) {
    let invalidDates = 0;
    for (const row of dataset.rows) {
      const value = row[columnName];
      if (isBlank(value)) continue;
      if (parseDate(value) == null) invalidDates += 1;
    }
    if (invalidDates > 0) {
      warnings.push(
        `Integrity: ${invalidDates} invalid date value(s) in "${columnName}" (excluded from time analysis).`,
      );
    }
  }

  for (const columnName of dataset.columns) {
    if (isLikelyIdentifierColumn(columnName)) continue;

    const auditNumeric =
      profile.numericColumns.includes(columnName) || columnLooksRevenue(columnName);
    if (!auditNumeric) continue;

    let invalidNumeric = 0;
    let explicitZeros = 0;
    let negativeValues = 0;

    for (const row of dataset.rows) {
      const raw = row[columnName];
      if (isBlank(raw)) continue;
      const parsed = parseNumber(raw);
      if (parsed == null) {
        invalidNumeric += 1;
        continue;
      }
      if (parsed === 0) explicitZeros += 1;
      if (parsed < 0) negativeValues += 1;
    }

    if (invalidNumeric > 0) {
      warnings.push(
        `Integrity: ${invalidNumeric} unparseable numeric value(s) in "${columnName}" (treated as missing, not zero).`,
      );
    }

    if (negativeValues > 0 && columnLooksRevenue(columnName)) {
      warnings.push(
        `Integrity: ${negativeValues} negative value(s) in "${columnName}" (included in sums; verify credits/returns).`,
      );
    }

    if (explicitZeros > 0 && columnLooksRevenue(columnName)) {
      warnings.push(
        `Integrity: ${explicitZeros} explicit zero value(s) in "${columnName}" (counted separately from missing cells).`,
      );
    }
  }

  for (const column of profile.columns) {
    if (column.kind === "empty") {
      warnings.push(`Integrity: column "${column.name}" is entirely empty.`);
    } else if (column.missingPercent >= 90) {
      warnings.push(
        `Integrity: column "${column.name}" is ${column.missingPercent.toFixed(1)}% missing.`,
      );
    }
  }

  return warnings;
}