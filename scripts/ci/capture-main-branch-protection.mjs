#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { evaluateMainBranchProtection } from './main-branch-protection-policy.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const branch = 'main';
const outputPath = 'reports/repo/main-branch-protection-apply-latest.json';
const checkedAt = new Date().toISOString();

async function finish(status, checks, httpStatus = null) {
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
  await awaitWrite(report);
  return report;
}

async function awaitWrite(report) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
}

function blockedChecks(reason) {
  return {
    requiredStatusChecksEnabled: false,
    sourceGuardRequired: false,
    releaseEvidenceRequired: false,
    strictStatusChecksEnabled: false,
    pullRequestReviewRequired: false,
    staleReviewsDismissed: false,
    conversationResolutionRequired: false,
    linearHistoryRequired: false,
    adminEnforcementEnabled: false,
    forcePushDisabled: false,
    branchDeletionDisabled: false,
    requiredApprovingReviewCount: 0,
    failure: reason
  };
}

if (!repository) {
  const report = await finish(
    'BLOCKED_MISSING_GITHUB_CONTEXT',
    blockedChecks('Missing GITHUB_REPOSITORY context.')
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!token) {
  const report = await finish(
    'UNVERIFIED_MISSING_READ_TOKEN',
    blockedChecks('Branch protection was not inspected because KINGSMEN_BRANCH_PROTECTION_READ_TOKEN is unavailable. This evidence-only check is non-blocking; verify branch protection in repository settings.')
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
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
  const status = response.status === 401 || response.status === 403 ? 'UNVERIFIED_PERMISSION_DENIED'
    : response.status === 404 ? 'BLOCKED_PROTECTION_NOT_FOUND_OR_NOT_VISIBLE'
    : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('Branch protection could not be verified; inspect workflow permissions and repository settings. This read-only evidence check does not prove protection is absent and does not block unrelated scoped releases.'), response.status);
  console.log(JSON.stringify(report, null, 2));
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    process.exit(0);
  }
  process.exit(1);
}

const protection = await response.json();
const evaluation = evaluateMainBranchProtection(protection);
const report = await finish(
  evaluation.passed ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE' : 'BLOCKED_PROTECTION_INCOMPLETE',
  evaluation.checks,
  response.status
);
console.log(JSON.stringify(report, null, 2));
if (!evaluation.passed) process.exitCode = 1;
