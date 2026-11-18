export function isLikelyIdentifierColumn(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[_\s-]+/g, "");
  if (
    /^(orderid|transactionid|invoiceid|recordid|lineid|customerid|custid)$/.test(
      normalized,
    )
  ) {
    return true;
  }
  if (/phone|mobile|email|uuid/.test(normalized)) {
    return true;
  }
  if (
    normalized.endsWith("id") &&
    (normalized.includes("order") ||
      normalized.includes("transaction") ||
      normalized.includes("invoice"))
  ) {
    return true;
  }
  return false;
}