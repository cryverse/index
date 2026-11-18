export function takePreviewRows<T>(rows: T[], limit: number): T[] {
  if (rows.length <= limit) return rows;
  return rows.slice(0, limit);
}

/** User-visible note when only the model context is row-limited (not verified math). */
export function previewOnlyRowNotice(
  totalRows: number,
  previewLimit: number,
  label: string,
): string | null {
  if (totalRows <= previewLimit) return null;
  return `${label}: AI file context shows the first ${previewLimit.toLocaleString("en-US")} of ${totalRows.toLocaleString("en-US")} rows. Verified calculations use every parsed row.`;
}