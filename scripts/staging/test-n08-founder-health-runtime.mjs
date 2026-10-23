import assert from "node:assert/strict";

/**
 * Live N08 health endpoint probe. Uses an actual founder-admin access token.
 * No service-role credential is needed or accepted by this script.
 */
const required = [
  "KINGSMEN_STAGING_SUPABASE_URL",
  "KINGSMEN_STAGING_ANON_KEY",
  "KINGSMEN_FOUNDER_ADMIN_ACCESS_TOKEN"
];
for (const name of required) assert.ok(process.env[name], `Missing required environment variable: ${name}`);

const baseUrl = process.env.KINGSMEN_STAGING_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.KINGSMEN_STAGING_ANON_KEY;
const founderToken = process.env.KINGSMEN_FOUNDER_ADMIN_ACCESS_TOKEN;
const endpoint = `${baseUrl}/functions/v1/n08-founder-control-plane-health`;

const unauthenticated = await fetch(endpoint, {
  method: "GET",
  headers: { apikey: anonKey }
});
assert.equal(unauthenticated.status, 401, "health endpoint must reject requests without a bearer token");

const authorized = await fetch(endpoint, {
  method: "GET",
  headers: { apikey: anonKey, authorization: `Bearer ${founderToken}` }
});
const body = await authorized.json().catch(() => ({}));
assert.equal(authorized.status, 200,
  `founder admin health request failed with HTTP ${authorized.status}; status=${body.status ?? "unknown"}`);
assert.equal(body.schema, "kingsmen.n08-live-founder-health.v1");
assert.ok(["OBSERVED", "DEGRADED"].includes(body.status), "health state must be explicit");
assert.equal(body.productionReady, false, "health endpoint must not claim production readiness");
assert.equal(body.sourceOfTruth, "PostgreSQL");
assert.equal(body.airtableRole, "OPTIONAL_ASYNC_MIRROR");
assert.equal(body.integrationReadiness?.airtableConnectionCanBlockCandidateFlows, false);
assert.equal(body.controls?.piiReturned, false);
assert.equal(body.controls?.candidateRecordsReturned, false);
assert.ok(Number.isInteger(body.degradedSignals) && body.degradedSignals >= 0);
assert.ok(!Number.isNaN(Date.parse(body.observedAt)), "observation timestamp must be valid");
for (const key of ["waiting", "active", "failed", "deadLettered", "available"]) {
  assert.ok(key in (body.queue ?? {}), `queue metric missing: ${key}`);
}
for (const key of [
  "candidateSubmissionsWaiting",
  "founderCommandsAwaitingAction",
  "openEscalations",
  "failedOpportunityIngestionRuns"
]) {
  assert.ok(key in (body.operationalQueues ?? {}), `operational metric missing: ${key}`);
}
for (const metric of Object.values(body.operationalQueues)) {
  assert.equal(typeof metric.available, "boolean", "each operational metric must report availability");
}

console.log(JSON.stringify({
  test: "N08 live founder health endpoint",
  passed: true,
  unauthenticatedRequestRejected: true,
  authorizedFounderRequestAccepted: true,
  status: body.status,
  degradedSignals: body.degradedSignals,
  piiReturned: body.controls.piiReturned,
  productionReady: body.productionReady
}, null, 2));
