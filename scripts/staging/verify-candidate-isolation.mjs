#!/usr/bin/env node
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.CANDIDATE_STAGING_BASE_URL;
const tokenA = process.env.CANDIDATE_STAGING_USER_A_TOKEN;
const tokenB = process.env.CANDIDATE_STAGING_USER_B_TOKEN;
const expectedProject = process.env.CANDIDATE_STAGING_PROJECT_REF || "euhubhhnumtibbyufghm";
const projectRefFromUrl = (value) => { try { return new URL(value).hostname.split(".")[0]; } catch { return ""; } };

if (!baseUrl || !tokenA || !tokenB) { console.error("Missing required staging environment variables."); process.exit(2); }
if (tokenA === tokenB) { console.error("User A and User B must use distinct access tokens."); process.exit(2); }
const base = new URL(baseUrl);
if (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1") { console.error("Refusing non-HTTPS staging URL except localhost."); process.exit(2); }
if (projectRefFromUrl(base.href) !== expectedProject) { console.error("Staging project ref mismatch; refusing unexpected project."); process.exit(2); }
if (process.env.PAYMENTS_LIVE === "true") { console.error("Refusing to run while PAYMENTS_LIVE=true."); process.exit(2); }

const runId = "candidate-isolation-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8);
const results = [];
const endpoint = new URL("/api/personal-jobs/apply-now", base);
const sessionEndpoint = new URL("/api/auth/session", base);
async function request(url, token, init = {}) { return fetch(url, { ...init, headers: { ...(init.headers || {}), Cookie: "kingsmen-access-token=" + token, "Cache-Control": "no-store" }, cache: "no-store", signal: AbortSignal.timeout(15000) }); }
async function readWorkspace(token) { const response = await request(endpoint, token); assert.equal(response.status, 200, "workspace GET HTTP " + response.status); const data = await response.json(); assert.equal(typeof data.profile, "object"); return data; }
async function saveNotes(token, notes) { const response = await request(endpoint, token, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveProfile", profile: { notes } }) }); assert.equal(response.status, 200, "profile save HTTP " + response.status); const data = await response.json(); assert.equal(data.status, "SAVED"); return data; }
async function checkSession(token) { const response = await request(sessionEndpoint, token); assert.equal(response.status, 200, "session endpoint HTTP " + response.status); const data = await response.json(); assert.equal(data.authenticated, true); assert.equal(data.configured, true); return data; }
function record(name, passed, details = {}) { results.push({ name, passed: Boolean(passed), ...details }); }

let originalA, originalB, modifiedA = false, modifiedB = false, runError = null;
try {
  const [sessionA, sessionB] = await Promise.all([checkSession(tokenA), checkSession(tokenB)]);
  assert.ok(sessionA.user && sessionA.user.id && sessionB.user && sessionB.user.id);
  assert.notEqual(sessionA.user.id, sessionB.user.id, "A and B must be distinct Auth identities");
  record("distinct_authenticated_users", true, { userA: "A", userB: "B" });
  [originalA, originalB] = await Promise.all([readWorkspace(tokenA), readWorkspace(tokenB)]);
  const markerA = "KP_STAGING_A_" + runId, markerB = "KP_STAGING_B_" + runId;
  await saveNotes(tokenA, markerA); modifiedA = true;
  await saveNotes(tokenB, markerB); modifiedB = true;
  const [reloadedA, reloadedB] = await Promise.all([readWorkspace(tokenA), readWorkspace(tokenB)]);
  assert.equal(reloadedA.profile.notes, markerA, "A marker must persist after reload");
  assert.equal(reloadedB.profile.notes, markerB, "B marker must persist after reload");
  record("authenticated_profile_persistence_after_reload", true);
  assert.notEqual(reloadedA.profile.notes, markerB, "A must not receive B marker");
  assert.notEqual(reloadedB.profile.notes, markerA, "B must not receive A marker");
  record("bidirectional_cross_account_read_isolation", true);
  const spoof = await request(endpoint, tokenA, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveProfile", auth_user_id: sessionB.user.id, profile: { notes: "KP_SPOOF_" + runId } }) });
  assert.equal(spoof.status, 200, "identity field should be ignored by profile API");
  const [afterSpoofA, unchangedB] = await Promise.all([readWorkspace(tokenA), readWorkspace(tokenB)]);
  assert.equal(afterSpoofA.profile.notes, markerA, "spoof attempt must not change A marker");
  assert.equal(unchangedB.profile.notes, markerB, "spoof attempt must not change B data");
  record("identity_spoof_field_cannot_cross_write", true);
  const noAuth = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  assert.ok([401, 503].includes(noAuth.status), "unauthenticated request must fail closed, got HTTP " + noAuth.status);
  record("unauthenticated_workspace_denied", true, { httpStatus: noAuth.status });
} catch (error) { runError = error instanceof Error ? error.message : "Unknown test failure"; }
finally {
  try { if (modifiedA && originalA) await saveNotes(tokenA, typeof originalA.profile.notes === "string" ? originalA.profile.notes : ""); } catch { results.push({ name: "restore_user_A_notes", passed: false }); }
  try { if (modifiedB && originalB) await saveNotes(tokenB, typeof originalB.profile.notes === "string" ? originalB.profile.notes : ""); } catch { results.push({ name: "restore_user_B_notes", passed: false }); }
}
const failed = results.filter((result) => !result.passed);
const report = { schema: "kingsmen.candidate-staging-isolation.v1", runId, finishedAt: new Date().toISOString(), projectRef: expectedProject, deploymentHost: base.host, status: runError || failed.length ? "FAILED" : "PASSED", passed: !runError && failed.length === 0, reviewed: false, redacted: true, productionReady: false, publicLaunchAllowed: false, checks: results, error: runError ? "Sensitive details suppressed; inspect the named assertion and staging service logs." : undefined };
console.log(JSON.stringify(report, null, 2));
if (runError || failed.length) process.exitCode = 1;
