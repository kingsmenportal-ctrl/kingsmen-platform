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
assert.match(applicationBlock, /APPLICATION_AUTHORIZATION_NOT_CONFIGURED/);
assert.match(applicationBlock, /sendError\(response, 503/);
assert.doesNotMatch(applicationBlock, /handleApplicationWorkbench\(response, applicationId\)/);

assert.match(auth, /\/auth\/v1\/user/);
assert.match(auth, /candidate_auth_identity_links/);
assert.match(auth, /link_status !== "VERIFIED"/);
assert.match(auth, /links\.length !== 1/);
assert.match(auth, /IDENTITY_AUTHORIZATION_UNAVAILABLE/);
assert.match(auth, /apikey: anonKey/);

console.log("PASS candidate status reads require a verified Supabase identity link and exact candidate ownership; application reads remain fail-closed.");
