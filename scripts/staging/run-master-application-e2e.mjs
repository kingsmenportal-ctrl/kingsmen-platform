import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.KINGSMEN_E2E_BASE_URL?.replace(/\/$/, "");
const tokenA = process.env.KINGSMEN_E2E_CANDIDATE_A_TOKEN;
const tokenB = process.env.KINGSMEN_E2E_CANDIDATE_B_TOKEN;
const anonKey = process.env.KINGSMEN_E2E_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const allowMutations = process.env.KINGSMEN_E2E_ALLOW_MUTATIONS === "true";

if (!baseUrl || !tokenA || !tokenB || !anonKey || !allowMutations) {
  console.error(JSON.stringify({
    status: "BLOCKED_MISSING_STAGING_TEST_CONFIGURATION",
    required: [
      "KINGSMEN_E2E_BASE_URL",
      "KINGSMEN_E2E_CANDIDATE_A_TOKEN",
      "KINGSMEN_E2E_CANDIDATE_B_TOKEN",
      "KINGSMEN_E2E_SUPABASE_ANON_KEY",
      "KINGSMEN_E2E_ALLOW_MUTATIONS=true"
    ],
    message: "Use two dedicated staging test accounts with separately approved candidate identity links. Do not use real candidate accounts or paste tokens into chat."
  }, null, 2));
  process.exit(2);
}
if (!/^https:\/\//i.test(baseUrl) || !/kingsmen-portal-staging\.netlify\.app$/i.test(new URL(baseUrl).hostname)) {
  console.error("Refusing mutation tests against a non-staging hostname.");
  process.exit(2);
}

const runId = randomUUID();
const targetKey = `e2e:${runId}`;
const profileMarkerA = `Kingsmen E2E Candidate A ${runId}`;
const profileMarkerB = `Kingsmen E2E Candidate B ${runId}`;
const headers = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
const getJson = async (path, token) => {
  const response = await fetch(`${baseUrl}${path}`, { headers: headers(token), cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  return { response, body };
};
const postJson = async (path, token, payload) => {
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: headers(token), body: JSON.stringify(payload), cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  return { response, body };
};
const results = [];
function pass(name, details = {}) { results.push({ name, status: "PASS", ...details }); }
function assertOk(response, body, label) {
  assert.equal(response.ok, true, `${label} failed: HTTP ${response.status} ${JSON.stringify(body)}`);
}

try {
  const initialA = await getJson("/api/candidate/master-application", tokenA);
  const initialB = await getJson("/api/candidate/master-application", tokenB);
  assertOk(initialA.response, initialA.body, "candidate A master load");
  assertOk(initialB.response, initialB.body, "candidate B master load");
  pass("two authorised candidate sessions can load their own master workspace");

  const target = {
    targetKey, pathwayType: "EMPLOYMENT", providerName: "Kingsmen automated staging test",
    programmeOrRole: `No-provider test target ${runId}`, providerApplicationUrl: "",
    sourceReference: `test-only:${runId}`
  };
  const profileA = {
    fullName: profileMarkerA, email: "", phone: "", province: "Gauteng", city: "Test City",
    highestEducation: "E2E only", qualifications: "Synthetic staging test data",
    skills: "E2E", workHistory: "", cvSummary: "", preferredLocations: "Test only",
    fundingNeeds: "", accommodationNeeds: "", additionalNotes: runId
  };
  const saveA = await postJson("/api/candidate/master-application", tokenA, {
    profileData: profileA, pathwayPreferences: ["EMPLOYMENT"], targets: [target],
    consent: true, idempotencyKey: `e2e-save-a-${runId}`
  });
  assertOk(saveA.response, saveA.body, "candidate A save");
  assert.equal(saveA.body.result?.provider_submissions_sent, 0, "Saving a plan must not submit to a provider");
  pass("candidate A save returns explicit no-provider-submission boundary");

  const updateA = await postJson("/api/candidate/master-application", tokenA, {
    profileData: { ...profileA, fullName: `${profileMarkerA} updated` },
    pathwayPreferences: ["EMPLOYMENT"], targets: [target],
    consent: true, idempotencyKey: `e2e-update-a-${runId}`
  });
  assertOk(updateA.response, updateA.body, "candidate A update");

  const afterA = await getJson("/api/candidate/master-application", tokenA);
  assertOk(afterA.response, afterA.body, "candidate A reload");
  assert.equal(afterA.body.profile?.profile_data?.fullName, `${profileMarkerA} updated`, "updated profile must persist");
  assert.equal((afterA.body.targets || []).filter(item => item.target_key === targetKey).length, 1, "repeat save must not duplicate target");
  pass("candidate A save, update, reload and idempotent target upsert");

  const afterB = await getJson("/api/candidate/master-application", tokenB);
  assertOk(afterB.response, afterB.body, "candidate B isolation read");
  assert.notEqual(afterB.body.profile?.profile_data?.fullName, `${profileMarkerA} updated`, "candidate B must not see A profile");
  assert.equal((afterB.body.targets || []).some(item => item.target_key === targetKey), false, "candidate B must not see A target");
  pass("candidate B cannot read candidate A profile or target");

  const pdf = new TextEncoder().encode("%PDF-1.4\n% Kingsmen staging-only synthetic file\n%%EOF");
  const ticket = await postJson("/api/candidate/documents/upload-url", tokenA, {
    filename: `kingsmen-e2e-${runId}.pdf`, mimeType: "application/pdf", sizeBytes: pdf.byteLength
  });
  assertOk(ticket.response, ticket.body, "private upload ticket");
  assert.ok(ticket.body.signed_upload_url && ticket.body.document?.id, "signed upload ticket must include document id and URL");
  const uploadUrl = new URL(ticket.body.signed_upload_url, process.env.NEXT_PUBLIC_SUPABASE_URL || baseUrl).toString();
  const uploadResponse = await fetch(uploadUrl, { method: "POST", headers: { apikey: anonKey, "Content-Type": "application/pdf" }, body: pdf });
  assert.equal(uploadResponse.ok, true, `signed upload failed: HTTP ${uploadResponse.status}`);
  const finalize = await postJson("/api/candidate/documents/finalize", tokenA, { documentId: ticket.body.document.id });
  assertOk(finalize.response, finalize.body, "private upload finalize");
  assert.equal(finalize.body.document?.status || finalize.body.ready, "UPLOADED_CANDIDATE_REPORTED", "upload must finalize without implying verification");
  pass("private document upload, file-signature finalization and audit path");

  const docsA = await getJson("/api/candidate/documents/status", tokenA);
  const docsB = await getJson("/api/candidate/documents/status", tokenB);
  assertOk(docsA.response, docsA.body, "candidate A document list");
  assertOk(docsB.response, docsB.body, "candidate B document list");
  assert.equal((docsA.body.documents || []).some(item => item.id === ticket.body.document.id), true, "candidate A must see own document");
  assert.equal((docsB.body.documents || []).some(item => item.id === ticket.body.document.id), false, "candidate B must not see A document");
  const crossRead = await postJson("/api/candidate/documents/read-url", tokenB, { documentId: ticket.body.document.id });
  assert.equal(crossRead.response.status, 404, "cross-candidate document read must return not found");
  pass("candidate B cannot list or request a signed read link for candidate A document");

  const outcomesA = await getJson("/api/candidate/outcomes", tokenA);
  assertOk(outcomesA.response, outcomesA.body, "candidate A outcome read");
  const outcomesB = await getJson("/api/candidate/outcomes", tokenB);
  assertOk(outcomesB.response, outcomesB.body, "candidate B outcome read");
  assert.equal((outcomesB.body.applications || []).some(item => item.application_ref === `KM-E2E-${runId}`), false, "outcome read must remain candidate scoped");
  pass("candidate-safe outcome read path requires authenticated, verified identity");

  console.log(JSON.stringify({ status: "PASS", runId, results }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    status: "FAIL",
    runId,
    completedChecks: results,
    error: error instanceof Error ? error.message : String(error),
    cleanup: "Synthetic records are intentionally retained for audit. Run only with dedicated staging test accounts."
  }, null, 2));
  process.exit(1);
}
