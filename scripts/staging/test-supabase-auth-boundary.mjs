import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://fixture.supabase.co";
process.env.SUPABASE_ANON_KEY = "fixture-anon-key";

const { authenticateSupabaseBearer } = await import("../../apps/api/dist/auth/supabase-auth.js");
const originalFetch = globalThis.fetch;
let calls = 0;
let nextResponse = new Response(JSON.stringify({ id: "11111111-1111-4111-8111-111111111111" }), {
  status: 200,
  headers: { "content-type": "application/json" }
});

globalThis.fetch = async (input, init) => {
  calls += 1;
  assert.equal(String(input), "https://fixture.supabase.co/auth/v1/user");
  assert.equal(init?.method, "GET");
  assert.equal(init?.redirect, "error");
  assert.equal(init?.cache, "no-store");
  assert.equal(init?.headers?.apikey, "fixture-anon-key");
  return nextResponse;
};

try {
  const noToken = await authenticateSupabaseBearer(undefined);
  assert.equal(noToken.ok, false);
  assert.equal(noToken.status, 401);
  assert.equal(calls, 0, "missing bearer must not call Auth");

  const malformed = await authenticateSupabaseBearer("Basic abc");
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "AUTHENTICATION_REQUIRED");
  assert.equal(calls, 0, "malformed bearer must not call Auth");

  nextResponse = new Response("{}", { status: 401 });
  const expired = await authenticateSupabaseBearer("Bearer " + "x".repeat(40));
  assert.equal(expired.ok, false);
  assert.equal(expired.status, 401);
  assert.equal(expired.code, "INVALID_SESSION");

  nextResponse = new Response("{}", { status: 503 });
  const unavailable = await authenticateSupabaseBearer("Bearer " + "x".repeat(40));
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.code, "AUTH_PROVIDER_UNAVAILABLE");

  nextResponse = new Response(JSON.stringify({ id: "not-a-uuid" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
  const malformedIdentity = await authenticateSupabaseBearer("Bearer " + "x".repeat(40));
  assert.equal(malformedIdentity.ok, false);
  assert.equal(malformedIdentity.status, 401);
  assert.equal(malformedIdentity.code, "INVALID_SESSION");

  const validUserId = "11111111-1111-4111-8111-111111111111";
  nextResponse = new Response(JSON.stringify({ id: validUserId }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
  const accepted = await authenticateSupabaseBearer("Bearer " + "x".repeat(40));
  assert.deepEqual(accepted, { ok: true, userId: validUserId });

  globalThis.fetch = async () => { throw new Error("network unavailable"); };
  const networkFailure = await authenticateSupabaseBearer("Bearer " + "x".repeat(40));
  assert.equal(networkFailure.ok, false);
  assert.equal(networkFailure.status, 503);
  assert.equal(networkFailure.code, "AUTH_PROVIDER_UNAVAILABLE");

  console.log(JSON.stringify({
    schema: "kingsmen.supabase-auth-boundary-test.v1",
    status: "PASSED",
    cases: 7,
    candidateIdFromClientAccepted: false,
    tokenValuesLogged: false
  }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
}
