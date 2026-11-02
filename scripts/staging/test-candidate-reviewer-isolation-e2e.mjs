#!/usr/bin/env node
/**
 * Read-only authenticated staging isolation test.
 * Requires two pre-provisioned, verified test candidates, one reviewer grant,
 * and one private test document for each candidate. No staging data is created or changed.
 */
import assert from "node:assert/strict";

const siteRaw = process.env.KINGSMEN_STAGING_BASE_URL;
const supabaseRaw = process.env.KINGSMEN_SUPABASE_URL;
const anonKey = process.env.KINGSMEN_SUPABASE_ANON_KEY;
const aToken = process.env.KINGSMEN_E2E_CANDIDATE_A_TOKEN;
const bToken = process.env.KINGSMEN_E2E_CANDIDATE_B_TOKEN;
const reviewerToken = process.env.KINGSMEN_E2E_REVIEWER_TOKEN;
const aDocumentId = process.env.KINGSMEN_E2E_CANDIDATE_A_DOCUMENT_ID;
const bDocumentId = process.env.KINGSMEN_E2E_CANDIDATE_B_DOCUMENT_ID;

function blocked(code, message) {
  console.error(JSON.stringify({ schema: "kingsmen.candidate-reviewer-isolation-e2e.v1", status: code, message }));
  process.exit(2);
}
if (![siteRaw, supabaseRaw, anonKey, aToken, bToken, reviewerToken, aDocumentId, bDocumentId].every(Boolean)) {
  blocked("BLOCKED_CONFIGURATION_MISSING", "Provide the staging URLs, public anon key, two authorised candidate tokens, reviewer token and two private test document IDs.");
}
let site;
let supabase;
try { site = new URL(siteRaw); supabase = new URL(supabaseRaw); }
catch { blocked("BLOCKED_INVALID_URL", "Staging or Supabase URL is invalid."); }
if (site.protocol !== "https:" || supabase.protocol !== "https:") blocked("BLOCKED_INSECURE_URL", "HTTPS is required for staging and Supabase.");
if (aToken === bToken || aToken === reviewerToken || bToken === reviewerToken) blocked("BLOCKED_IDENTITIES_NOT_DISTINCT", "Candidate A, Candidate B and reviewer must use three distinct access tokens.");

const results = [];
async function jsonRequest(url, token, payload, method = "POST", includeApiKey = false) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  if (includeApiKey) headers.apikey = anonKey;
  const response = await fetch(url, {
    method,
    headers,
    ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000)
  });
  let body = {};
  try { body = await response.json(); } catch { /* handled by status assertions */ }
  return { status: response.status, body };
}
async function loadProfile(token, label) {
  const result = await jsonRequest(new URL("/api/candidate/profile", site), token, { action: "load" });
  assert.equal(result.status, 200, label + " profile load did not return HTTP 200");
  assert.equal(result.body.ok, true, label + " profile load did not return ok=true");
  assert.equal(typeof result.body.candidateReference, "string", label + " has no verified candidate reference");
  assert.ok(result.body.candidateReference.length > 0, label + " candidate reference is empty");
  assert.equal(result.body.identityStatus, "VERIFIED", label + " must be a verified dedicated test candidate");
  return result.body.candidateReference;
}
const refA = await loadProfile(aToken, "Candidate A");
const refB = await loadProfile(bToken, "Candidate B");
assert.notEqual(refA, refB, "Candidate A and B must resolve to different candidate references");
results.push("candidate_profiles_are_distinct");

async function ownDocumentRead(token, documentId, label) {
  const result = await jsonRequest(new URL("/api/candidate/documents/read-url", site), token, { documentId });
  assert.equal(result.status, 200, label + " could not read its own private test document");
  assert.equal(result.body.ok, true, label + " own-document read did not return ok=true");
  assert.equal(typeof result.body.signedReadUrl, "string", label + " own-document read returned no signed URL");
}
async function foreignDocumentDenied(token, documentId, label) {
  const result = await jsonRequest(new URL("/api/candidate/documents/read-url", site), token, { documentId });
  assert.ok([403, 404].includes(result.status), label + " unexpectedly accessed another candidate's document");
  assert.equal(typeof result.body.signedReadUrl, "undefined", label + " received a foreign signed document URL");
}
await ownDocumentRead(aToken, aDocumentId, "Candidate A");
await ownDocumentRead(bToken, bDocumentId, "Candidate B");
await foreignDocumentDenied(aToken, bDocumentId, "Candidate A");
await foreignDocumentDenied(bToken, aDocumentId, "Candidate B");
results.push("candidate_document_ownership_and_foreign_denial");

const queueUrl = new URL("/functions/v1/candidate-identity-review-queue", supabase);
const reviewerQueue = await jsonRequest(queueUrl, reviewerToken, undefined, "GET", true);
assert.equal(reviewerQueue.status, 200, "Authorised reviewer could not access the identity-review queue");
assert.ok(Array.isArray(reviewerQueue.body.requests), "Reviewer queue returned an unexpected response shape");
const candidateAQueue = await jsonRequest(queueUrl, aToken, undefined, "GET", true);
const candidateBQueue = await jsonRequest(queueUrl, bToken, undefined, "GET", true);
assert.equal(candidateAQueue.status, 403, "Candidate A unexpectedly accessed the reviewer queue");
assert.equal(candidateBQueue.status, 403, "Candidate B unexpectedly accessed the reviewer queue");
results.push("reviewer_positive_access_and_candidate_role_denials");

console.log(JSON.stringify({
  schema: "kingsmen.candidate-reviewer-isolation-e2e.v1",
  status: "PASS",
  environment: "staging",
  tests: results,
  identityValuesLogged: false,
  tokensLogged: false,
  databaseMutations: false,
  note: "Read-only tests used pre-provisioned candidate-owned files and an existing least-privilege reviewer grant."
}, null, 2));
