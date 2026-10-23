import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";

/**
 * Authenticated staging integration test for N07 enqueue idempotency.
 * Requires a real active reviewer access token and a real active sync target.
 * Never prints tokens or payloads. It creates one uniquely scoped staging test job.
 */
const required = [
  "KINGS_MEN_STAGING_SUPABASE_URL",
  "KINGS_MEN_STAGING_ANON_KEY",
  "KINGS_MEN_STAGING_SERVICE_ROLE_KEY",
  "KINGS_MEN_N07_REVIEWER_ACCESS_TOKEN",
  "KINGS_MEN_N07_ACTIVE_SYNC_TARGET_ID"
];
for (const name of required) {
  assert.ok(process.env[name], `Missing required environment variable: ${name}`);
}

const baseUrl = process.env.KINGS_MEN_STAGING_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.KINGS_MEN_STAGING_ANON_KEY;
const serviceKey = process.env.KINGS_MEN_STAGING_SERVICE_ROLE_KEY;
const reviewerToken = process.env.KINGS_MEN_N07_REVIEWER_ACCESS_TOKEN;
const targetId = process.env.KINGS_MEN_N07_ACTIVE_SYNC_TARGET_ID;
const sourceEntityId = randomUUID();
const sourceEntityType = "kingsmen_n07_runtime_test";
const sourceVersion = `runtime-${Date.now()}-${randomUUID()}`;
const operation = "UPSERT_MIRROR";
const payload = {
  publicRef: `N07-RUNTIME-TEST-${sourceVersion.slice(-12)}`,
  status: "RUNTIME_TEST_ONLY",
  title: "N07 staging idempotency verification",
  sourceRef: "automated-staging-test",
  mirrorSummary: "Non-candidate test record; no personal information"
};
const idempotencyKey = "n07:" + createHash("sha256")
  .update([sourceEntityType, sourceEntityId, targetId, operation, sourceVersion].join("|"))
  .digest("hex");

async function enqueue() {
  const response = await fetch(`${baseUrl}/functions/v1/n07-airtable-enqueue`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${reviewerToken}`,
      apikey: anonKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sourceEntityType,
      sourceEntityId,
      syncTargetId: targetId,
      sourceVersion,
      operation,
      payload
    })
  });
  const body = await response.json().catch(() => ({}));
  assert.equal(response.status, 202, `N07 enqueue returned HTTP ${response.status}; status=${body.status ?? "unknown"}`);
  assert.equal(body.status, "QUEUED");
  assert.equal(body.queued, true);
  assert.equal(body.postgresTruthPreserved, true);
  assert.equal(body.airtableMirrorOnly, true);
  assert.ok(body.jobId, "enqueue response must include durable job ID");
  return body;
}

const first = await enqueue();
const second = await enqueue();
assert.equal(second.jobId, first.jobId, "duplicate enqueue must return the same durable job ID");

const verifyUrl = new URL(`${baseUrl}/rest/v1/airtable_sync_outbox`);
verifyUrl.searchParams.set("select", "id,idempotency_key,status,attempts,max_attempts");
verifyUrl.searchParams.set("idempotency_key", `eq.${idempotencyKey}`);
const verifyResponse = await fetch(verifyUrl, {
  headers: {
    apikey: anonKey,
    authorization: `Bearer ${serviceKey}`
  }
});
assert.equal(verifyResponse.status, 200, "service-role verification query must succeed");
const rows = await verifyResponse.json();
assert.equal(rows.length, 1, "exactly one durable outbox row must exist for the idempotency key");
assert.equal(rows[0].id, first.jobId, "database row ID must match the enqueue response");
assert.equal(rows[0].idempotency_key, idempotencyKey);
assert.ok(["PENDING", "LOCKED", "DONE", "FAILED", "DEAD_LETTER"].includes(rows[0].status),
  "database must return a recognised persisted queue state");

console.log(JSON.stringify({
  test: "N07 authenticated staging enqueue idempotency",
  passed: true,
  duplicateRequests: 2,
  sameJobIdReturned: true,
  durableRowsForIdempotencyKey: rows.length,
  observedJobStatus: rows[0].status,
  workerRoundTripVerified: false,
  note: "This test creates one non-candidate staging outbox row. It does not claim worker delivery or Airtable completion."
}, null, 2));
