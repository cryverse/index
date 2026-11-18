import assert from "node:assert/strict";
import test from "node:test";
import { mapAnalysisFailure } from "./user-messages";

test("mapAnalysisFailure hides stack-like details", () => {
  const mapped = mapAnalysisFailure(
    "Failed",
    "API_FAILURE",
    "Error: boom\n    at Object.<anonymous> (/src/x.ts:10:5)",
  );
  assert.equal(mapped.detail, undefined);
});

test("mapAnalysisFailure classifies parse errors as file issues", () => {
  const mapped = mapAnalysisFailure(
    "None of the uploaded files could be processed.",
    "PARSE_ERROR",
    "orders.csv: CSV parse error",
  );
  assert.equal(mapped.category, "file");
  assert.match(mapped.recoveryHint, /try again/i);
});

test("mapAnalysisFailure omits raw network errors in details", () => {
  const mapped = mapAnalysisFailure(
    "Could not reach the analysis service.",
    undefined,
    "TypeError: fetch failed",
  );
  assert.equal(mapped.category, "network");
  assert.equal(mapped.detail, undefined);
});