import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync(
  "apps/web/src/app/candidate/identity-review/page.tsx",
  "utf8"
);
const checks = [
  ["candidate-facing route exists", page.includes("Request an identity review")],
  ["submission requires exact candidate reference", page.includes('name="candidate_reference"') && page.includes("candidateReference.trim()")],
  ["submission requires claimant name", page.includes('name="claimant_name"')],
  ["submission calls authenticated request function", page.includes("candidate-identity-review-request") && page.includes("Authorization: `Bearer ${accessToken}`")],
  ["request ID is displayed from server response", page.includes("result.request_id")],
  ["does not claim candidate evidence is verified", page.includes("not independently verified")],
  ["does not falsely claim evidence uploads", page.includes("does not upload or verify a document")],
  ["does not include credentials in request payload", !page.includes("password:") && !page.includes("service_role")]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, label);
}
console.log(`Identity-review candidate page contract: ${checks.length} checks passed.`);
