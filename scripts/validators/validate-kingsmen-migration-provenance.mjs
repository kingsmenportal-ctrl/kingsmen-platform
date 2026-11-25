import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const snapshotPath = "manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json";
const reportPath = "reports/rebuild/kingsmen-staging-migration-provenance-latest.json";
const docPath = "docs/rebuild/KINGSMEN_MIGRATION_PROVENANCE_AUDIT_2026-11-25.md";
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const doc = readFileSync(docPath, "utf8");

assert.equal(snapshot.schema, "kingsmen.staging-migration-provenance-snapshot.v1");
assert.equal(report.schema, "kingsmen.migration-provenance-audit.v1");
assert.equal(snapshot.capturedOn, "2026-11-25");
assert.equal(snapshot.database.projectRef, "euhubhhnumtibbyufghm");
assert.equal(snapshot.safety.schemaChanged, false);
assert.equal(snapshot.safety.dataChanged, false);
assert.equal(snapshot.safety.migrationsApplied, false);
assert.equal(snapshot.safety.releaseGateOpened, false);
assert.equal(snapshot.summary.liveLedgerRecords, snapshot.ledgerRecords.length);
assert.equal(snapshot.summary.trackedSourceFiles, snapshot.sourceFiles.length);
assert.equal(snapshot.summary.normalizedExactMatches, snapshot.ledgerRecords.filter((x) => x.matchType === "NORMALIZED_EXACT").length);
assert.equal(snapshot.summary.coreOnlyCandidateMatches, snapshot.ledgerRecords.filter((x) => x.matchType === "CORE_ONLY_REVIEW_REQUIRED").length);
assert.equal(snapshot.summary.liveLedgerRecordsWithoutNameMatch, snapshot.ledgerRecords.filter((x) => x.matchType === "UNMAPPED_TO_TRACKED_SOURCE").length);
assert.equal(snapshot.summary.sourceFilesWithoutLedgerMatch, snapshot.sourceFiles.filter((x) => x.matchType === "SOURCE_WITH_NO_LEDGER_MATCH").length);
assert.equal(snapshot.summary.duplicateLedgerNames, snapshot.duplicateLedgerNames.length);
assert.equal(report.summary.liveLedgerRecords, snapshot.summary.liveLedgerRecords);
assert.equal(report.summary.trackedSourceFiles, snapshot.summary.trackedSourceFiles);
assert.equal(report.summary.liveLedgerRecordsWithoutNameMatch, snapshot.summary.liveLedgerRecordsWithoutNameMatch);
assert.equal(report.summary.sourceFilesWithoutLedgerMatch, snapshot.summary.sourceFilesWithoutLedgerMatch);
assert.equal(report.status, "RECONCILIATION_REQUIRED");
assert.equal(report.safety.migrationsApplied, false);
assert.ok(snapshot.ledgerRecords.length > snapshot.sourceFiles.length);

for (const source of snapshot.sourceFiles) {
  assert.ok(existsSync(source.path), "Migration source file missing from checkout: " + source.path);
  const bytes = readFileSync(source.path);
  const gitBlobSha = createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
  assert.equal(gitBlobSha, source.gitBlobSha, "Migration source changed since snapshot; recapture/review provenance: " + source.path);
}

for (const duplicate of snapshot.duplicateLedgerNames) {
  assert.ok(duplicate.versions.length > 1, "Duplicate ledger name must include multiple versions.");
}
assert.match(doc, /DO NOT REPLAY MIGRATIONS FROM THIS REPORT/);
assert.match(doc, /reconciliation|required/i);
assert.match(doc, /core-only/i);
assert.match(doc, /do not apply them to staging/i);

console.log("Kingsmen migration-provenance snapshot contract passed: file hashes are unchanged; applied-vs-source gaps are recorded; no migration was applied.");
