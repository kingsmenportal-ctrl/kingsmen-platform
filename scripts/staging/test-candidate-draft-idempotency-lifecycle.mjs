import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const path = "apps/web/src/app/candidate/applications/[applicationId]/page.tsx";
const source = readFileSync(path, "utf8");

function functionBody(name, nextMarker) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function: ${name}`);
  const end = source.indexOf(nextMarker, start);
  assert.notEqual(end, -1, `missing boundary after function: ${name}`);
  return source.slice(start, end);
}

const updateBody = functionBody("update<K extends keyof AnswerData>", "function updateAdditional");
const updateAdditionalBody = functionBody("updateAdditional", "function addAdditional");

assert.match(updateBody, /setSaveIdempotencyKey\("\s*"\)/,
  "editing standard answer fields must invalidate the previous payload's idempotency key");
assert.match(updateAdditionalBody, /setSaveIdempotencyKey\("\s*"\)/,
  "editing provider-specific answers must invalidate the previous payload's idempotency key");
assert.match(source, /const requestKey = saveIdempotencyKey \|\| "application-draft-" \+ crypto\.randomUUID\(\)/,
  "an unchanged retry should reuse its idempotency key; a changed payload should receive a fresh key");
assert.match(source, /setSaveIdempotencyKey\(requestKey\)/,
  "the generated key must be retained while the same request is retried");

console.log("PASS candidate draft idempotency key lifecycle contract");
