#!/usr/bin/env node
import path from 'node:path';
import {
  parseFlags,
  readJsonFileSafe,
  resolveRepoRoot,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const outputPath = flags.getAll(['output-path', 'outputpath'], 'reports/jarvis/jarvis-live-readiness-latest.json');
const founderApprovalRef = flags.getAll(['founder-approval-ref', 'founderapprovalref'], '');

const gateReports = [
  ['payfast_sandbox_itn_evidence', 'PayFast sandbox ITN evidence', 'reports/staging/payfast-provider-sandbox-staging-latest.json'],
  ['communications_provider_evidence', 'Real communications provider proof', 'reports/staging/communications-provider-staging-latest.json'],
  ['branch_protection_account_review', 'Branch protection/account review', 'reports/repo/main-branch-protection-apply-latest.json'],
  ['final_assembly_founder_review', 'Final assembly founder review', 'reports/final-assembly/final-founder-review-latest.json'],
];

function read(relativePath) {
  return readJsonFileSafe(path.join(repoRoot, relativePath));
}

function gateState([gateRef, title, reportPath]) {
  const parsed = read(reportPath);
  if (!parsed.ok || !parsed.value) {
    return {
      gateRef,
      title,
      reportPath,
      exists: false,
      passed: false,
      reviewed: false,
      redacted: false,
      status: parsed.ok ? 'MISSING_REPORT' : 'UNREADABLE_REPORT',
      nextAction: 'Generate this report with real evidence.',
    };
  }

  const report = parsed.value;
  return {
    gateRef,
    title,
    reportPath,
    exists: true,
    passed: report.passed === true,
    reviewed: report.reviewed === true || report.stagingReviewed === true,
    redacted: report.redacted !== false,
    status: String(report.status ?? 'STATUS_NOT_REPORTED'),
    nextAction: String(report.nextAction ?? 'Review this gate.'),
  };
}

const gates = gateReports.map(gateState);
const blockedGates = gates.filter((gate) => !(gate.exists && gate.passed && gate.reviewed && gate.redacted));
const finalBundleRead = read('reports/final-assembly/final-assembly-evidence-bundle-latest.json');
const launchRead = read('reports/launch/kingsmen-launch-readiness-latest.json');
const finalBundle = finalBundleRead.value;
const launch = launchRead.value;

const finalBundleComplete = Boolean(
  finalBundleRead.ok && finalBundle
  && finalBundle.totalReports === finalBundle.presentReports
  && finalBundle.totalReports === finalBundle.passedReports
  && finalBundle.totalReports === finalBundle.reviewedReports
  && finalBundle.totalReports === finalBundle.redactedReports
);
const launchAuditClear = Boolean(launchRead.ok && launch && Array.isArray(launch.blockers) && launch.blockers.length === 0);
const approvalPresent = founderApprovalRef.trim().length > 0;

const blockers = [
  ...blockedGates.map((gate) => `${gate.gateRef}:${gate.status}`),
  ...(finalBundleComplete ? [] : ['final_bundle_incomplete']),
  ...(launchAuditClear ? [] : ['launch_audit_not_clear']),
  ...(approvalPresent ? [] : ['founder_approval_ref_missing']),
];

const passed = blockers.length === 0;
const report = {
  schema: 'kingsmen.jarvis-live-readiness.v1',
  status: passed ? 'JARVIS_READY_FOR_CONTROLLED_SWITCH_REVIEW' : 'JARVIS_LIVE_READINESS_BLOCKED',
  passed,
  productionReady: false,
  publicLaunchAllowed: false,
  founderApprovalRef: approvalPresent ? founderApprovalRef : null,
  finalBundleComplete,
  launchAuditClear,
  gateCount: gates.length,
  passedGateCount: gates.length - blockedGates.length,
  blockedGateCount: blockedGates.length,
  gates,
  blockers,
  generatedAt: utcNowIso(),
  nextAction: passed
    ? 'Proceed only through controlled switch review. Do not bypass release controls.'
    : 'Complete all blockers with real evidence, then rerun Jarvis live readiness.',
};

const output = writeJsonFile(path.join(repoRoot, outputPath), report);
process.stdout.write(output);
if (!passed) process.exit(1);
