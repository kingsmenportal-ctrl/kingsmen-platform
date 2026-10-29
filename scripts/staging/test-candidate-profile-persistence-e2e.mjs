#!/usr/bin/env node
/**
 * Explicitly opt-in authenticated staging test for profile create/read/update/reload.
 * Requires a dedicated authorized staging test account. Never logs profile values or tokens.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.KINGSMEN_STAGING_BASE_URL;
const token = process.env.KINGSMEN_E2E_CANDIDATE_A_TOKEN;
const allow = process.env.KINGSMEN_PROFILE_E2E_ALLOW_MUTATIONS === "true";
const allowCreate = process.env.KINGSMEN_PROFILE_E2E_ALLOW_NEW_TEST_PROFILE === "true";
const marker = (process.env.KINGSMEN_PROFILE_E2E_MARKER || "KINGSMEN-PROFILE-E2E").trim().slice(0, 48);
const fail = (status, message) => {
  console.error(JSON.stringify({ schema: "kingsmen.candidate-profile-persistence-e2e.v1", status, message }));
  process.exit(2);
};
if (!base || !token) fail("BLOCKED_CONFIGURATION_MISSING", "Set KINGSMEN_STAGING_BASE_URL and KINGSMEN_E2E_CANDIDATE_A_TOKEN.");
if (!allow) fail("BLOCKED_MUTATION_NOT_AUTHORISED", "Set KINGSMEN_PROFILE_E2E_ALLOW_MUTATIONS=true only for an approved staging test account.");
let origin;
try { origin = new URL(base); } catch { fail("BLOCKED_INVALID_BASE_URL", "Staging URL is invalid."); }
if (origin.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(origin.hostname)) fail("BLOCKED_INSECURE_BASE_URL", "HTTPS is required except on localhost.");
const endpoint = new URL("/api/candidate/profile", origin);
if (endpoint.origin !== origin.origin) fail("BLOCKED_CROSS_ORIGIN", "Profile test must remain on the configured staging origin.");

async function request(payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}
function assertOk(result, step) {
  assert.equal(result.status >= 200 && result.status < 300, true, step + " returned HTTP " + result.status);
  assert.equal(result.body?.ok, true, step + " did not return ok=true");
}
const results = [];
let baseline;
let candidateExisted = false;
let baselineConsentActive = false;
let restorationRequired = false;
let primaryError = null;
try {
  const initial = await request({ action: "load" });
  assertOk(initial, "initial profile read");
  baseline = initial.body;
  candidateExisted = typeof baseline.candidateReference === "string" && baseline.candidateReference.length > 0;
  baselineConsentActive = baseline.consent?.status === "ACTIVE";
  if (!candidateExisted && !allowCreate) {
    fail("BLOCKED_NEW_PROFILE_NOT_AUTHORISED", "This Auth user has no saved candidate profile. Set KINGSMEN_PROFILE_E2E_ALLOW_NEW_TEST_PROFILE=true only for a dedicated authorized staging test account.");
  }
  if (candidateExisted && !baselineConsentActive) {
    fail("BLOCKED_CONSENT_STATE_NOT_RESTORABLE", "Existing test profile consent is not ACTIVE. Use a dedicated test account with active consent to avoid changing its original consent state.");
  }
  restorationRequired = candidateExisted;
  const unique = randomUUID().slice(0, 8);
  const firstName = `${marker} ${unique} Created`;
  const firstProfile = {
    displayName: firstName,
    phone: "",
    province: "Gauteng",
    highestQualification: "E2E test qualification",
    studyInterests: "E2E persistence test",
    employmentInterests: "E2E persistence test",
    preferredLocation: "E2E test location"
  };
  const created = await request({ action: "save", profile: firstProfile, pathwayPreferences: ["higher_education"], consentAccepted: true });
  assertOk(created, "profile create/save");
  results.push("create_save");
  const readAfterCreate = await request({ action: "load" });
  assertOk(readAfterCreate, "profile read after create");
  assert.equal(readAfterCreate.body.profile?.displayName, firstName, "saved display name must survive a new read");
  assert.ok(readAfterCreate.body.savedAt, "server save timestamp must be present after create");
  assert.equal(readAfterCreate.body.consent?.status, "ACTIVE", "consent must be active after accepted create/save");
  results.push("read_after_create");

  const updatedName = `${marker} ${unique} Updated`;
  const updatedProfile = { ...firstProfile, displayName: updatedName, studyInterests: "Updated E2E persistence test" };
  const updated = await request({ action: "save", profile: updatedProfile, pathwayPreferences: ["higher_education", "employment"], consentAccepted: true });
  assertOk(updated, "profile update/save");
  results.push("update_save");
  const reloaded = await request({ action: "load" });
  assertOk(reloaded, "profile reload");
  assert.equal(reloaded.body.profile?.displayName, updatedName, "updated display name must persist across reload");
  assert.equal(reloaded.body.profile?.studyInterests, updatedProfile.studyInterests, "updated study interests must persist across reload");
  assert.deepEqual([...reloaded.body.pathwayPreferences].sort(), ["employment", "higher_education"], "updated pathway preferences must persist across reload");
  assert.equal(reloaded.body.consent?.status, "ACTIVE", "consent state must persist across reload");
  results.push("reload_after_update");
} catch (error) {
  primaryError = error;
} finally {
  if (restorationRequired && baseline && baselineConsentActive) {
    try {
      const restored = await request({
        action: "save",
        profile: baseline.profile ?? {},
        pathwayPreferences: baseline.pathwayPreferences ?? [],
        consentAccepted: true
      });
      assertOk(restored, "restore original test profile");
      const verifiedRestore = await request({ action: "load" });
      assertOk(verifiedRestore, "verify restored test profile");
      assert.deepEqual(verifiedRestore.body.profile ?? {}, baseline.profile ?? {}, "original profile must be restored");
      assert.deepEqual(verifiedRestore.body.pathwayPreferences ?? [], baseline.pathwayPreferences ?? [], "original pathway preferences must be restored");
      results.push("restore_original_profile");
    } catch (restoreError) {
      console.error(JSON.stringify({ schema: "kingsmen.candidate-profile-persistence-e2e.v1", status: "RESTORE_FAILED", message: "Profile test could not restore the original authorized test account. Check the dedicated staging test account before reusing it." }));
      process.exitCode = 1;
      throw restoreError;
    }
  }
}
if (primaryError) {
  console.error(JSON.stringify({ schema: "kingsmen.candidate-profile-persistence-e2e.v1", status: "FAILED", passed: false, completedSteps: results, error: primaryError instanceof Error ? primaryError.message : "Unknown test error" }));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    schema: "kingsmen.candidate-profile-persistence-e2e.v1",
    status: "PASSED",
    passed: true,
    steps: results,
    existingTestProfileRestored: restorationRequired,
    newTestProfileCreated: !candidateExisted,
    profileValuesAndTokensLogged: false,
    note: "Run only with an authorized dedicated staging test account and explicit mutation flags."
  }, null, 2));
}
