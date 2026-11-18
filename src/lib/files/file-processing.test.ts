import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { parseDate, parseNumber } from "@/lib/analysis/coerce";
import { profileDataset } from "@/lib/analysis/profile";
import { resolveSalesColumnRoles } from "@/lib/analysis/column-roles";
import { stripUtf8Bom } from "./csv-preprocess";
import { parseCsvBuffer } from "./parse-csv";
import { parseXlsxBuffer } from "./parse-xlsx";

test("stripUtf8Bom removes leading BOM", () => {
  const bomText = `\uFEFFname,value\na,1`;
  assert.equal(stripUtf8Bom(bomText).startsWith("\uFEFF"), false);
  const parsed = parseCsvBuffer(Buffer.from(bomText, "utf8"), "bom.csv");
  assert.equal(parsed.rowCount, 1);
  assert.equal(parsed.tabularDatasets[0]?.columns[0], "name");
});

test("csv handles semicolon delimiter and quoted line breaks", () => {
  const csv = `date;revenue;note
2026-01-01;100;"line1
line2"
2026-01-02;200;simple`;
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "semi.csv");
  assert.equal(parsed.rowCount, 2);
  assert.ok(
    parsed.warnings.some((warning) => warning.includes('delimiter: ";"')),
  );
  assert.match(String(parsed.tabularDatasets[0]?.rows[0]?.note), /line1/);
});

test("csv renames duplicate headers without dropping rows", () => {
  const csv = `revenue,revenue,region
10,20,North
30,40,South`;
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "dup-headers.csv");
  assert.equal(parsed.rowCount, 2);
  const columns = parsed.tabularDatasets[0]?.columns ?? [];
  assert.ok(columns.includes("revenue"));
  assert.ok(columns.some((name) => name.startsWith("revenue__")));
  assert.ok(
    parsed.warnings.some((warning) => warning.includes("Duplicate header")),
  );
});

test("csv retains malformed numeric cells as missing not zero", () => {
  const csv = `date,revenue,region
2026-01-01,not-a-number,North
2026-01-02,0,South`;
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "bad-num.csv");
  const profile = profileDataset(parsed.tabularDatasets[0]!);
  assert.ok(
    parsed.warnings.some((warning) =>
      warning.includes("unparseable numeric"),
    ),
  );
  assert.equal(parseNumber("not-a-number"), null);
  assert.equal(parseNumber("0"), 0);
  assert.ok(profile.dateColumns.includes("date"));
});

test("parseNumber supports accounting parentheses", () => {
  assert.equal(parseNumber("(1,234.50)"), -1234.5);
});

test("parseDate rejects invalid values without coercing", () => {
  assert.equal(parseDate("2026-13-40"), null);
  assert.equal(parseDate(""), null);
});

test("order id column is not chosen as revenue", () => {
  const csv = `order_id,revenue,date
1001,50,2026-01-01
1002,75,2026-01-02`;
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "orders.csv");
  const profile = profileDataset(parsed.tabularDatasets[0]!);
  const roles = resolveSalesColumnRoles(profile);
  assert.equal(roles.revenue, "revenue");
  assert.ok(!profile.numericColumns.includes("order_id"));
});

test("xlsx analyzes non-empty sheets and skips empty ones with warning", () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["date", "revenue"],
      ["2026-01-01", 10],
    ]),
    "Sales",
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([]), "Empty");
  const buffer = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  const parsed = parseXlsxBuffer(buffer, "multi.xlsx");
  assert.equal(parsed.tabularDatasets.length, 1);
  assert.equal(parsed.tabularDatasets[0]?.sheetName, "Sales");
  assert.ok(
    parsed.warnings.some((warning) =>
      warning.includes('Sheet "Empty" is empty'),
    ),
  );
  assert.ok(
    parsed.warnings.some((warning) =>
      warning.includes("every non-empty worksheet"),
    ),
  );
});

test("integrity reports duplicate rows", () => {
  const csv = `date,revenue,region
2026-01-01,10,North
2026-01-01,10,North`;
  const parsed = parseCsvBuffer(Buffer.from(csv, "utf8"), "dup-rows.csv");
  assert.ok(
    parsed.warnings.some((warning) => warning.includes("duplicate row")),
  );
});