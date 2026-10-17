import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("db/migrations/0040_candidate_auth_identity_link.sql");
const resolver = read("apps/api/src/candidate/candidate-identity-link.ts");
const adminRuntime = read("apps/api/src/candidate/candidate-identity-link-admin-runtime.ts");
const lifecycle = read("apps/api/src/candidate/candidate-identity-link-lifecycle.ts");
const profile = read("apps/web/src/app/api/candidate/profile/route.ts");
const applications = read("apps/web/src/app/api/candidate/applications/route.ts");
const upload = read("apps/web/src/app/api/candidate/documents/upload-url/route.ts");
const readUrl = read("apps/web/src/app/api/candidate/documents/read-url/route.ts");

assert.match(migration, /supabase_user_id uuid NOT NULL UNIQUE/i, "one auth user must map to at most one candidate");
assert.match(migration, /candidate_id uuid NOT NULL UNIQUE/i, "one candidate must map to at most one auth user");
assert.match(migration, /link_status IN \('PENDING', 'VERIFIED', 'REVOKED'\)/, "identity links must use explicit lifecycle states");
assert.match(migration, /ENABLE ROW LEVEL SECURITY/i, "identity mapping table must have RLS enabled");
assert.match(migration, /candidate_auth_identity_links_backend_all[\s\S]*?is_backend_service_role\(\)/i, "identity mapping mutations must be backend-only");
assert.match(resolver, /link\.link_status = 'VERIFIED'/, "only verified mappings may resolve candidate identity");
assert.match(resolver, /candidate\.is_active = true/, "inactive candidate records must not resolve");
assert.match(resolver, /limit 2/i, "identity resolution must detect duplicate rows and fail closed");
const identityQuery = resolver.match(/`select link\\.candidate_id[\\s\\S]*?`/)?.[0] ?? "";\nassert.ok(identityQuery.length > 0, "identity resolver must expose its explicit SQL lookup");\nassert.doesNotMatch(identityQuery, /email/i, "identity mapping query must never fall back to email matching");
assert.match(adminRuntime, /operatorResolver\.resolve\(requestContext\)/, "identity link lifecycle must resolve trusted operator context");
assert.match(adminRuntime, /REQUIRED_PERMISSION\[action\]/, "identity actions must have action-specific permissions");
assert.match(adminRuntime, /withCandidateBackendTransaction\(this\.pool/, "identity mutations must use a scoped backend transaction");
assert.match(lifecycle, /CANDIDATE_IDENTITY_LINK_CREATED_PENDING/, "pending identity link creation must be audited");
assert.match(lifecycle, /CANDIDATE_IDENTITY_LINK_VERIFIED/, "identity verification must be audited");
assert.match(lifecycle, /CANDIDATE_IDENTITY_LINK_REVOKED/, "identity revocation must be audited");
assert.match(profile, /CANDIDATE_PROFILE_LINK_REQUIRED/, "candidate profile must fail closed without a verified mapping");
assert.match(applications, /CANDIDATE_PROFILE_LINK_REQUIRED/, "candidate applications must fail closed without a verified mapping");
for (const [path, source] of [["upload-url", upload], ["read-url", readUrl]]) {
  assert.match(source, /CANDIDATE_AUTHORIZATION_NOT_CONFIGURED/, path + " must remain blocked until a secure identity and storage adapter exist");
  assert.match(source, /status:\s*503/, path + " must report unavailable capability rather than a fake success");
  assert.doesNotMatch(source, /createSignedUrl|createSignedUploadUrl|signedUrl\s*:/i, path + " must not fabricate signed storage URLs");
}

// Do not let a future route expose the runtime without a real trusted resolver.
function filesUnder(directory) {
  return readdirSync(resolve(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}
const apiRoutes = filesUnder("apps/web/src/app/api").filter((path) => path.endsWith("route.ts"));
for (const path of apiRoutes) {
  const source = read(path);
  assert.doesNotMatch(source, /CandidateIdentityLinkAdminRuntime/, path + " must not expose the operator-only identity lifecycle runtime directly");
}

console.log("Candidate identity live-readiness boundary checks passed.");
console.log("Runtime proof still requires a trusted operator resolver, verified identity mapping, and end-to-end staging session.");
