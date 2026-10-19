#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const branch = 'main';
const outputPath = 'reports/repo/main-branch-protection-apply-latest.json';
const checkedAt = new Date().toISOString();

function finish(status, checks, httpStatus = null) {
  const base = {
    schema: 'kingsmen.branch-protection-evidence.v1',
    evidenceType: 'read_only_branch_protection_verification',
    status,
    repository: repository ?? null,
    branch,
    checkedAt,
    protectionActive: httpStatus === 200,
    httpStatus,
    checks,
    reviewed: false,
    redacted: true,
    note: 'Read-only observation only. This report does not apply or change branch protection. Founder/reviewer sign-off remains separate.'
  };
  const canonical = JSON.stringify(base);
  const report = { ...base, sha256: createHash('sha256').update(canonical).digest('hex') };
  awaitWrite(report);
  return report;
}
async function awaitWrite(report) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
}
function blockedChecks(reason) {
  return {
    sourceGuardRequired: false,
    pullRequestReviewRequired: false,
    adminEnforcementEnabled: false,
    forcePushDisabled: false,
    branchDeletionDisabled: false,
    failure: reason
  };
}

if (!repository || !token) {
  const report = await finish('BLOCKED_MISSING_GITHUB_CONTEXT', blockedChecks('Missing repository or token context.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let response;
try {
  response = await fetch(`${apiUrl}/repos/${repository}/branches/${branch}/protection`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28'
    }
  });
} catch {
  const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub API request failed.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!response.ok) {
  const status = response.status === 403 ? 'UNVERIFIED_PERMISSION_DENIED'
    : response.status === 404 ? 'BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE'
    : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('Branch protection could not be verified; inspect workflow permissions and repository settings.'), response.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const protection = await response.json();
const requiredChecks = protection.required_status_checks?.contexts ?? [];
const requiredCheckNames = protection.required_status_checks?.checks?.map((check) => check.context) ?? [];
const sourceGuardRequired = [...new Set([...requiredChecks, ...requiredCheckNames])].some((name) => name === 'source-guard' || name.endsWith('/source-guard'));
const reviewCount = protection.required_pull_request_reviews?.required_approving_review_count ?? 0;
const pullRequestReviewRequired = reviewCount >= 1;
const adminEnforcementEnabled = protection.enforce_admins?.enabled === true;
const forcePushDisabled = protection.allow_force_pushes?.enabled === false;
const branchDeletionDisabled = protection.allow_deletions?.enabled === false;
const checks = {
  sourceGuardRequired,
  pullRequestReviewRequired,
  requiredApprovingReviewCount: reviewCount,
  adminEnforcementEnabled,
  forcePushDisabled,
  branchDeletionDisabled
};
const passed = Object.values(checks).every((value) => typeof value === 'boolean' ? value : true);
const report = await finish(passed ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE' : 'BLOCKED_PROTECTION_INCOMPLETE', checks, response.status);
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
