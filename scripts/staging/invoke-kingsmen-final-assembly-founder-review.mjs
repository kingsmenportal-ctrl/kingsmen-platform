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
const bundlePath = flags.getAll(['bundle-path', 'bundlepath'], 'reports/final-assembly/final-assembly-evidence-bundle-latest.json');
const launchPath = flags.getAll(['launch-report-path', 'launchreportpath'], 'reports/launch/kingsmen-launch-readiness-latest.json');
const reportPath = flags.getAll(['report-path', 'reportpath'], 'reports/final-assembly/final-founder-review-latest.json');

function flag(name) {
  return flags.has(name);
}

function read(relativePath) {
  return readJsonFileSafe(path.join(repoRoot, relativePath));
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

const bundleRead = read(bundlePath);
const launchRead = read(launchPath);
const bundle = bundleRead.value;
const launch = launchRead.value;

const finalBundleComplete = Boolean(
  bundleRead.ok && bundle
  && bundle.totalReports === bundle.presentReports
  && bundle.totalReports === bundle.passedReports
  && bundle.totalReports === bundle.reviewedReports
  && bundle.totalReports === bundle.redactedReports
);
const launchHasNoBlockers = Boolean(launchRead.ok && launch && Array.isArray(launch.blockers) && launch.blockers.length === 0);
const founderReviewed = flag('markfounderreviewed');
const founderAcceptedProviderRisk = flag('markfounderacceptedproviderrisk');
const founderAcceptedBranchRisk = flag('markfounderacceptedbranchrisk');
const founderConfirmedNoLiveWrites = flag('markfounderconfirmednoliverites') || flag('markfounderconfirmednolivewrites');

const checks = [
  check('final_evidence_bundle_complete', finalBundleComplete, 'bundle_counts_must_all_match_total_reports'),
  check('launch_audit_has_no_hard_blockers', launchHasNoBlockers, 'launch_report_blockers_must_be_empty'),
  check('founder_reviewed', founderReviewed, 'operator_attested'),
  check('founder_accepted_provider_risk', founderAcceptedProviderRisk, 'operator_attested'),
  check('founder_accepted_branch_risk', founderAcceptedBranchRisk, 'operator_attested'),
  check('founder_confirmed_no_live_writes_before_switch', founderConfirmedNoLiveWrites, 'operator_attested'),
];

const passed = checks.every((item) => item.passed === true);
const report = {
  schema: 'kingsmen.final-founder-review.v1',
  module: 'Final Assembly Founder Review',
  status: passed ? 'FINAL_ASSEMBLY_FOUNDER_REVIEW_PASSED' : 'FINAL_ASSEMBLY_FOUNDER_REVIEW_PENDING',
  passed,
  reviewed: founderReviewed,
  redacted: true,
  productionReady: false,
  publicLaunchAllowed: false,
  finalBundleStatus: bundle?.status ?? 'MISSING_FINAL_BUNDLE',
  launchStatus: launch?.publicLaunchStatus ?? launch?.status ?? 'MISSING_LAUNCH_REPORT',
  launchBlockerCount: Array.isArray(launch?.blockers) ? launch.blockers.length : null,
  checks,
  generatedAt: utcNowIso(),
  nextAction: passed
    ? 'Founder final review passed. Production switch still requires controlled deployment approval.'
    : 'Complete PayFast, communications, branch protection, final evidence bundle, and launch audit before founder final approval.',
};

writeJsonFile(path.join(repoRoot, reportPath), report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!passed) process.exit(1);
