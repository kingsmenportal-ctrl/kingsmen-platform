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
    evidenceType: 'read_only_effective_branch_rules_verification',
    status,
    repository: repository ?? null,
    branch,
    checkedAt,
    protectionActive: checks?.activeProtectionPresent === true,
    httpStatus,
    checks,
    reviewed: false,
    redacted: true,
    note: 'Read-only observation of effective branch rules and their ruleset bypass configuration. This report does not apply or change branch protection. Founder/reviewer sign-off remains separate.'
  };
  const canonical = JSON.stringify(base);
  const report = { ...base, sha256: createHash('sha256').update(canonical).digest('hex') };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
}

function blockedChecks(reason) {
  return {
    activeProtectionPresent: false,
    activeRulesPresent: false,
    activeRulesetPresent: false,
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
    activeRuleCount: 0,
    matchingRulesetCount: 0,
    unrestrictedBypassActorCount: 0,
    requiredDeploymentEnvironments: [],
    failure: reason
  };
}

if (!repository) {
  const report = await finish('BLOCKED_MISSING_GITHUB_CONTEXT', blockedChecks('Missing GITHUB_REPOSITORY context.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const headers = {
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28'
};
if (token) headers.authorization = `Bearer ${token}`;

let branchRulesResponse;
try {
  branchRulesResponse = await fetch(
    `${apiUrl}/repos/${repository}/rules/branches/${encodeURIComponent(branch)}?per_page=100`,
    { headers }
  );
} catch {
  const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub effective branch-rules request failed.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!branchRulesResponse.ok) {
  const status = branchRulesResponse.status === 401 || branchRulesResponse.status === 403
    ? 'UNVERIFIED_PERMISSION_DENIED'
    : branchRulesResponse.status === 404
      ? 'BLOCKED_RULES_NOT_FOUND_OR_NOT_VISIBLE'
      : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('Effective branch rules could not be read; inspect repository visibility and Metadata read permissions.'), branchRulesResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let branchRules;
try {
  branchRules = await branchRulesResponse.json();
} catch {
  const report = await finish('BLOCKED_INVALID_GITHUB_RESPONSE', blockedChecks('GitHub returned invalid JSON for effective branch rules.'), branchRulesResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let rulesetsResponse;
try {
  rulesetsResponse = await fetch(
    `${apiUrl}/repos/${repository}/rulesets?includes_parents=true&per_page=100`,
    { headers }
  );
} catch {
  const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub ruleset metadata request failed.'));
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!rulesetsResponse.ok) {
  const status = rulesetsResponse.status === 401 || rulesetsResponse.status === 403
    ? 'UNVERIFIED_PERMISSION_DENIED'
    : 'BLOCKED_RULESET_METADATA_UNAVAILABLE';
  const report = await finish(status, blockedChecks('Effective branch rules were read, but the ruleset bypass metadata could not be verified.'), rulesetsResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let rulesets;
try {
  rulesets = await rulesetsResponse.json();
} catch {
  const report = await finish('BLOCKED_INVALID_GITHUB_RESPONSE', blockedChecks('GitHub returned invalid JSON for repository rulesets.'), rulesetsResponse.status);
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const branchRulesetIds = [...new Set(
  (Array.isArray(branchRules) ? branchRules : [])
    .map((rule) => rule?.ruleset_id)
    .filter((id) => Number.isInteger(id))
)];
const matchingRulesets = (Array.isArray(rulesets) ? rulesets : []).filter((ruleset) =>
  ruleset?.enforcement === 'active' && branchRulesetIds.includes(ruleset.id)
);
const detailedRulesets = [];
for (const ruleset of matchingRulesets) {
  let detailResponse;
  try {
    detailResponse = await fetch(
      `${apiUrl}/repos/${repository}/rulesets/${ruleset.id}`,
      { headers }
    );
  } catch {
    const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub ruleset detail request failed.'));
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  if (!detailResponse.ok) {
    const status = detailResponse.status === 401 || detailResponse.status === 403
      ? 'UNVERIFIED_PERMISSION_DENIED'
      : 'BLOCKED_RULESET_DETAIL_UNAVAILABLE';
    const report = await finish(status, blockedChecks(`Ruleset ${ruleset.id} was matched to main, but its bypass configuration could not be read.`), detailResponse.status);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  try {
    detailedRulesets.push(await detailResponse.json());
  } catch {
    const report = await finish('BLOCKED_INVALID_GITHUB_RESPONSE', blockedChecks(`GitHub returned invalid JSON for ruleset ${ruleset.id}.`), detailResponse.status);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

const evaluation = evaluateMainBranchProtection(branchRules, detailedRulesets);
const status = evaluation.passed
  ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE'
  : evaluation.checks.activeProtectionPresent
    ? 'BLOCKED_PROTECTION_INCOMPLETE'
    : 'BLOCKED_PROTECTION_NOT_ACTIVE';
const report = await finish(status, evaluation.checks, branchRulesResponse.status);
console.log(JSON.stringify(report, null, 2));
if (!evaluation.passed) process.exitCode = 1;
