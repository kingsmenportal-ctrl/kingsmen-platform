import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const evidencePath = "manifests/rebuild/kingsmen-staging-migration-body-provenance-2026-11-25.json";
const snapshotPath = "manifests/rebuild/kingsmen-staging-migration-provenance-2026-11-25.json";
const reportPath = "reports/rebuild/kingsmen-staging-migration-provenance-latest.json";
const queryPath = "scripts/staging/kingsmen-staging-migration-body-provenance.sql";
const auditDocPath = "docs/rebuild/KINGSMEN_MIGRATION_PROVENANCE_AUDIT_2026-11-25.md";
const preflightDocPath = "docs/rebuild/CANDIDATE_DRAFT_RUNTIME_PREFLIGHT.md";
const roadmapPath = "docs/rebuild/KINGSMEN_SIMPLIFIED_STATUS_AND_COMPLETION_ROADMAP.md";
const statusManifestPath = "manifests/rebuild/kingsmen-simplified-status-v1.json";
const packagePath = "package.json";

const read = (path) => readFileSync(path, "utf8");
const evidence = JSON.parse(read(evidencePath));
const snapshot = JSON.parse(read(snapshotPath));
const report = JSON.parse(read(reportPath));
const packageJson = JSON.parse(read(packagePath));
const statusManifest = JSON.parse(read(statusManifestPath));
const query = read(queryPath);
const auditDoc = read(auditDocPath);
const preflightDoc = read(preflightDocPath);
const roadmap = read(roadmapPath);

assert.equal(evidence.schema, "kingsmen.staging-migration-body-provenance.v1");
assert.equal(evidence.capturedOn, "2026-11-25");
assert.equal(evidence.database.projectRef, "euhubhhnumtibbyufghm");
assert.equal(evidence.database.projectName, "kingsmen-portal-staging");
assert.equal(evidence.sourceSnapshot.path, snapshotPath);
assert.equal(evidence.sourceSnapshot.sourceBranch, snapshot.sourceBranch);
assert.equal(evidence.sourceSnapshot.sourceTreeSha, snapshot.sourceTreeSha);
assert.equal(evidence.sourceSnapshot.searchedBranchCount, 8);
assert.deepEqual(evidence.sourceSnapshot.searchedBranches, snapshot.historicalBranchTrees.map((item) => item.branch));

assert.equal(evidence.method.source, "supabase_migrations.schema_migrations.statements[1]");
assert.equal(evidence.method.statementCardinalityRequirement, 1);
assert.equal(evidence.method.selectOnly, true);
assert.equal(evidence.method.rawSqlBodiesIncluded, false);
assert.equal(evidence.method.sqlQueryPath, queryPath);
for (const key of ["readOnlyCapture", "schemaChanged", "dataChanged", "migrationsApplied", "grantsOrPoliciesChanged", "authChanged", "deploymentChanged", "replayAuthorized", "releaseGateOpened"]) {
  assert.equal(evidence.safety[key], key === "readOnlyCapture", "Unexpected migration audit safety state: " + key);
}

const executableSql = query.replace(/^\s*--.*$/gm, "").trim();
assert.match(executableSql, /^SELECT\b/i, "Body-provenance query must remain a single read-only SELECT.");
assert.match(executableSql, /FROM\s+supabase_migrations\.schema_migrations/i);
assert.match(executableSql, /statements\[1\]/);
assert.match(executableSql, /digest\(/i);
assert.doesNotMatch(executableSql, /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|COMMENT|CALL|DO)\b/i,
  "Body-provenance capture must not contain schema or data mutations.");

const sourceIndex = [
  ...snapshot.sourceFiles.map((source) => ({
    path: source.path,
    gitBlobSha: source.gitBlobSha,
    sourceKind: "current_rebuild_branch",
    branches: [snapshot.sourceBranch]
  })),
  ...snapshot.historicalSourceFiles.map((source) => ({
    path: source.path,
    gitBlobSha: source.gitBlobSha,
    sourceKind: "historical_branch_sweep",
    branches: source.branches || []
  }))
];

const exactSourcesBySha = new Map();
for (const source of sourceIndex) {
  const list = exactSourcesBySha.get(source.gitBlobSha) || [];
  if (!list.some((item) => item.path === source.path && item.sourceKind === source.sourceKind)) {
    list.push({ path: source.path, sourceKind: source.sourceKind, branches: source.branches });
    exactSourcesBySha.set(source.gitBlobSha, list);
  }
}

const currentSourceByPath = new Map(snapshot.sourceFiles.map((source) => [source.path, source]));
const ledgerByVersion = new Map(snapshot.ledgerRecords.map((ledger) => [ledger.version, ledger]));
assert.equal(evidence.ledgerRecords.length, snapshot.ledgerRecords.length, "Every applied ledger row must be represented exactly once.");

for (const record of evidence.ledgerRecords) {
  const original = ledgerByVersion.get(record.version);
  assert.ok(original, "Unknown staging migration version in body capture: " + record.version);
  assert.equal(record.name, original.name, "Ledger migration name changed for version " + record.version);
  assert.equal(record.statementCount, 1, "Each captured migration must have one stored SQL statement.");
  assert.ok(Number.isInteger(record.statementBytes) && record.statementBytes > 0);
  assert.match(record.appliedStatementGitBlobSha, /^[0-9a-f]{40}$/);

  const expectedFilenameCandidates = [];
  for (const sourcePath of original.sourcePaths || []) {
    const source = currentSourceByPath.get(sourcePath);
    expectedFilenameCandidates.push({
      path: sourcePath,
      gitBlobSha: source?.gitBlobSha || null,
      candidateType: "current_branch_normalized_name"
    });
  }
  for (const candidate of original.historicalSourceCandidates || []) {
    expectedFilenameCandidates.push({
      path: candidate.path,
      gitBlobSha: candidate.gitBlobSha,
      candidateType: "historical_core_sequence_name",
      branches: candidate.branches || []
    });
  }
  const distinctFilenameCandidates = [];
  for (const candidate of expectedFilenameCandidates) {
    if (!distinctFilenameCandidates.some((item) => item.path === candidate.path && item.gitBlobSha === candidate.gitBlobSha)) {
      distinctFilenameCandidates.push(candidate);
    }
  }
  assert.deepEqual(record.filenameCandidates, distinctFilenameCandidates,
    "Filename candidates must be carried forward from the original source snapshot for " + record.version);

  const expectedBodyMatches = record.appliedStatementGitBlobSha
    ? exactSourcesBySha.get(record.appliedStatementGitBlobSha) || []
    : [];
  assert.deepEqual(record.exactSourceBodyMatches, expectedBodyMatches,
    "Exact body matches must be byte-identical Git blob SHA references for " + record.version);

  const expectedState = expectedBodyMatches.length
    ? "EXACT_SOURCE_BODY_MATCH"
    : distinctFilenameCandidates.length
      ? "NAME_CANDIDATE_BODY_DIFFERS"
      : "NO_SOURCE_CANDIDATE_IN_EIGHT_BRANCH_CORPUS";
  assert.equal(record.bodyMatchState, expectedState);
  assert.equal(record.originalCurrentNameMatchType, original.matchType || "UNMAPPED_TO_TRACKED_SOURCE");
  assert.equal(record.originalHistoricalNameMatchType, original.historicalMatchType || "NO_HISTORICAL_SOURCE_NAME_CANDIDATE");
}

const exactRecords = evidence.ledgerRecords.filter((record) => record.bodyMatchState === "EXACT_SOURCE_BODY_MATCH");
const recomputedSummary = {
  ledgerRecords: evidence.ledgerRecords.length,
  recordsWithOneStatement: evidence.ledgerRecords.filter((record) => record.statementCount === 1).length,
  recordsWithOtherStatementCardinality: evidence.ledgerRecords.filter((record) => record.statementCount !== 1).length,
  exactBodyMatchLedgerRecords: exactRecords.length,
  exactBodyMatchDistinctSqlBodies: new Set(exactRecords.map((record) => record.appliedStatementGitBlobSha)).size,
  noExactBodyMatchLedgerRecords: evidence.ledgerRecords.length - exactRecords.length,
  filenameCandidateButDifferentBody: evidence.ledgerRecords.filter((record) => record.bodyMatchState === "NAME_CANDIDATE_BODY_DIFFERS").length,
  noFilenameOrBodyCandidateInSearchedBranches: evidence.ledgerRecords.filter((record) => record.bodyMatchState === "NO_SOURCE_CANDIDATE_IN_EIGHT_BRANCH_CORPUS").length,
  sourceFileReferences: sourceIndex.length,
  distinctSourceGitBlobHashes: new Set(sourceIndex.map((source) => source.gitBlobSha)).size
};
assert.deepEqual(evidence.summary, recomputedSummary);

assert.equal(recomputedSummary.ledgerRecords, 130);
assert.equal(recomputedSummary.recordsWithOneStatement, 130);
assert.equal(recomputedSummary.recordsWithOtherStatementCardinality, 0);
assert.equal(recomputedSummary.exactBodyMatchLedgerRecords, 30);
assert.equal(recomputedSummary.exactBodyMatchDistinctSqlBodies, 29);
assert.equal(recomputedSummary.noExactBodyMatchLedgerRecords, 100);
assert.equal(recomputedSummary.filenameCandidateButDifferentBody, 37);
assert.equal(recomputedSummary.noFilenameOrBodyCandidateInSearchedBranches, 63);
assert.equal(recomputedSummary.sourceFileReferences, 127);
assert.equal(recomputedSummary.distinctSourceGitBlobHashes, 86);

// Independently confirm that the recorded source hashes use the standard Git blob framing.
const currentSample = snapshot.sourceFiles[0];
assert.ok(existsSync(currentSample.path), "Current-branch sample migration source is missing.");
const currentBytes = readFileSync(currentSample.path);
const computedBlobSha = createHash("sha1")
  .update("blob " + currentBytes.length + "\0")
  .update(currentBytes)
  .digest("hex");
assert.equal(computedBlobSha, currentSample.gitBlobSha, "Local Git blob SHA implementation disagrees with the source snapshot.");

assert.equal(report.status, "RECONCILIATION_REQUIRED");
assert.deepEqual(report.bodyLevelProvenance.summary, recomputedSummary);
assert.equal(report.bodyLevelProvenance.evidencePath, evidencePath);
assert.equal(report.bodyLevelProvenance.queryPath, queryPath);
assert.equal(report.bodyLevelProvenance.replayAuthorized, false);
assert.match(auditDoc, /30 ledger rows \/ 29 distinct bodies/);
assert.match(auditDoc, /100 ledger rows still have no exact body match/);
assert.match(auditDoc, /Do not repair the ledger or replay migrations/);
assert.match(preflightDoc, /30 ledger records/);
assert.match(preflightDoc, /100 of 130 remain without an exact body match/);
assert.match(roadmap, /30 ledger rows \(29 distinct bodies\)/);
assert.match(roadmap, /100 of 130 records still lack an exact body match/);
assert.deepEqual(statusManifest.infrastructure.migrationBodyProvenance, {
  capturedOn: "2026-11-25",
  evidencePath,
  queryPath,
  ledgerRecords: 130,
  recordsWithOneStatement: 130,
  exactBodyMatchLedgerRecords: 30,
  exactBodyMatchDistinctSqlBodies: 29,
  filenameCandidateButDifferentBody: 37,
  noFilenameOrBodyCandidateInSearchedBranches: 63,
  recordsWithoutExactBodyMatch: 100,
  replayAuthorized: false
});
assert.match(packageJson.scripts.test, /validate-kingsmen-migration-body-provenance\.mjs/);
assert.match(packageJson.scripts["kingsmen:migrations:provenance:validate"], /validate-kingsmen-migration-body-provenance\.mjs/);

console.log("Kingsmen migration body-provenance contract passed: 130 applied statements fingerprinted; 30 exact body matches; 100 records remain unresolved; replay remains unauthorized.");
