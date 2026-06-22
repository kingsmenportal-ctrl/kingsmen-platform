#!/usr/bin/env node
import path from 'node:path';
import {
  parseFlags,
  resolveRepoRoot,
  utcNowIso,
  writeJsonFile,
} from '../lib/kingsmen-runtime.mjs';

const flags = parseFlags();
const repoRoot = path.resolve(flags.getAll(['repo-root', 'reporoot'], resolveRepoRoot(import.meta.url)));
const reportPath = flags.getAll(['report-path', 'reportpath'], 'reports/repo/main-branch-protection-apply-latest.json');

function flag(name) {
  return flags.has(name);
}

function check(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

const actualProtectionApplied = flag('markgithubbranchprotectionapplied');
const accountConstraintReviewed = flag('markaccountconstraintreviewed');
const compensatingControlReviewed = flag('markcompensatingcontrolreviewed');
const founderReviewed = flag('markfounderreviewed');

const checks = [
  check('main_branch_protection_applied', actualProtectionApplied, 'github_repo_setting_or_plan_capability_required'),
  check('account_constraint_reviewed', accountConstraintReviewed, 'operator_attested'),
  check('compensating_control_reviewed', compensatingControlReviewed, 'operator_attested_not_equivalent_to_github_branch_protection'),
  check('founder_reviewed', founderReviewed, 'operator_attested'),
  check('production_deploy_requires_manual_review', true, 'policy_boundary_confirmed'),
  check('direct_main_push_not_approved_for_launch', true, 'policy_boundary_confirmed'),
];

const passed = actualProtectionApplied && founderReviewed;
const reviewed = founderReviewed || (accountConstraintReviewed && compensatingControlReviewed);
const status = passed
  ? 'MAIN_BRANCH_PROTECTION_APPLIED'
  : reviewed
    ? 'MAIN_BRANCH_PROTECTION_ACCOUNT_REVIEWED_COMPENSATING_CONTROL_NOT_LAUNCH_EQUIVALENT'
    : 'MAIN_BRANCH_PROTECTION_APPLY_NEEDS_REVIEW';

const report = {
  schema: 'kingsmen.repo-branch-protection-report.v1',
  module: 'Main Branch Protection Review',
  status,
  passed,
  reviewed,
  redacted: true,
  productionReady: false,
  publicLaunchAllowed: false,
  githubProtectionApplied: actualProtectionApplied,
  accountConstraintReviewed,
  compensatingControlReviewed,
  compensatingControlLaunchEquivalent: false,
  checks,
  generatedAt: utcNowIso(),
  nextAction: passed
    ? 'Main branch protection evidence is applied and founder reviewed.'
    : 'Apply GitHub branch protection or upgrade/make repository eligible. A compensating review records the risk but does not equal true branch protection.',
};

writeJsonFile(path.join(repoRoot, reportPath), report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!passed) process.exit(1);
