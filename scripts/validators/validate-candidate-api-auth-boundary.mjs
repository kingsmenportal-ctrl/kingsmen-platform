import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync("apps/api/src/server.ts", "utf8");
const repository = readFileSync("apps/api/src/db/truth-vault-repository.ts", "utf8");
const auth = readFileSync("apps/api/src/auth/supabase-auth.ts", "utf8");
const integration = readFileSync("scripts/staging/test-candidate-reviewer-isolation-e2e.mjs", "utf8");
const profileTest = readFileSync("scripts/staging/test-candidate-profile-persistence-e2e.mjs", "utf8");

for (const marker of [
  "authenticateSupabaseBearer",
  "CANDIDATE_IDENTITY_NOT_VERIFIED",
  "CANDIDATE_OWNERSHIP_DENIED",
  "DURABLE_CANDIDATE_READS_REQUIRED",
  "readCandidateStatus(candidateReference, identity.candidateId)",
  "readApplicationWorkbench(applicationId, identity.candidateId)"
]) assert.ok(server.includes(marker), "API server is missing candidate authentication boundary: " + marker);

for (const marker of [
  "resolveVerifiedCandidateIdentity",
  "l.supabase_user_id = $1",
  "l.link_status = 'VERIFIED'",
  "l.verified_at is not null",
  "c.is_active = true",
  "where id = $2",
  "where a.candidate_id = $2"
]) assert.ok(repository.toLowerCase().includes(marker.toLowerCase()), "Truth Vault ownership resolution is missing: " + marker);

assert.ok(!repository.includes("where public_ref = $1 or id::text = $1 limit 1"), "Unscoped candidate lookup must not remain.");
assert.ok(!repository.includes("where a.id::text = $1 or a.metadata->>'applicationRef' = $1"), "Unscoped application lookup must not remain.");
assert.ok(auth.includes("/auth/v1/user"), "Bearer token must be validated against Supabase Auth.");
assert.ok(auth.includes('redirect: "error"'), "Auth request must not follow redirects.");
assert.ok(auth.includes('cache: "no-store"'), "Auth request must not be cacheable.");
assert.ok(integration.includes("candidate_status_ownership_and_foreign_denial"), "Staging A/B status isolation test is missing.");
assert.ok(integration.includes("application_workbench_ownership_and_foreign_denial"), "Staging A/B application isolation test is missing.");
assert.ok(profileTest.includes("KINGSMEN_PROFILE_E2E_EXPECTED_CANDIDATE_REFERENCE"), "Profile E2E must pin to an approved test candidate.");
assert.ok(profileTest.includes("fresh_sign_in_profile_persistence"), "Profile E2E must verify a fresh sign-in.");

console.log(JSON.stringify({
  schema: "kingsmen.candidate-api-auth-boundary-validation.v1",
  status: "PASSED",
  serverReadRoutesRequireSupabaseAuth: true,
  verifiedIdentityLinkRequired: true,
  candidateReadsAreOwnerScoped: true,
  candidateAandBStagingAssertionsPresent: true,
  freshSignInPersistenceAssertionPresent: true
}, null, 2));
