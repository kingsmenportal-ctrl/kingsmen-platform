import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const snapshotPath = "manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json";
const reportPath = "reports/rebuild/kingsmen-staging-migration-provenance-latest.json";
const docPath = "docs/rebuild/KINGSMEN_MIGRATION_PROVENANCE_AUDIT_2026-11-25.md";
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const report = JSON.parse(readFileSync(reportPath, "utf8"));
const doc = readFileSync(docPath, "utf8");
const currentSummary = snapshot.summary;
const historical = currentSummary.historicalBranchSweep;

assert.equal(snapshot.schema, "kingsmen.staging-migration-provenance-snapshot.v1");
assert.equal(report.schema, "kingsmen.migration-provenance-audit.v1");
assert.equal(snapshot.capturedOn, "2026-11-25");
assert.equal(snapshot.database.projectRef, "euhubhhnumtibbyufghm");
assert.equal(snapshot.safety.schemaChanged, false);
assert.equal(snapshot.safety.dataChanged, false);
assert.equal(snapshot.safety.migrationsApplied, false);
assert.equal(snapshot.safety.releaseGateOpened, false);
assert.equal(report.safety.migrationsApplied, false);
assert.equal(currentSummary.liveLedgerRecords, snapshot.ledgerRecords.length);
assert.equal(currentSummary.trackedSourceFiles, snapshot.sourceFiles.length);
assert.equal(currentSummary.normalizedExactMatches, snapshot.ledgerRecords.filter((x) => x.matchType === "NORMALIZED_EXACT").length);
assert.equal(currentSummary.coreOnlyCandidateMatches, snapshot.ledgerRecords.filter((x) => x.matchType === "CORE_ONLY_REVIEW_REQUIRED").length);
assert.equal(currentSummary.liveLedgerRecordsWithoutNameMatch, snapshot.ledgerRecords.filter((x) => x.matchType === "UNMAPPED_TO_TRACKED_SOURCE").length);
assert.equal(currentSummary.sourceFilesWithoutLedgerMatch, snapshot.sourceFiles.filter((x) => x.matchType === "SOURCE_WITH_NO_LEDGER_MATCH").length);
assert.equal(currentSummary.duplicateLedgerNames, snapshot.duplicateLedgerNames.length);

assert.equal(historical.branchesScanned, snapshot.historicalBranchTrees.length);
assert.equal(historical.rawBranchSourceEntries, snapshot.historicalBranchTrees.reduce((n, x) => n + x.migrationFiles, 0));
assert.equal(historical.uniqueSourcePathHashEntries, snapshot.historicalSourceFiles.length);
assert.equal(historical.uniqueSourcePaths, new Set(snapshot.historicalSourceFiles.map((x) => x.path)).size);
assert.equal(historical.ledgerRecordsWithCoreAndSequenceCandidate, snapshot.ledgerRecords.filter((x) => x.historicalMatchType === "CORE_AND_SEQUENCE_MATCH").length);
assert.equal(historical.ledgerRecordsWithCoreOnlyCandidates, snapshot.ledgerRecords.filter((x) => x.historicalMatchType === "CORE_MATCH_SEQUENCE_DIFFERENT_OR_ABSENT").length);
assert.equal(historical.ledgerRecordsWithoutHistoricalSourceNameCandidate, snapshot.ledgerRecords.filter((x) => x.historicalMatchType === "NO_HISTORICAL_SOURCE_NAME_CANDIDATE").length);
assert.equal(historical.candidateSourceRecords, snapshot.ledgerRecords.filter((x) => (x.historicalSourceCandidates || []).length > 0).length);
assert.equal(historical.ledgerWithoutAnyHistoricalSourceNameCandidate, historical.ledgerRecordsWithoutHistoricalSourceNameCandidate);
assert.equal(historical.liveLedgerRecords, undefined);
assert.equal(historical.replayAuthorized, false);
assert.equal(historical.exactSqlBodyProvenanceMatches, 0);
assert.equal(snapshot.historicalBranchTrees.length, 8);
assert.equal(snapshot.historicalDuplicateLedgerNames.length, 2);
assert.equal(historical.duplicateLedgerNames, snapshot.historicalDuplicateLedgerNames.length);
assert.equal(report.historicalBranchSweep.ledgerRecordsWithoutHistoricalSourceNameCandidate, 63);
assert.equal(report.historicalBranchSweep.candidateSourceRecords, 67);
assert.equal(report.summary.liveLedgerRecords, currentSummary.liveLedgerRecords);
assert.equal(report.summary.trackedSourceFiles, currentSummary.trackedSourceFiles);
assert.equal(report.summary.liveLedgerRecordsWithoutNameMatch, currentSummary.liveLedgerRecordsWithoutNameMatch);
assert.equal(report.summary.sourceFilesWithoutLedgerMatch, currentSummary.sourceFilesWithoutLedgerMatch);
assert.equal(report.status, "RECONCILIATION_REQUIRED");
assert.ok(snapshot.ledgerRecords.length > snapshot.sourceFiles.length);

for (const source of snapshot.sourceFiles) {
  assert.ok(existsSync(source.path), "Current rebuild migration source missing: " + source.path);
  const bytes = readFileSync(source.path);
  const gitBlobSha = createHash("sha1").update("blob " + bytes.length + "\0").update(bytes).digest("hex");
  assert.equal(gitBlobSha, source.gitBlobSha, "Current migration changed since snapshot; recapture/review: " + source.path);
}

for (const source of snapshot.historicalSourceFiles) {
  assert.ok(source.branches.length > 0, "Historical source must name at least one branch.");
  assert.match(source.gitBlobSha, /^[0-9a-f]{40}$/, "Historical source must include a Git blob SHA.");
}
for (const ledger of snapshot.ledgerRecords) {
  assert.ok(ledger.historicalMatchType, "Historical match classification missing for " + ledger.version);
  if (ledger.historicalMatchType === "NO_HISTORICAL_SOURCE_NAME_CANDIDATE") {
    assert.equal((ledger.historicalSourceCandidates || []).length, 0);
  } else {
    assert.ok((ledger.historicalSourceCandidates || []).length > 0);
  }
}
assert.match(doc, /DO NOT REPLAY MIGRATIONS FROM THIS REPORT/);
assert.match(doc, /eight relevant current\/historical feature\/release branches/);
assert.match(doc, /63 have no source-name candidate/);
assert.match(doc, /numeric migration identifiers/);
assert.match(doc, /do not apply or copy these files/i);

console.log("Kingsmen migration-provenance audit contract passed: current source hashes unchanged; historical branch evidence recorded; no DDL or data changes made.");
