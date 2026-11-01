import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveCandidateIdentity, candidateOwnsResource } = require("../../apps/api/dist/security/candidate-identity-authorization.js");

const URL = "https://project.example";
const ANON = "public-anon-key";
const USER_A = "123e4567-e89b-42d3-a456-426614174001";
const USER_B = "123e4567-e89b-42d3-a456-426614174002";
const CANDIDATE_A = "123e4567-e89b-42d3-a456-426614174011";
const CANDIDATE_B = "123e4567-e89b-42d3-a456-426614174012";
const env = { SUPABASE_URL: URL, SUPABASE_ANON_KEY: ANON };

function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}
function fetchSequence(...items) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    const item = items.shift();
    if (item instanceof Error) throw item;
    if (!item) throw new Error("Unexpected fetch");
    return item;
  };
  fetcher.calls = calls;
  return fetcher;
}
const authOK = (id) => response(200, { id });
const linkOK = (candidateId, status = "VERIFIED") => response(200, [{ candidate_id: candidateId, link_status: status }]);

// Valid token + exactly one verified identity link.
{
  const fetcher = fetchSequence(authOK(USER_A), linkOK(CANDIDATE_A));
  const result = await resolveCandidateIdentity("Bearer signed-user-token", env, fetcher);
  assert.deepEqual(result, { ok: true, supabaseUserId: USER_A, candidateId: CANDIDATE_A });
  assert.equal(fetcher.calls.length, 2);
  assert.equal(fetcher.calls[0].url, `${URL}/auth/v1/user`);
  assert.equal(fetcher.calls[0].init.headers.Authorization, "Bearer signed-user-token");
  assert.equal(fetcher.calls[0].init.headers.apikey, ANON);
  assert.ok(fetcher.calls[0].init.signal instanceof AbortSignal, "Auth lookup must be bounded by a timeout signal");
  assert.equal(fetcher.calls[1].url, `${URL}/rest/v1/rpc/resolve_my_candidate_identity`);
  assert.ok(fetcher.calls[1].init.signal instanceof AbortSignal, "Identity RPC must be bounded by a timeout signal");
  assert.equal(fetcher.calls[1].init.method, "POST");
  assert.equal(fetcher.calls[1].init.body, "{}");
  assert.equal(fetcher.calls[1].init.headers.Authorization, "Bearer signed-user-token");
  assert.equal(fetcher.calls[1].init.headers.apikey, ANON);
  assert.equal("service_role" in fetcher.calls[1].init.headers, false);
}

// Missing bearer token and missing public configuration fail before database lookup.
{
  const result = await resolveCandidateIdentity(undefined, env, async () => { throw new Error("must not fetch"); });
  assert.deepEqual(result, { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED" });
}
{
  const result = await resolveCandidateIdentity("Bearer token", { SUPABASE_URL: URL }, async () => { throw new Error("must not fetch"); });
  assert.deepEqual(result, { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_NOT_CONFIGURED" });
}
for (const unsafeUrl of [
  "http://project.example",
  "https://user:secret@project.example",
  "https://project.example/custom-path",
  "https://project.example/?override=1"
]) {
  const result = await resolveCandidateIdentity("Bearer valid-token", { SUPABASE_URL: unsafeUrl, SUPABASE_ANON_KEY: ANON }, async () => { throw new Error("must not fetch"); });
  assert.deepEqual(result, { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_NOT_CONFIGURED" });
}
{
  const result = await resolveCandidateIdentity("Bearer " + "x".repeat(8193), env, async () => { throw new Error("must not fetch"); });
  assert.deepEqual(result, { ok: false, status: 401, code: "AUTHENTICATION_REQUIRED" });
}
{
  const localEnv = { SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_ANON_KEY: ANON };
  const fetcher = fetchSequence(authOK(USER_A), linkOK(CANDIDATE_A));
  const result = await resolveCandidateIdentity("Bearer local-token", localEnv, fetcher);
  assert.equal(result.ok, true, "localhost HTTP must remain available for local development");
}

// Supabase Auth rejects the token or returns malformed identity: no link query follows.
for (const authResponse of [response(401, { message: "invalid" }), response(200, {}), response(200, { id: " " }), response(200, { id: "not-a-uuid" })]) {
  const fetcher = fetchSequence(authResponse);
  const result = await resolveCandidateIdentity("Bearer bad-token", env, fetcher);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal(fetcher.calls.length, 1);
}

// No link, duplicate links, or a non-verified link are all denied.
for (const links of [
  response(200, []),
  response(200, [
    { candidate_id: CANDIDATE_A, link_status: "VERIFIED" },
    { candidate_id: CANDIDATE_B, link_status: "VERIFIED" }
  ]),
  linkOK(CANDIDATE_A, "PENDING"),
  response(200, [{ candidate_id: "", link_status: "VERIFIED" }]),
  response(200, [{ candidate_id: "not-a-uuid", link_status: "VERIFIED" }]),
  response(200, { candidate_id: CANDIDATE_A, link_status: "VERIFIED" })
]) {
  const fetcher = fetchSequence(authOK(USER_A), links);
  const result = await resolveCandidateIdentity("Bearer valid-token", env, fetcher);
  assert.deepEqual(result, { ok: false, status: 403, code: "VERIFIED_IDENTITY_LINK_REQUIRED" });
}

// Lookup denial, malformed JSON, and network errors fail closed without leaking details.
{
  const result = await resolveCandidateIdentity("Bearer valid-token", env, fetchSequence(authOK(USER_A), response(403, {})));
  assert.deepEqual(result, { ok: false, status: 503, code: "IDENTITY_LINK_LOOKUP_FAILED" });
}
{
  const fetcher = fetchSequence({ ok: true, json: async () => ({ id: USER_A }) }, { ok: true, json: async () => { throw new Error("sensitive database text"); } });
  const result = await resolveCandidateIdentity("Bearer valid-token", env, fetcher);
  assert.deepEqual(result, { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_UNAVAILABLE" });
}
{
  const result = await resolveCandidateIdentity("Bearer valid-token", env, fetchSequence(new Error("private network detail")));
  assert.deepEqual(result, { ok: false, status: 503, code: "IDENTITY_AUTHORIZATION_UNAVAILABLE" });
}

// Reciprocal Candidate A/B ownership tests use the same predicate as both API routes.
const identityA = { ok: true, supabaseUserId: USER_A, candidateId: CANDIDATE_A };
const identityB = { ok: true, supabaseUserId: USER_B, candidateId: CANDIDATE_B };
assert.equal(candidateOwnsResource(identityA, CANDIDATE_A), true);
assert.equal(candidateOwnsResource(identityA, CANDIDATE_B), false);
assert.equal(candidateOwnsResource(identityB, CANDIDATE_B), true);
assert.equal(candidateOwnsResource(identityB, CANDIDATE_A), false);
assert.equal(candidateOwnsResource({ ok: false, status: 401, code: "INVALID_AUTHENTICATION" }, CANDIDATE_A), false);
assert.equal(candidateOwnsResource(identityA, undefined), false);

console.log("PASS runtime identity resolver: valid/invalid tokens, config, missing/unverified/duplicate links, lookup/network failures, and reciprocal Candidate A/B ownership denial.");
