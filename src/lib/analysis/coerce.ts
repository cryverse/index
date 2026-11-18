export function isBlank(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (isBlank(value)) return null;

  let text = String(value).trim();
  if (text.startsWith("(") && text.endsWith(")")) {
    text = `-${text.slice(1, -1)}`;
  }
  text = text.replace(/[$€£]/g, "").replace(/,/g, "");
  if (text.endsWith("%")) text = text.slice(0, -1);

  if (text.length === 0) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (isBlank(value)) return null;

  if (typeof value === "number" && value > 25569 && value < 100000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86_400_000);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const text = String(value).trim();
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  if (year < 1900 || year > 2100) return null;
  return parsed;
}

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US");
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

/** Display-only currency formatting; does not affect calculations. */
export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}