import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../../apps/api/src/server.ts", import.meta.url), "utf8");
const auth = readFileSync(new URL("../../apps/api/src/security/candidate-identity-authorization.ts", import.meta.url), "utf8");
const candidateRoute = source.indexOf('const candidateId = getPathParam(/^\\/api\\/candidates\\/([^/]+)\\/status$/, pathname);');
const applicationRoute = source.indexOf('const applicationId = getPathParam(/^\\/api\\/applications\\/([^/]+)\\/workbench$/, pathname);');
assert.notEqual(candidateRoute, -1, "candidate status route must exist");
assert.notEqual(applicationRoute, -1, "application workbench route must exist");

const candidateBlock = source.slice(candidateRoute, source.indexOf("const applicationId", candidateRoute));
const applicationBlock = source.slice(applicationRoute, source.indexOf('sendError(response, 404, "ROUTE_NOT_FOUND"', applicationRoute));

assert.match(candidateBlock, /resolveCandidateIdentity/);
assert.match(candidateBlock, /identity\.candidateId !== candidateId/);
assert.match(candidateBlock, /CANDIDATE_OWNERSHIP_MISMATCH/);
assert.match(candidateBlock, /handleCandidateStatus\(response, candidateId\)/);
assert.match(applicationBlock, /resolveCandidateIdentity/);
assert.match(applicationBlock, /application\.candidateId !== identity\.candidateId/);
assert.match(applicationBlock, /APPLICATION_OWNERSHIP_MISMATCH/);
assert.match(applicationBlock, /handleApplicationWorkbench\(response, applicationId\)/);

assert.match(auth, /\/auth\/v1\/user/);
assert.match(auth, /rpc\/resolve_my_candidate_identity/);
assert.match(auth, /VERIFIED_IDENTITY_LINK_REQUIRED/);
assert.match(auth, /links\.length !== 1/);
assert.match(auth, /IDENTITY_AUTHORIZATION_UNAVAILABLE/);
assert.match(auth, /apikey: anonKey/);


const migration = readFileSync(new URL("../../supabase/migrations/20261101121500_caller_scoped_candidate_identity_rpc.sql", import.meta.url), "utf8");
assert.match(migration, /security definer/i);
assert.match(migration, /set search_path = ''/i);
assert.match(migration, /auth\.uid\(\)/);
assert.match(migration, /count\(\*\)[\s\S]*= 1/);
assert.match(migration, /revoke all on function public\.resolve_my_candidate_identity\(\) from public/i);
assert.match(migration, /revoke all on function public\.resolve_my_candidate_identity\(\) from anon/i);
assert.match(migration, /grant execute on function public\.resolve_my_candidate_identity\(\) to authenticated/i);
assert.doesNotMatch(migration, /grant select on public\.candidate_auth_identity_links/i);

console.log("PASS candidate status/application ownership routes and caller-scoped identity RPC security contract.");
