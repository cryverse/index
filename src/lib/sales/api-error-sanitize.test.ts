import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeClientErrorDetails } from "./user-messages";

test("sanitizeClientErrorDetails strips stack traces for API responses", () => {
  assert.equal(
    sanitizeClientErrorDetails(
      "Error: secret\n    at handler (C:\\project\\route.ts:10:5)",
    ),
    undefined,
  );
});