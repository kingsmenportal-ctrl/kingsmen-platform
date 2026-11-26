import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const evidence = JSON.parse(readFileSync("manifests/rebuild/kingsmen-staging-migration-body-provenance-2026-11-25.json", "utf8"));
const preflight = readFileSync("scripts/staging/kingsmen-candidate-draft-runtime-preflight.sql", "utf8");
const compatibility = readFileSync("docs/rebuild/CANDIDATE_DRAFT_SCHEMA_COMPATIBILITY_GATE.md", "utf8");
const roadmap = readFileSync("docs/rebuild/KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md", "utf8");

assert.equal(evidence.database.projectRef, "euhubhhnumtibbyufghm");
assert.equal(evidence.database.projectName, "kingsmen-portal-staging");
assert.equal(evidence.summary.ledgerRecords, 130);
assert.equal(evidence.summary.exactBodyMatchLedgerRecords, 30);
assert.equal(evidence.summary.noExactBodyMatchLedgerRecords, 100);
assert.equal(evidence.safety.replayAuthorized, false);
assert.equal(evidence.safety.migrationsApplied, false);

for (const objectName of [
  "candidate_application_draft_answers",
  "get_candidate_application_draft",
  "save_candidate_application_draft",
  "current_verified_kingsmen_candidate_id",
  "APPLICATION_DRAFT_SAVED"
]) {
  assert.ok(preflight.includes(objectName), "Runtime preflight must continue checking " + objectName);
  assert.ok(compatibility.includes(objectName), "Compatibility gate must document " + objectName);
}
assert.match(compatibility, /BLOCKED_RUNTIME_PREREQUISITES_MISSING/);
assert.match(compatibility, /No migration is authorized/);
assert.match(compatibility, /Restore a recent staging backup/);
assert.match(compatibility, /recorded change-control approval/i);
assert.match(compatibility, /26 November 2026/);
assert.match(roadmap, /Do not apply migrations 0107–0110/);
assert.doesNotMatch(preflight.replace(/^\s*--.*$/gm, ""), /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CALL|DO)\b/i,
  "Runtime preflight must remain read-only.");

console.log("Candidate draft schema compatibility gate: PASS (diagnostic only; no migrations authorized).");
