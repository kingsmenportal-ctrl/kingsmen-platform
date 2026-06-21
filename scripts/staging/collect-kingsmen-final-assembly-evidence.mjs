#!/usr/bin/env node
import path from 'node:path';
import {
  parseFlags,
  readJsonFileSafe,
  resolveRepoRoot,
  sha256File,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/final-assembly/final-assembly-evidence-bundle-latest.json');
const requireAll = flags.has('requireall') || flags.has('require-all');

const requiredReports = [
  'reports/staging/truth-vault-persistence-staging-latest.json',
  'reports/staging/web-backend-boundary-staging-latest.json',
  'reports/staging/rls-sql-isolation-staging-latest.json',
  'reports/staging/payfast-provider-sandbox-staging-latest.json',
  'reports/staging/backup-restore-drill-staging-latest.json',
  'reports/security/secrets-wiring-runtime-health-latest.json',
  'reports/staging/communications-provider-staging-latest.json',
  'reports/staging/observability-incident-staging-latest.json',
  'reports/staging/legal-privacy-publication-staging-latest.json',
  'reports/repo/main-branch-protection-apply-latest.json',
];

function bool(value) {
  return value === true;
}

function reviewedFrom(json) {
  return ['reviewed', 'founderReviewed', 'operatorReviewed', 'legalReviewed', 'stagingReviewed'].some((field) => bool(json?.[field]));
}

function redactedFrom(json) {
  return !['rawSecretsPrinted', 'rawCandidateDataPrinted', 'providerCredentialsPrinted', 'rawReportBodyCopied'].some((field) => bool(json?.[field]));
}

function readJsonSummary(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  const parsed = readJsonFileSafe(fullPath);

  if (!parsed.ok || !parsed.value) {
    return {
      path: relativePath,
      exists: false,
      passed: false,
      reviewed: false,
      redacted: false,
      status: parsed.ok ? 'MISSING_STAGING_REPORT' : 'UNREADABLE_STAGING_REPORT',
      sha256: null,
      generatedAt: null,
      rawBodyCopied: false,
      parseError: parsed.ok ? null : parsed.error,
    };
  }

  const json = parsed.value;
  let passed = bool(json.passed);
  let status = json.status ? String(json.status) : 'STATUS_NOT_REPORTED';

  if (relativePath === 'reports/staging/communications-provider-staging-latest.json' && passed) {
    const placeholderScanOk = json.placeholderValuesAccepted === false
      && typeof json.credentialPlaceholderScan === 'string'
      && json.credentialPlaceholderScan.toLowerCase().includes('rejected');

    if (!placeholderScanOk) {
      passed = false;
      status = 'COMMUNICATIONS_PLACEHOLDER_SCAN_REQUIRED';
    }
  }

  return {
    path: relativePath,
    exists: true,
    passed,
    reviewed: reviewedFrom(json),
    redacted: redactedFrom(json),
    status,
    sha256: sha256File(fullPath),
    generatedAt: json.generatedAt ? String(json.generatedAt) : (json.generated_at ? String(json.generated_at) : null),
    rawBodyCopied: false,
  };
}

const reportStates = requiredReports.map(readJsonSummary);
const totalReports = requiredReports.length;
const presentReports = reportStates.filter((report) => report.exists).length;
const passedReports = reportStates.filter((report) => report.exists && report.passed).length;
const reviewedReports = reportStates.filter((report) => report.exists && report.passed && report.reviewed).length;
const redactedReports = reportStates.filter((report) => report.exists && report.redacted).length;

const ready = presentReports === totalReports
  && passedReports === totalReports
  && reviewedReports === totalReports
  && redactedReports === totalReports;

const bundle = {
  schema: 'kingsmen.final-assembly-evidence-bundle.v1',
  module: 'Final Assembly Evidence Bundle',
  status: ready ? 'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_READY_FOR_FOUNDER_REVIEW' : 'FINAL_ASSEMBLY_EVIDENCE_BUNDLE_INCOMPLETE',
  productionReady: false,
  publicLaunchAllowed: false,
  finalAssemblyCanOpen: false,
  rawReportBodiesCopied: false,
  rawCandidateDataIncluded: false,
  providerCredentialsIncluded: false,
  totalReports,
  presentReports,
  passedReports,
  reviewedReports,
  redactedReports,
  reports: reportStates,
  generatedAt: utcNowIso(),
  nextAction: 'Review missing, failed, unreviewed, or unredacted staging reports before final assembly.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), bundle);
process.stdout.write(output);

if (requireAll && !ready) process.exit(1);
