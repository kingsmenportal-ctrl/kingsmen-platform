import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const requiredFiles = [
  'apps/api/src/final-assembly/final-assembly-evidence-capture-boundary.ts',
  'manifests/launch/final-assembly-evidence-capture-v1.json',
  'docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md',
  'scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1'
];

const requiredTokens = new Map([
  ['apps/api/src/final-assembly/final-assembly-evidence-capture-boundary.ts', [
    'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_BOUNDARY_SOURCE_ONLY',
    'requiredFinalAssemblyEvidenceReports',
    'rawReportBodiesMayBeCopiedIntoBundle: false',
    'finalAssemblyFounderReviewRequired: true',
    'final_assembly_readiness_engine_remains_pending_until_evidence_review'
  ]],
  ['manifests/launch/final-assembly-evidence-capture-v1.json', [
    'kingsmen.final-assembly-evidence-capture.v1',
    'foundation_built_pending_final_evidence_capture_review',
    'finalAssemblyEvidencePending',
    'reports/final-assembly/final-assembly-evidence-bundle-latest.json'
  ]],
  ['docs/launch/KINGSMEN_FINAL_ASSEMBLY_EVIDENCE_CAPTURE.md', [
    'Final Assembly Evidence Capture Proof',
    'Production ready: **false**',
    'Public launch allowed: **false**',
    'npm run final:validate:evidence'
  ]],
  ['scripts/staging/Collect-KingsmenFinalAssemblyEvidence.ps1', [
    'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_INCOMPLETE',
    'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW',
    'rawReportBodiesCopied = $false',
    'Get-FileHash'
  ]]
]);

const expectedRuntimeReports = [
  'reports/staging/truth-vault-persistence-staging-latest.json',
  'reports/staging/web-backend-boundary-staging-latest.json',
  'reports/staging/rls-sql-isolation-staging-latest.json',
  'reports/staging/payfast-provider-sandbox-staging-latest.json',
  'reports/staging/backup-restore-drill-staging-latest.json',
  'reports/security/secrets-wiring-runtime-health-latest.json',
  'reports/staging/communications-provider-staging-latest.json',
  'reports/staging/observability-incident-staging-latest.json',
  'reports/staging/legal-privacy-publication-staging-latest.json',
  'reports/repo/main-branch-protection-apply-latest.json'
];

function read(path) {
  const full = join(repoRoot, path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function checkFile(path) {
  const content = read(path);
  const tokens = requiredTokens.get(path) ?? [];
  const missing = content === null ? tokens : tokens.filter((token) => !content.includes(token));
  return {
    name: `file:${path}`,
    passed: content !== null && missing.length === 0,
    detail: missing.length ? `missing:${missing.join(', ')}` : path
  };
}

function summarizeRuntimeReport(path) {
  const content = read(path);
  if (!content) {
    return {
      path,
      exists: false,
      status: 'PENDING_STAGING_CAPTURE',
      passed: false,
      reviewed: false,
      redacted: false,
      sha256: null
    };
  }
  let parsed = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { status: 'UNPARSEABLE_JSON', passed: false };
  }
  const redacted = !(
    parsed.rawSecretsPrinted === true ||
    parsed.rawCandidateDataPrinted === true ||
    parsed.providerCredentialsPrinted === true ||
    parsed.rawReportBodyCopied === true
  );
  return {
    path,
    exists: true,
    status: String(parsed.status ?? 'STATUS_NOT_REPORTED'),
    passed: parsed.passed === true,
    reviewed: parsed.reviewed === true || parsed.founderReviewed === true || parsed.operatorReviewed === true || parsed.legalReviewed === true || parsed.stagingReviewed === true,
    redacted,
    sha256: sha256(content)
  };
}

const checks = requiredFiles.map(checkFile);

for (const reportPath of expectedRuntimeReports) {
  checks.push({ name: `runtime_report_declared:${reportPath}`, passed: true, detail: reportPath });
}

const runtimeReportInventory = expectedRuntimeReports.map(summarizeRuntimeReport);
const presentReports = runtimeReportInventory.filter((report) => report.exists).length;
const passedReports = runtimeReportInventory.filter((report) => report.exists && report.passed).length;
const reviewedReports = runtimeReportInventory.filter((report) => report.exists && report.passed && report.reviewed).length;
const redactedReports = runtimeReportInventory.filter((report) => report.exists && report.redacted).length;
const passed = checks.every((check) => check.passed);

const report = {
  schema: 'kingsmen.final-assembly-evidence-capture-proof-report.v1',
  module: 'Final Assembly Evidence Capture Proof',
  status: passed ? 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_PASSED' : 'FINAL_ASSEMBLY_EVIDENCE_CAPTURE_SOURCE_PROOF_FAILED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  finalAssemblyCanOpen: false,
  finalAssemblyEvidencePending: true,
  finalAssemblyFounderReviewRequired: true,
  rawReportBodiesCopied: false,
  rawCandidateDataIncluded: false,
  providerCredentialsIncluded: false,
  totalRuntimeReports: expectedRuntimeReports.length,
  presentReports,
  passedReports,
  reviewedReports,
  redactedReports,
  runtimeReportInventory,
  checks,
  failed: checks.filter((check) => !check.passed),
  generatedAt: new Date().toISOString(),
  nextAction: 'Run staging proofs, collect final assembly evidence bundle, then founder-review the bundle before opening launch gate.'
};

const outPath = join(repoRoot, 'reports/final-assembly/final-assembly-evidence-capture-proof-latest.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (!passed) process.exit(1);
