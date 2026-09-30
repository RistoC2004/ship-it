import assert from "node:assert/strict";
import { test } from "node:test";
import { SHIP_IT_CONTENT } from "../../src/features/ship-it/content";
import { classifyLine } from "../../src/features/ship-it/ui/evidence";

test("diff lines are marked as added or removed", () => {
  assert.equal(classifyLine("diff", "+   return new Date(value + \"Z\");"), "added");
  assert.equal(classifyLine("diff", "-   const user = await requireUser(req);"), "removed");
  assert.equal(classifyLine("diff", "  export function parseDate(value: string) {"), "plain");
});

test("errors in logs are highlighted, but not inside code samples", () => {
  assert.equal(classifyLine("log", "← 403  row-level security violation"), "alert");
  assert.equal(classifyLine("log", "  error TS2345: Argument of type"), "alert");
  assert.equal(classifyLine("code", "const error = await failedRequest();"), "plain");
});

test("comments are dimmed in any snippet", () => {
  assert.equal(classifyLine("code", "  // used by reminders AND session expiry"), "comment");
  assert.equal(classifyLine("diff", "// handler"), "comment");
});

test("every diff in the library shows at least one change", () => {
  for (const incident of SHIP_IT_CONTENT.incidents) {
    if (incident.evidence?.kind !== "diff") continue;
    const kinds = incident.evidence.lines.map((line) => classifyLine("diff", line));
    assert.ok(kinds.includes("added") || kinds.includes("removed"), incident.id);
  }
});
