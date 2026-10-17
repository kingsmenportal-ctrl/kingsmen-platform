import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const trackerRoute = "apps/web/src/app/api/candidate/applications/route.ts";
const tracker = read(trackerRoute);

// Authentication must be checked before the route returns any application data.
assert.match(tracker, /authConfigured\(\)/, "tracker route must detect missing identity-provider configuration");
assert.match(tracker, /getVerifiedAuthUser\(\)/, "tracker route must resolve a verified server-side identity");
assert.match(tracker, /status:\s*401/, "signed-out callers must receive 401");
assert.match(tracker, /CANDIDATE_PROFILE_LINK_REQUIRED/, "authenticated users without a verified candidate mapping must not receive data");
assert.match(tracker, /status:\s*503/, "missing candidate mapping must fail closed");
assert.doesNotMatch(tracker, /applications:\s*\[\s*\]/i, "blocked access must not be misrepresented as an empty application list");
assert.doesNotMatch(tracker, /localStorage|candidateId\s*:\s*request/i, "caller-controlled/local browser identity must not authorize records");

// The application-state policy is pure and must reject unsupported outcomes.
const policyPath = "apps/api/src/personal-jobs/application-state.ts";
const policy = read(policyPath);
for (const state of [
  "preparation", "ready_for_manual_submission", "submission_in_progress",
  "submitted_verified", "follow_up_scheduled", "interview", "rejected",
  "offer_received", "closed"
]) assert.ok(policy.includes(`"${state}"`), `missing lifecycle state: ${state}`);
assert.match(policy, /EVIDENCE_REQUIRED/);
assert.match(policy, /EVIDENCE_MISMATCH/);
assert.match(policy, /requiresAudit:\s*true/);
assert.match(policy, /requiresAtomicPersistence:\s*true/);
assert.match(policy, /employerOnlyStates/, "employer-reported outcomes must have actor restrictions");

const policyTests = read("apps/api/src/personal-jobs/application-state.test.ts");
for (const phrase of [
  "invalid and backward terminal transitions",
  "without a candidate receipt",
  "cannot fabricate interview, rejection, or offer",
  "audit and atomic persistence",
  "closure from active states"
]) assert.ok(policyTests.includes(phrase), `missing regression coverage: ${phrase}`);

// Document routes must remain unavailable until ownership and real private storage exist.
const documentRoutes = [
  ["apps/web/src/app/api/candidate/documents/upload-url/route.ts", "POST"],
  ["apps/web/src/app/api/candidate/documents/read-url/route.ts", "POST"],
  ["apps/web/src/app/api/candidate/documents/status/route.ts", "GET"]
];
for (const [path, method] of documentRoutes) {
  const source = read(path);
  assert.match(source, new RegExp(`export async function ${method}\\(\\s*\\)`));
  assert.match(source, /CANDIDATE_AUTHORIZATION_NOT_CONFIGURED/);
  assert.match(source, /status:\\s*503/);
  assert.match(source, /Cache-Control/);
  assert.doesNotMatch(source, /createSignedUrl|createSignedUploadUrl|signedUrl\\s*:/i);
}

console.log(JSON.stringify({
  validator: "candidate-ownership-and-application-integrity",
  status: "PASS",
  checks: [
    "server-side identity required",
    "candidate profile mapping fails closed",
    "all application lifecycle states declared",
    "evidence-gated outcomes and audit/persistence contract declared",
    "regression coverage declarations present",
    "document signing/status routes remain blocked without ownership and storage"
  ],
  limitation: "Static source contract only; not a TypeScript build, runtime authorization test, database-policy test, or deployed-provider verification."
}, null, 2));
