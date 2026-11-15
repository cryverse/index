export type TabularDataset = {
  sourceName: string;
  sheetName?: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

export function normalizeRows(
  rows: Record<string, unknown>[],
  columns: string[],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const column of columns) {
      normalized[column] = row[column] ?? "";
    }
    return normalized;
  });
}