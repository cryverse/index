import assert from "node:assert/strict";
import test from "node:test";
import { classifyFindingTone } from "./presentation";

test("leading segment observations are not auto-classified as risk", () => {
  assert.equal(
    classifyFindingTone(
      "North is the leading region with 66.2% of verified revenue (rank #1).",
    ),
    null,
  );
  assert.equal(
    classifyFindingTone(
      "There is concentration risk: 80% of revenue depends on Online channel with declining MoM sales.",
    ),
    "critical",
  );
});