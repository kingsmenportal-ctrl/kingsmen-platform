import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const page = readFileSync(
  "apps/web/src/app/candidate/identity-review/page.tsx",
  "utf8"
);
const login = readFileSync("apps/web/src/app/auth/login/page.tsx", "utf8");
const reviewer = readFileSync("apps/web/src/app/reviewer/identity-reviews/page.tsx", "utf8");
const decision = readFileSync("supabase/functions/candidate-identity-review-decision/index.ts", "utf8");
const queue = readFileSync("supabase/functions/candidate-identity-review-queue/index.ts", "utf8");
const normalized = page.replace(/\s+/g, " ");
const checks = [
  ["candidate-facing identity review route exists", page.includes("Request an identity review")],
  ["submission requires exact candidate reference", page.includes('name="candidate_reference"') && page.includes("candidateReference.trim()")],
  ["submission requires claimant name", page.includes('name="claimant_name"')],
  ["submission calls authenticated request function", normalized.includes("candidate-identity-review-request") && normalized.includes("Authorization: `Bearer ${accessToken}`")],
  ["request ID is displayed from server response", page.includes("result.request_id")],
  ["candidate-described evidence is not represented as verified", page.includes("not independently verified")],
  ["UI explicitly says evidence description is not an upload", normalized.includes("does not upload or verify a document")],
  ["no password or service-role credential is included", !page.includes("password:") && !page.includes("service_role")],
  ["login requests email OTP through Supabase Auth", login.includes("/otp") && login.includes("create_user: true")],
  ["login verifies OTP before creating browser session", login.includes("/verify") && login.includes("type: \"email\"") && login.includes("body.access_token")],
  ["login session contains no server-side service credential", !login.includes("SERVICE_ROLE") && !login.includes("service_role")],
  ["reviewer queue calls a dedicated server-side authorization endpoint", reviewer.includes("candidate-identity-review-queue") && reviewer.includes("IDENTITY_REVIEWER")],
  ["reviewer UI does not expose approval without evidence", reviewer.includes("Approve — blocked pending evidence workflow")],
  ["review queue verifies reviewer grant before reading requests", queue.includes('.eq("role_code", "IDENTITY_REVIEWER")') && queue.indexOf("if (!grant)") < queue.indexOf('.from("candidate_identity_review_requests")')],
  ["decision API blocks approval until evidence review exists", decision.includes("IDENTITY_EVIDENCE_WORKFLOW_REQUIRED") && decision.includes('if (decision === "APPROVED")')]
];
for (const [label, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"} ${label}`);
  assert.ok(passed, label);
}
console.log(`Candidate identity-review UI/auth contract: ${checks.length} checks passed.`);
