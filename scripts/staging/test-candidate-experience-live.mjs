import assert from "node:assert/strict";

const enabled = process.env.KINGSMEN_CANDIDATE_E2E === "1";
if (!enabled) {
  console.log("SKIP candidate experience live E2E: set KINGSMEN_CANDIDATE_E2E=1 to opt in.");
  process.exit(0);
}

const baseRaw = process.env.KINGSMEN_STAGING_BASE_URL ?? "";
const token = process.env.KINGSMEN_STAGING_CANDIDATE_ACCESS_TOKEN ?? "";
const expectedReference = process.env.KINGSMEN_STAGING_EXPECTED_CANDIDATE_REFERENCE ?? "";
const mode = process.env.KINGSMEN_CANDIDATE_E2E_MODE ?? "roundtrip";
const supabaseRaw = process.env.KINGSMEN_STAGING_SUPABASE_URL ?? "";
const anonKey = process.env.KINGSMEN_STAGING_ANON_KEY ?? "";

function fail(message) {
  throw new Error(message);
}
function required(value, name) {
  if (!value) fail(\`Required environment variable is missing: \${name}\`);
  return value;
}
function stagingUrl(raw, variableName) {
  let parsed;
  try {
    parsed = new URL(required(raw, variableName));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Required environment")) throw error;
    fail(\`\${variableName} must be a valid URL.\`);
  }
  const allowed = parsed.protocol === "https:" && (
    parsed.hostname === "kingsmen-portal-staging.netlify.app" ||
    /^[a-z0-9-]+--kingsmen-portal-staging\.netlify\.app$/i.test(parsed.hostname)
  );
  if (!allowed || parsed.username || parsed.password || parsed.search || parsed.hash) {
    fail(\`\${variableName} must point to the Kingsmen staging Netlify site or its deploy preview using HTTPS.\`);
  }
  return parsed.toString().replace(/\/+$/, "");
}
const baseUrl = stagingUrl(baseRaw, "KINGSMEN_STAGING_BASE_URL");
required(token, "KINGSMEN_STAGING_CANDIDATE_ACCESS_TOKEN");
if (mode !== "roundtrip" && mode !== "bootstrap") fail("KINGSMEN_CANDIDATE_E2E_MODE must be roundtrip or bootstrap.");
if (mode === "roundtrip" && (!expectedReference || expectedReference === "NEW")) {
  fail("Roundtrip mode requires the exact existing Kingsmen candidate reference; it must not be NEW.");
}
if (mode === "bootstrap" && expectedReference !== "NEW") {
  fail("Bootstrap mode requires KINGSMEN_STAGING_EXPECTED_CANDIDATE_REFERENCE=NEW to make the one-time create explicit.");
}

const bearerHeaders = { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json", Accept: "application/json" };
const supabaseUrl = mode === "roundtrip" ? stagingUrl(supabaseRaw, "KINGSMEN_STAGING_SUPABASE_URL") : null;
if (mode === "roundtrip") required(anonKey, "KINGSMEN_STAGING_ANON_KEY");

async function requestJson(url, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000)
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { fail(\`Expected JSON from \${new URL(url).pathname}; received HTTP \${response.status} non-JSON.\`); }
  return { response, data };
}

async function expectStatus(label, url, expected, options) {
  const result = await requestJson(url, options);
  assert.equal(result.response.status, expected, \`\${label}: expected HTTP \${expected}, received \${result.response.status}\`);
  console.log(\`PASS \${label} (HTTP \${expected})\`);
  return result.data;
}
async function expectOk(label, url, options) {
  const result = await requestJson(url, options);
  assert.ok(result.response.ok, \`\${label}: HTTP \${result.response.status}; code=\${result.data.code ?? result.data.status ?? "unknown"}\`);
  console.log(\`PASS \${label} (HTTP \${result.response.status})\`);
  return result.data;
}
async function profileAction(action, values = {}) {
  return expectOk(\`profile \${action}\`, \`\${baseUrl}/api/candidate/profile\`, {
    method: "POST", headers: bearerHeaders, body: { action, ...values }
  });
}

for (const [label, url, method, body] of [
  ["unauthenticated profile request is denied", \`\${baseUrl}/api/candidate/profile\`, "POST", { action: "load" }],
  ["unauthenticated application tracker request is denied", \`\${baseUrl}/api/candidate/applications\`, "GET", undefined],
  ["unauthenticated document status request is denied", \`\${baseUrl}/api/candidate/documents/status\`, "GET", undefined],
  ["unauthenticated identity-review request is denied", \`\${baseUrl}/api/candidate/identity-review\`, "GET", undefined]
]) {
  await expectStatus(label, url, 401, {
    method, headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body } : {})
  });
}

const initial = await profileAction("load");
assert.equal(initial.ok, true, "Profile load must return ok=true.");
assert.ok(initial.completeness && Number.isInteger(initial.completeness.percent), "Profile must return a completeness value.");
assert.ok(["ACTIVE", "REVOKED", "NOT_RECORDED"].includes(initial.consent?.status), "Profile must return explicit consent state.");

if (mode === "bootstrap") {
  assert.equal(initial.persistence, "NOT_PROVISIONED", "Bootstrap account must not already own a provisioned profile.");
  assert.equal(initial.identityStatus, "NOT_PROVISIONED", "Bootstrap test account must not resolve to an existing candidate.");
  assert.equal(initial.candidateReference ?? null, null, "Bootstrap account must not already have a candidate reference.");
  const displayName = required(process.env.KINGSMEN_STAGING_TEST_DISPLAY_NAME, "KINGSMEN_STAGING_TEST_DISPLAY_NAME").trim();
  if (displayName.length < 2 || displayName.length > 120) fail("Test display name must be 2–120 characters and contain no sensitive information.");
  const testProfile = {
    displayName,
    phone: "",
    province: "Gauteng",
    highestQualification: "Other / prefer to explain",
    studyInterests: "Kingsmen profile bootstrap E2E test",
    employmentInterests: "Kingsmen profile bootstrap E2E test",
    preferredLocation: "Gauteng"
  };
  const created = await profileAction("save", {
    profile: testProfile,
    pathwayPreferences: ["higher_education"],
    consentAccepted: true
  });
  assert.equal(created.persistence, "SUPABASE_BACKEND", "Created profile must confirm backend persistence.");
  assert.ok(typeof created.candidateReference === "string" && created.candidateReference.length > 0, "Create must return the new candidate reference.");
  assert.equal(created.identityStatus, "PENDING_REVIEW", "Bootstrap creates a pending identity link; it must not silently verify identity.");
  const loaded = await profileAction("load");
  assert.equal(loaded.candidateReference, created.candidateReference, "Reload must return the same new candidate reference.");
  assert.equal(loaded.profile?.displayName, displayName, "Reload must return the created name.");
  assert.equal(loaded.profile?.employmentInterests, testProfile.employmentInterests, "Reload must return the created profile data.");
  assert.equal(loaded.consent?.status, "ACTIVE", "Reload must return the recorded consent state.");
  console.log("PASS profile bootstrap, create, consent, save and backend reload. This test creates a persistent staging candidate and does not delete its audit trail.");
  process.exit(0);
}

assert.equal(initial.persistence, "SUPABASE_BACKEND", "Roundtrip mode requires backend-persisted profile.");
assert.equal(initial.candidateReference, expectedReference, "Loaded candidate reference does not match the explicitly approved staging test candidate.");
assert.equal(initial.identityStatus, "VERIFIED", "Profile write test requires a verified identity; no writes were attempted.");
assert.equal(initial.consent.status, "ACTIVE", "Profile write test requires already-active consent; no consent was granted automatically.");
const originalProfile = structuredClone(initial.profile ?? {});
const originalPathways = structuredClone(initial.pathwayPreferences ?? []);
const fieldLimits = { employmentInterests: 600, studyInterests: 600, preferredLocation: 120 };
const marker = \` [Kingsmen E2E \${new Date().toISOString()}]\`;
const testField = Object.entries(fieldLimits).find(([field, limit]) => String(originalProfile[field] ?? "").length + marker.length <= limit)?.[0];
if (!testField) fail("No safe spare room was available in employmentInterests, studyInterests or preferredLocation; no profile write was attempted.");
const modifiedProfile = { ...originalProfile, [testField]: \`\${originalProfile[testField] ?? ""}\${marker}\` };
let restoreNeeded = false;
let primaryFailure = null;
try {
  restoreNeeded = true;
  const saved = await profileAction("save", {
    profile: modifiedProfile, pathwayPreferences: originalPathways, consentAccepted: true
  });
  assert.equal(saved.persistence, "SUPABASE_BACKEND", "Save must explicitly confirm backend persistence.");
  assert.ok(String(saved.profile?.[testField] ?? "").includes(marker), "Save response must reflect the QA marker.");
  const reloaded = await profileAction("load");
  assert.ok(String(reloaded.profile?.[testField] ?? "").includes(marker), "A separate read must retrieve the changed value from the backend.");
  assert.equal(reloaded.candidateReference, expectedReference, "Profile write must not change the candidate link.");
  console.log("PASS profile update, server save and separate backend reload.");
} catch (error) {
  primaryFailure = error;
} finally {
  if (restoreNeeded) {
    try {
      await profileAction("save", { profile: originalProfile, pathwayPreferences: originalPathways, consentAccepted: true });
      const restored = await profileAction("load");
      assert.equal(restored.candidateReference, expectedReference, "Restoration must remain on the same candidate.");
      assert.equal(String(restored.profile?.[testField] ?? ""), String(originalProfile[testField] ?? ""), "Original field value was not restored.");
      assert.deepEqual(restored.pathwayPreferences ?? [], originalPathways, "Original pathway preferences were not restored.");
      console.log("PASS restoration of original profile value, followed by a separate backend read.");
    } catch (restoreError) {
      fail(\`CRITICAL: candidate profile restoration could not be verified. Stop using this test account and restore its original profile before further testing. \${restoreError instanceof Error ? restoreError.message : "Unknown restoration error"}\`);
    }
  }
}
if (primaryFailure) throw primaryFailure;

const app = await expectOk("authenticated application workbench read", \`\${baseUrl}/api/candidate/applications\`, {
  headers: { Authorization: \`Bearer \${token}\`, Accept: "application/json" }
});
for (const key of ["trackers", "items", "masterTargets"]) {
  assert.ok(Array.isArray(app[key]), \`Application workbench should return \${key} as an array.\`);
}
for (const event of app.applicationEvents ?? []) {
  if (event.event_type === "PROVIDER_RECEIPT_CONFIRMED" || event.event_type === "PROVIDER_OUTCOME_CONFIRMED") {
    assert.ok(event.evidence_ref, "Provider-confirmed application states must retain an evidence reference.");
  }
}
console.log("PASS application workbench read includes tracker, item and parent-target collections.");

await expectOk("authenticated private document status read", \`\${baseUrl}/api/candidate/documents/status\`, {
  headers: { Authorization: \`Bearer \${token}\`, Accept: "application/json" }
});
await expectOk("authenticated identity-review status read", \`\${baseUrl}/api/candidate/identity-review\`, {
  headers: { Authorization: \`Bearer \${token}\`, Accept: "application/json" }
});

const feedResult = await requestJson(\`\${supabaseUrl}/functions/v1/n15-candidate-opportunities\`, {
  headers: { Authorization: \`Bearer \${token}\`, apikey: anonKey, Accept: "application/json" }
});
assert.equal(feedResult.response.status, 200, \`N15 opportunity feed must return HTTP 200 for this verified staging identity; received \${feedResult.response.status}.\`);
const feed = feedResult.data;
assert.ok(["OK", "EMPTY", "NO_MATCHES"].includes(feed.status) || Array.isArray(feed.opportunities), "N15 response must state its result, including an honest empty state.");
if (Array.isArray(feed.opportunities)) {
  if (typeof feed.count === "number") assert.equal(feed.count, feed.opportunities.length, "N15 count must match returned opportunities.");
  for (const opportunity of feed.opportunities) {
    assert.ok(typeof opportunity.official_link === "string" && opportunity.official_link.startsWith("https://"), "Each published listing needs an HTTPS official link.");
    assert.ok(Array.isArray(opportunity.source_evidence) && opportunity.source_evidence.length > 0, "Each published listing needs source evidence.");
    assert.ok(typeof opportunity.source_checked_at === "string" && Number.isFinite(Date.parse(opportunity.source_checked_at)), "Each published listing needs a valid source-check timestamp.");
  }
}
console.log(\`PASS N15 feed API and publication-safety checks (\${Array.isArray(feed.opportunities) ? feed.opportunities.length : 0} listings; an empty verified feed is allowed).\`);
console.log("Candidate experience live E2E checks completed. These checks do not prove provider submission, reviewer decisions, PayFast settlement, or the deployed commit SHA.");
