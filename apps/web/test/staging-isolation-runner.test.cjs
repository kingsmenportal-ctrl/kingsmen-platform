const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const runnerPath = path.resolve(__dirname, "../../../scripts/staging/verify-candidate-isolation.mjs");
const runner = fs.readFileSync(runnerPath, "utf8");

test("staging runner requires two distinct candidate tokens and an explicit staging target", () => {
  assert.match(runner, /CANDIDATE_STAGING_USER_A_TOKEN/);
  assert.match(runner, /CANDIDATE_STAGING_USER_B_TOKEN/);
  assert.match(runner, /tokenA === tokenB/);
  assert.match(runner, /expectedProject !== "euhubhhnumtibbyufghm"/);
  assert.match(runner, /PAYMENTS_LIVE === "true"/);
});

test("staging runner tests persistence and bidirectional account isolation", () => {
  assert.match(runner, /authenticated_profile_persistence_after_reload/);
  assert.match(runner, /bidirectional_cross_account_read_isolation/);
  assert.match(runner, /identity_spoof_field_cannot_cross_write/);
  assert.match(runner, /unauthenticated_workspace_denied/);
});

test("staging runner verifies private document bytes and cross-account denial", () => {
  assert.match(runner, /uploadSyntheticDocument/);
  assert.match(runner, /private_document_upload_and_byte_integrity/);
  assert.match(runner, /bidirectional_private_document_isolation/);
  assert.match(runner, /deepEqual\(Buffer\.from\(await ownDownloadA\.arrayBuffer\(\)\), documentA\.bytes/);
  assert.match(runner, /deleteSyntheticDocument/);
  assert.match(runner, /bidirectional_private_document_isolation/);
  assert.match(runner, /private_document_upload_and_byte_integrity/);
  assert.match(runner, /cleanup_user_A_synthetic_document/);
  assert.match(runner, /cleanup_user_B_synthetic_document/);
  assert.match(runner, /assert\.equal\(crossAB\.status, 404/);
  assert.match(runner, /assert\.equal\(crossBA\.status, 404/);
  assert.doesNotMatch(runner, /\[404, 503\]\.includes\(cross/);
  assert.match(runner, /record\("restore_user_A_notes", true\)/);
  assert.match(runner, /name: "staging_assertions_completed", passed: false/);
  assert.match(runner, /if \(documentA\) \{ try \{ await deleteSyntheticDocument/);
  assert.match(runner, /if \(documentB\) \{ try \{ await deleteSyntheticDocument/);
});

test("staging evidence never implies production readiness automatically", () => {
  assert.match(runner, /reviewed: false/);
  assert.match(runner, /productionReady: false/);
  assert.match(runner, /publicLaunchAllowed: false/);
});
