import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

/**
 * Live N07 lifecycle/fault-injection probe. Uses only uniquely scoped,
 * non-candidate staging events. Requires a real active outbound-only mirror
 * target and trusted runner secrets. Never prints tokens, keys, or payloads.
 *
 * Accelerates retry timing by moving ONLY these test rows' next_attempt_at
 * into the past using the service role. Lease expiry is similarly injected
 * only for the uniquely scoped recovery test row.
 */
const required = [
  "KINGS_MEN_STAGING_SUPABASE_URL",
  "KINGS_MEN_STAGING_ANON_KEY",
  "KINGS_MEN_STAGING_SERVICE_ROLE_KEY",
  "KINGS_MEN_N07_REVIEWER_ACCESS_TOKEN",
  "KINGS_MEN_N07_ACTIVE_SYNC_TARGET_ID"
];
for (const name of required) assert.ok(process.env[name], `Missing required environment variable: ${name}`);

const baseUrl = process.env.KINGS_MEN_STAGING_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.KINGS_MEN_STAGING_ANON_KEY;
const serviceKey = process.env.KINGS_MEN_STAGING_SERVICE_ROLE_KEY;
const reviewerToken = process.env.KINGS_MEN_N07_REVIEWER_ACCESS_TOKEN;
const targetId = process.env.KINGS_MEN_N07_ACTIVE_SYNC_TARGET_ID;
const workerA = `n07-runtime-a-${randomUUID()}`;
const workerB = `n07-runtime-b-${randomUUID()}`;

async function request(path, { method = "GET", body, useAnon = false } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      apikey: useAnon ? anonKey : serviceKey,
      authorization: `Bearer ${useAnon ? anonKey : serviceKey}`,
      ...(body === undefined ? {} : { "content-type": "application/json", Prefer: "return=representation" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  assert.ok(response.ok, `${method} ${path} failed with HTTP ${response.status}`);
  return data;
}
async function enqueue(label) {
  const sourceEntityId = randomUUID();
  const sourceEntityType = "kingsmen_n07_lifecycle_test";
  const sourceVersion = `${label}-${Date.now()}-${randomUUID()}`;
  const response = await fetch(`${baseUrl}/functions/v1/n07-airtable-enqueue`, {
    method: "POST",
    headers: { apikey: anonKey, authorization: `Bearer ${reviewerToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      sourceEntityType, sourceEntityId, syncTargetId: targetId, sourceVersion,
      operation: "UPSERT_MIRROR",
      payload: { publicRef: `N07-LIFECYCLE-${label}`, status: "TEST_ONLY", title: "Non-candidate N07 lifecycle probe" }
    })
  });
  const data = await response.json().catch(() => ({}));
  assert.equal(response.status, 202, `enqueue failed: HTTP ${response.status}, status=${data.status ?? "unknown"}`);
  assert.equal(data.queued, true);
  return data.jobId;
}
async function rows(id) {
  const q = new URLSearchParams({ select: "id,status,attempts,max_attempts,next_attempt_at,locked_by,lease_expires_at,completed_at,error_code", id: `eq.${id}` });
  const result = await request(`/rest/v1/airtable_sync_outbox?${q}`);
  assert.equal(result.length, 1, "test job must exist exactly once");
  return result[0];
}
async function claim(worker) {
  return await request("/rest/v1/rpc/n07_claim_airtable_mirror_batch", {
    method: "POST", body: { p_worker_ref: worker, p_batch_size: 1 }
  });
}

// This staging probe uses the global claim RPC, so fail closed if there are
// existing claimable jobs rather than risk leasing another test/operator job.
const preflight = await request("/rest/v1/airtable_sync_outbox?select=id&status=in.(PENDING,LOCKED)&limit=1");
assert.equal(preflight.length, 0,
  "staging outbox has existing pending/locked work; isolate this lifecycle test before running");
async function finish(id, worker, succeeded, errorCode = null) {
  const result = await request("/rest/v1/rpc/n07_finish_airtable_mirror_job", {
    method: "POST",
    body: {
      p_job_id: id, p_worker_ref: worker, p_succeeded: succeeded,
      p_error_code: errorCode, p_redacted_error: succeeded ? null : "N07 automated test failure; no secrets or PII"
    }
  });
  return Array.isArray(result) ? result[0] : result;
}
async function patchTestRow(id, patch) {
  const q = new URLSearchParams({ id: `eq.${id}` });
  const response = await fetch(`${baseUrl}/rest/v1/airtable_sync_outbox?${q}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey, authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json", Prefer: "return=representation"
    },
    body: JSON.stringify(patch)
  });
  assert.ok(response.ok, `test-row fault injection failed with HTTP ${response.status}`);
  return await response.json();
}

// Failure/backoff/retry/exhaustion path.
const retryId = await enqueue("retry");
let job = await rows(retryId);
assert.equal(job.status, "PENDING");
for (let attempt = 1; attempt <= job.max_attempts; attempt++) {
  const claimed = await claim(workerA);
  assert.ok(claimed.some((x) => x.id === retryId), `attempt ${attempt}: job was not claimed`);
  job = await rows(retryId);
  assert.equal(job.status, "LOCKED");
  assert.equal(job.attempts, attempt);
  const result = await finish(retryId, workerA, false, "TEST_TRANSIENT_FAILURE");
  if (attempt < job.max_attempts) {
    assert.equal(result.status, "PENDING", "failed job below retry limit must return to pending");
    assert.ok(Date.parse(result.next_attempt_at) > Date.now(), "retry must be scheduled in the future");
    await patchTestRow(retryId, { next_attempt_at: new Date(Date.now() - 1000).toISOString() });
  } else {
    assert.equal(result.status, "DEAD_LETTER", "exhausted job must be dead-lettered");
  }
}
job = await rows(retryId);
assert.equal(job.status, "DEAD_LETTER");
assert.equal(job.attempts, job.max_attempts);

// Expired-lease recovery path, separate test job.
const recoveryId = await enqueue("lease-recovery");
const firstClaim = await claim(workerA);
assert.ok(firstClaim.some((x) => x.id === recoveryId), "recovery test job must be claimed initially");
let recovery = await rows(recoveryId);
assert.equal(recovery.status, "LOCKED");
assert.equal(recovery.attempts, 1);
await patchTestRow(recoveryId, { lease_expires_at: new Date(Date.now() - 60_000).toISOString() });
const secondClaim = await claim(workerB);
assert.ok(secondClaim.some((x) => x.id === recoveryId), "expired lease must be reclaimable by another worker");
recovery = await rows(recoveryId);
assert.equal(recovery.status, "LOCKED");
assert.equal(recovery.attempts, 2);
assert.equal(recovery.locked_by, workerB);
const completed = await finish(recoveryId, workerB, true);
assert.equal(completed.status, "COMPLETED");
recovery = await rows(recoveryId);
assert.equal(recovery.status, "COMPLETED");
assert.equal(recovery.locked_by, null);
assert.ok(recovery.completed_at);

console.log(JSON.stringify({
  test: "N07 durable worker lifecycle and fault injection",
  passed: true,
  transientFailureRetriesVerified: true,
  retryLimitDeadLetterVerified: true,
  expiredLeaseRecoveryVerified: true,
  successfulCompletionVerified: true,
  testRows: 2,
  candidateDataUsed: false,
  note: "Runs against staging only when an actual active outbound-only mirror target and trusted secrets are configured."
}, null, 2));
