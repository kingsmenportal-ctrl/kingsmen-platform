#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { evaluateMainBranchProtection } from './main-branch-protection-policy.mjs';

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const branch = 'main';
const branchRef = 'refs/heads/main';
const outputPath = 'reports/repo/main-branch-protection-apply-latest.json';
const checkedAt = new Date().toISOString();
const headers = {
  accept: 'application/vnd.github+json',
  authorization: 'Bearer ' + token,
  'x-github-api-version': '2022-11-28'
};

async function finish(status, checks, httpStatus = null, ruleset = null) {
  const base = {
    schema: 'kingsmen.branch-protection-evidence.v1',
    evidenceType: 'read_only_ruleset_verification',
    status,
    repository: repository ?? null,
    branch,
    checkedAt,
    protectionActive: status === 'VERIFIED_REQUIRED_PROTECTION_ACTIVE',
    httpStatus,
    ruleset: ruleset ? { id: ruleset.id ?? null, name: ruleset.name ?? null, enforcement: ruleset.enforcement ?? null } : null,
    checks,
    reviewed: false,
    redacted: true,
    note: 'Read-only ruleset observation only. This report does not apply or change branch protection. Founder/reviewer sign-off remains separate.'
  };
  const canonical = JSON.stringify(base);
  const report = { ...base, sha256: createHash('sha256').update(canonical).digest('hex') };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
}

function blockedChecks(reason) {
  return {
    mainBranchTargeted: false,
    rulesetEnforced: false,
    requiredStatusChecksEnabled: false,
    testAndBuildRequired: false,
    validateRequired: false,
    strictStatusChecksEnabled: false,
    pullRequestReviewRequired: false,
    requiredApprovingReviewCount: 0,
    noBypassActors: false,
    forcePushDisabled: false,
    branchDeletionDisabled: false,
    failure: reason
  };
}

if (!repository) {
  const report = await finish('BLOCKED_MISSING_GITHUB_CONTEXT', blockedChecks('Missing GITHUB_REPOSITORY context.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!token) {
  const report = await finish(
    'BLOCKED_MISSING_READ_TOKEN',
    blockedChecks('Missing repository secret KINGSMEN_BRANCH_PROTECTION_READ_TOKEN. Configure a fine-grained token with repository Administration: read permission.')
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let listResponse;
try {
  listResponse = await fetch(apiUrl + '/repos/' + repository + '/rulesets?per_page=100', { headers });
} catch {
  const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub ruleset listing request failed.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!listResponse.ok) {
  const status = listResponse.status === 401 || listResponse.status === 403 ? 'UNVERIFIED_PERMISSION_DENIED'
    : listResponse.status === 404 ? 'BLOCKED_RULESET_NOT_FOUND_OR_NOT_VISIBLE'
    : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('Repository rulesets could not be listed; inspect token Administration: read permission and repository settings.'), listResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let summaries;
try {
  summaries = await listResponse.json();
} catch {
  const report = await finish('BLOCKED_INVALID_RULESET_RESPONSE', blockedChecks('GitHub returned an unreadable ruleset listing.'), listResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!Array.isArray(summaries)) {
  const report = await finish('BLOCKED_INVALID_RULESET_RESPONSE', blockedChecks('GitHub ruleset listing was not an array.'), listResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const details = await Promise.all(summaries
  .filter((item) => Number.isInteger(item?.id))
  .map(async (item) => {
    try {
      const response = await fetch(apiUrl + '/repos/' + repository + '/rulesets/' + item.id, { headers });
      if (!response.ok) return { errorStatus: response.status, id: item.id };
      return await response.json();
    } catch {
      return { errorStatus: 0, id: item.id };
    }
  }));

const detailFailure = details.find((item) => Number.isInteger(item?.errorStatus));
if (detailFailure) {
  const httpStatus = detailFailure.errorStatus || null;
  const status = httpStatus === 401 || httpStatus === 403 ? 'UNVERIFIED_PERMISSION_DENIED'
    : httpStatus === 404 ? 'BLOCKED_RULESET_NOT_FOUND_OR_NOT_VISIBLE'
    : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('A repository ruleset detail could not be read; inspect Administration: read permission.'), httpStatus);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const matchingRuleset = details.find((item) => item?.target === 'branch'
  && Array.isArray(item?.conditions?.ref_name?.include)
  && item.conditions.ref_name.include.includes(branchRef));

if (!matchingRuleset) {
  const report = await finish('BLOCKED_MAIN_BRANCH_RULESET_NOT_FOUND', blockedChecks('No repository ruleset targeting refs/heads/main was visible.'), listResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const evaluation = evaluateMainBranchProtection(matchingRuleset);
const report = await finish(
  evaluation.passed ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE' : 'BLOCKED_PROTECTION_INCOMPLETE',
  evaluation.checks,
  200,
  matchingRuleset
);
console.log(JSON.stringify(report, null, 2));
if (!evaluation.passed) process.exitCode = 1;
