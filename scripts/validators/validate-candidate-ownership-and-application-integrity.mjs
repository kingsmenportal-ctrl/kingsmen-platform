import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const trackerRoute = "apps/web/src/app/api/candidate/applications/route.ts";
const tracker = read(trackerRoute);

// API private-read responses must not be cached, and path parameters must only
// be decoded once (getPathParam owns decoding for these routes).
const apiServer = read("apps/api/src/server.ts");
assert.match(apiServer, /handleCandidateStatus\(request, response, candidateId\)/, "candidate status route must not double-decode path parameters");
assert.match(apiServer, /handleApplicationWorkbench\(request, response, applicationId\)/, "application workbench route must not double-decode path parameters");
for (const handler of ["handleCandidateStatus", "handleApplicationWorkbench"]) {
  const start = apiServer.indexOf(`async function ${handler}`);
  const end = apiServer.indexOf("\nasync function ", start + 1);
  const body = apiServer.slice(start, end < 0 ? apiServer.length : end);
  assert.match(body, /cache-control", "private, no-store"/, `${handler} must prevent shared/private caching`);
  assert.match(body, /pragma", "no-cache"/, `${handler} must prevent legacy cache reuse`);
}

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
assert.match(policy, /expectedEvidence/, "provided evidence must match the requested lifecycle outcome");
assert.match(policy, /EVIDENCE_MISMATCH/, "mismatched evidence must fail closed");
const truthVault = read("apps/api/src/db/truth-vault-repository.ts");
const ownedApplicationListStart = truthVault.indexOf("async listOwnedApplicationsForOwner");
const ownedApplicationListEnd = truthVault.indexOf("async listApplicationsForVerifiedSupabaseUser", ownedApplicationListStart);
const ownedApplicationList = truthVault.slice(ownedApplicationListStart, ownedApplicationListEnd);
assert.ok(ownedApplicationList.includes("this.pool!.connect()"), "candidate application tracker reads must use a dedicated transaction client");
assert.ok(ownedApplicationList.includes('await client.query("BEGIN")'), "candidate application tracker read must begin a transaction");
assert.ok(ownedApplicationList.includes('set_config(\'app.kingsmen_role\''), "candidate application tracker read must establish the scoped database security context");
assert.ok(ownedApplicationList.includes("limit 201") && ownedApplicationList.includes("result.rows.length > 200"), "candidate application tracker must detect overflow instead of silently truncating");
assert.ok(ownedApplicationList.includes("candidate.applications.listed"), "candidate application tracker reads must emit audit evidence");
assert.ok(ownedApplicationList.includes('await client.query("COMMIT")') && ownedApplicationList.includes('await client.query("ROLLBACK")'), "candidate application tracker read and audit must commit or roll back together");
const verifiedApplicationsStart = truthVault.indexOf("async listApplicationsForVerifiedSupabaseUser");
const verifiedApplicationsEnd = truthVault.indexOf("async listDocumentsForVerifiedSupabaseUser", verifiedApplicationsStart);
const verifiedApplications = truthVault.slice(verifiedApplicationsStart, verifiedApplicationsEnd);
assert.ok(verifiedApplications.includes("limit 201") && verifiedApplications.includes("result.rows.length > 200"), "verified-identity tracker must detect overflow rather than silently truncate at 200");
assert.ok(verifiedApplications.includes("candidate.applications.listed"), "verified-identity tracker reads must be audited");
assert.ok(verifiedApplications.includes("await client.query(\"COMMIT\")") && verifiedApplications.includes("await client.query(\"ROLLBACK\")"), "verified-identity tracker data and audit must share transaction boundary");
const apiServerSource = read("apps/api/src/server.ts");
assert.ok(apiServerSource.includes("CANDIDATE_APPLICATION_RESULT_LIMIT_EXCEEDED"), "API must return an explicit non-partial-result response when tracker output exceeds its cap");
assert.ok(apiServerSource.includes("CANDIDATE_DOCUMENT_RESULT_LIMIT_EXCEEDED"), "API must return an explicit non-partial-result response when candidate document metadata exceeds its cap");
const verifiedDocumentsStart = truthVault.indexOf("async listDocumentsForVerifiedSupabaseUser");
const verifiedDocumentsEnd = truthVault.indexOf("async resolveCandidateUuidForSupabaseUser", verifiedDocumentsStart);
const verifiedDocuments = truthVault.slice(verifiedDocumentsStart, verifiedDocumentsEnd);
assert.ok(verifiedDocuments.includes("limit 201") && verifiedDocuments.includes("result.rows.length > 200"), "verified-identity document metadata must detect overflow rather than silently truncate");
assert.ok(verifiedDocuments.includes("candidate.documents.listed"), "verified-identity document metadata reads must be audited");
assert.ok(verifiedDocuments.includes("linked.rows[0].candidate_id") && verifiedDocuments.includes("supabaseUserId"), "document access audit must bind the actor and candidate to the verified identity link");
assert.ok(verifiedDocuments.includes("await client.query(\"COMMIT\")") && verifiedDocuments.includes("await client.query(\"ROLLBACK\")"), "document metadata read and audit must share transaction boundaries");
assert.ok(apiServerSource.includes('throw new Error("INVALID_JSON")'), "malformed JSON must map to a client error");
const applicationRead = read("apps/api/src/candidate/candidate-application-read.ts");
assert.ok(applicationRead.includes("result.rows.length > 500"), "application tracker must detect result overflow");
assert.ok(applicationRead.includes("CANDIDATE_APPLICATION_RESULT_LIMIT_EXCEEDED"), "application tracker must not silently truncate results");
assert.ok(applicationRead.includes("CANDIDATE_APPLICATION_ROW_INVALID"), "application tracker must reject malformed database rows");
assert.ok(applicationRead.includes("Number.isFinite(Date.parse(row.updated_at))"), "application tracker must validate application timestamps");
const applicationReadTests = read("apps/api/src/candidate/candidate-application-read.test.ts");
assert.ok(applicationReadTests.includes("fails closed when a joined application row has missing required fields"));
assert.ok(applicationReadTests.includes("fails closed when application timestamps are malformed"));
assert.ok(applicationReadTests.includes("allows nullable optional institution and evidence references"));
assert.ok(read("apps/api/src/candidate/candidate-application-read.test.ts").includes("fails closed rather than silently truncating more than 500 applications"));

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
  assert.match(source, /status:\s*503/);
  assert.match(source, /Cache-Control/);
  assert.doesNotMatch(source, /createSignedUrl|createSignedUploadUrl|signedUrl\s*:/i);
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
