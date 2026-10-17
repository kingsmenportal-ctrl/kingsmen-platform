#!/usr/bin/env node
/**
 * Authenticated N05 staging isolation test.
 *
 * Required env:
 *   N05_BASE_URL
 *   N05_CANDIDATE_A_TOKEN
 *   N05_CANDIDATE_B_TOKEN
 *   N05_CANDIDATE_A_DOCUMENT_ID (a real active CLEAN document owned by candidate A)
 *   N05_CANDIDATE_A_QUARANTINED_DOCUMENT_ID (a real quarantined document owned by candidate A)
 *
 * This test does not create, delete, or modify documents. The A read-url check
 * creates an access-audit event and returns a short-lived signed URL.
 */
import assert from "node:assert/strict";

const baseUrl = process.env.N05_BASE_URL?.trim().replace(/\/+$/, "");
const tokenA = process.env.N05_CANDIDATE_A_TOKEN?.trim();
const tokenB = process.env.N05_CANDIDATE_B_TOKEN?.trim();
const documentIdA = process.env.N05_CANDIDATE_A_DOCUMENT_ID?.trim();
const quarantinedDocumentIdA = process.env.N05_CANDIDATE_A_QUARANTINED_DOCUMENT_ID?.trim();

function requireEnv(name, value) {
  if (!value) {
    console.error(`N05 isolation test is BLOCKED: required environment variable ${name} is missing.`);
    process.exit(2);
  }
}
requireEnv("N05_BASE_URL", baseUrl);
requireEnv("N05_CANDIDATE_A_TOKEN", tokenA);
requireEnv("N05_CANDIDATE_B_TOKEN", tokenB);
requireEnv("N05_CANDIDATE_A_DOCUMENT_ID", documentIdA);
requireEnv("N05_CANDIDATE_A_QUARANTINED_DOCUMENT_ID", quarantinedDocumentIdA);
assert.notEqual(tokenA, tokenB, "Candidate A and B must use separate authenticated sessions.");

async function request(path, token, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
      accept: "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store"
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

const results = [];
function record(name, passed, detail) {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}: ${detail}`);
}

const unauthenticated = await request("/api/candidate/documents/status", null);
record("unauthenticated status denied", unauthenticated.status === 401,
  `expected 401, received ${unauthenticated.status}`);

const [a, b] = await Promise.all([
  request("/api/candidate/documents/status", tokenA),
  request("/api/candidate/documents/status", tokenB)
]);
record("candidate A status succeeds", a.status === 200 && a.data?.ok === true,
  `received HTTP ${a.status}`);
record("candidate B status succeeds", b.status === 200 && b.data?.ok === true,
  `received HTTP ${b.status}`);

if (a.status === 200 && b.status === 200 && a.data?.ok && b.data?.ok) {
  record("candidate identities differ", a.data.candidateId && b.data.candidateId && a.data.candidateId !== b.data.candidateId,
    "status responses resolve two distinct candidate records");
  const aIds = new Set((a.data.documents || []).map((d) => d.id));
  const bIds = new Set((b.data.documents || []).map((d) => d.id));
  const overlap = [...aIds].filter((id) => bIds.has(id));
  record("document lists are isolated", overlap.length === 0,
    `overlapping document IDs: ${overlap.length}`);
}

const crossRead = await request("/api/candidate/documents/read-url", tokenB, { documentId: documentIdA });
record("candidate B cannot read candidate A document", crossRead.status === 404 &&
  crossRead.data?.code === "DOCUMENT_NOT_FOUND",
  `expected 404 DOCUMENT_NOT_FOUND, received HTTP ${crossRead.status} (${crossRead.data?.code || "no code"})`);

const quarantinedRead = await request("/api/candidate/documents/read-url", tokenA, { documentId: quarantinedDocumentIdA });
record("owner cannot download quarantined document", quarantinedRead.status === 423 &&
  quarantinedRead.data?.code === "DOCUMENT_QUARANTINED" && quarantinedRead.data?.downloadable === false,
  `expected 423 DOCUMENT_QUARANTINED, received HTTP ${quarantinedRead.status} (${quarantinedRead.data?.code || "no code"})`);

const ownerRead = await request("/api/candidate/documents/read-url", tokenA, { documentId: documentIdA });
record("candidate A can read own active document", ownerRead.status === 200 &&
  ownerRead.data?.ok === true && typeof ownerRead.data?.signedReadUrl === "string" &&
  ownerRead.data?.expiresInSeconds === 600,
  `expected 200 with 600-second signed link, received HTTP ${ownerRead.status}`);

const failed = results.filter((r) => !r.passed);
console.log(JSON.stringify({
  schema: "kingsmen.n05.document-isolation-test.v1",
  status: failed.length ? "FAILED" : "PASSED",
  productionReady: false,
  checks: results.length,
  failed: failed.length,
  results,
  note: "Requires two dedicated staging candidates, one clean active document and one quarantined document belonging to candidate A. Does not bypass authentication or modify document data; the quarantine check must not issue a signed URL."
}, null, 2));
if (failed.length) process.exitCode = 1;
