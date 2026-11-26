import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const runbook = readFileSync(
  resolve(root, "docs/rebuild/CANDIDATE_DRAFT_RESTORE_AND_RUNTIME_SECURITY_REHEARSAL.md"),
  "utf8"
);

for (const required of [
  "State:** prepared, not executed",
  "isolated disposable restore environment only",
  "Live staging writes:** prohibited",
  "Migration replay:** unauthorized",
  "Run the read-only schema inventory and compare",
  "exact tracked SQL body hash",
  "Create draft",
  "Save and retry",
  "Reload persisted answers",
  "Resume in a new session",
  "Required fields and invalid input",
  "Submission readiness",
  "Status and immutable event history",
  "Cross-candidate read isolation",
  "Cross-candidate write isolation",
  "No-auth and expired-session behavior",
  "stagingWritesPerformed=false",
  "productionWritesPerformed=false",
  "migrationReplayAuthorized=false",
  "candidateDraftRuntimeReady=false"
]) {
  assert.ok(runbook.includes(required), `Restore/security gate missing required control: ${required}`);
}

assert.match(runbook, /RLS/);
assert.match(runbook, /service-role token as a candidate/);
assert.match(runbook, /no answer leakage/);
assert.match(runbook, /unchanged/);

console.log("CANDIDATE_DRAFT_RESTORE_SECURITY_GATE_CONTRACT_PASSED");
console.log("- Requires isolated restore; forbids live staging/production writes and migration replay.");
console.log("- Covers save/retry, reload/resume, validation, readiness, immutable events, and cross-candidate isolation.");
console.log("- Explicitly labels rehearsal prepared but not executed; no runtime pass is inferred.");
