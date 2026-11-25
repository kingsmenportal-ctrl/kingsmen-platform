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
const headers = {
  accept: 'application/vnd.github+json',
  authorization: `Bearer ${token ?? ''}`,
  'x-github-api-version': '2022-11-28'
};

async function finish(status, checks, httpStatus = null, extra = {}) {
  const base = {
    schema: 'kingsmen.branch-protection-evidence.v1',
    evidenceType: 'read_only_branch_protection_verification',
    status,
    repository: repository ?? null,
    branch,
    checkedAt,
    protectionActive: checks?.protectionSource === 'repository_ruleset' || typeof checks?.rulesetActiveForMain === 'boolean'
      ? checks?.rulesetActiveForMain === true
      : (extra.verificationEndpoint === 'repository_rulesets' || extra.verificationEndpoint === 'repository_rulesets_detail')
        ? false
        : httpStatus === 200,
    httpStatus,
    verificationEndpoint: extra.verificationEndpoint ?? null,
    checks,
    reviewed: false,
    redacted: true,
    note: 'Read-only observation only. This report does not apply or change branch protection. Founder/reviewer sign-off remains separate.',
    ...extra
  };
  const canonical = JSON.stringify(base);
  const report = { ...base, sha256: createHash('sha256').update(canonical).digest('hex') };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
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

function rulesetAppliesToMain(ruleset) {
  const names = ruleset?.conditions?.ref_name;
  return ruleset?.target === 'branch'
    && ruleset?.enforcement === 'active'
    && Array.isArray(names?.include)
    && names.include.includes(`refs/heads/${branch}`)
    && !(Array.isArray(names.exclude) && names.exclude.includes(`refs/heads/${branch}`));
}

async function apiGet(path) {
  return fetch(`${apiUrl}${path}`, { headers });
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

let classicResponse;
try {
  classicResponse = await apiGet(`/repos/${repository}/branches/${branch}/protection`);
} catch {
  const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('GitHub API request failed.'), null, {
    verificationEndpoint: 'classic_branch_protection'
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (classicResponse.ok) {
  const protection = await classicResponse.json();
  const evaluation = evaluateMainBranchProtection(protection);
  const report = await finish(
    evaluation.passed ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE' : 'BLOCKED_PROTECTION_INCOMPLETE',
    { ...evaluation.checks, verificationEndpoint: 'classic_branch_protection' },
    classicResponse.status,
    { verificationEndpoint: 'classic_branch_protection' }
  );
  console.log(JSON.stringify(report, null, 2));
  if (!evaluation.passed) process.exitCode = 1;
} else if (classicResponse.status === 404) {
  // GitHub rulesets may protect main without exposing a classic branch-protection object.
  // Query the rulesets API and evaluate the actual active ruleset instead of treating
  // the classic endpoint's 404 as proof that main is unprotected.
  let rulesetsResponse;
  try {
    rulesetsResponse = await apiGet(`/repos/${repository}/rulesets?includes_parents=true&per_page=100`);
  } catch {
    const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('Both classic protection and ruleset verification requests failed.'), null, {
      verificationEndpoint: 'repository_rulesets',
      classicEndpointStatus: classicResponse.status
    });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (!rulesetsResponse.ok) {
    const status = rulesetsResponse.status === 401 || rulesetsResponse.status === 403
      ? 'UNVERIFIED_PERMISSION_DENIED'
      : 'BLOCKED_RULESET_API_ERROR';
    const report = await finish(status, blockedChecks('Classic protection returned 404 and repository rulesets could not be read.'), rulesetsResponse.status, {
      verificationEndpoint: 'repository_rulesets',
      classicEndpointStatus: classicResponse.status,
      rulesetEndpointStatus: rulesetsResponse.status
    });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const rulesets = await rulesetsResponse.json();
  const listedRulesets = Array.isArray(rulesets) ? rulesets : [];
  // The list endpoint may omit conditions and rule definitions, so locate the known
  // ruleset by name here and verify its target/enforcement using the detail endpoint below.
  const namedCandidates = listedRulesets.filter((ruleset) => ruleset?.name === 'main-branch-protection');
  const candidates = listedRulesets.filter(rulesetAppliesToMain);
  const preferred = namedCandidates.find((ruleset) => ruleset?.target === 'branch' && ruleset?.enforcement !== 'disabled')
    ?? namedCandidates[0]
    ?? candidates[0];

  if (!preferred) {
    const report = await finish(
      'BLOCKED_RULESET_NOT_FOUND_OR_NOT_VISIBLE',
      { ...blockedChecks('Classic protection returned 404 and no active repository ruleset applying to main was found.') },
      rulesetsResponse.status,
      {
        verificationEndpoint: 'repository_rulesets',
        classicEndpointStatus: classicResponse.status,
        applicableActiveRulesetCount: candidates.length
      }
    );
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  let detailResponse;
  try {
    detailResponse = await apiGet(`/repos/${repository}/rulesets/${preferred.id}`);
  } catch {
    const report = await finish('BLOCKED_GITHUB_API_UNREACHABLE', blockedChecks('The active ruleset was listed but its detailed rule definitions could not be fetched.'), null, {
      verificationEndpoint: 'repository_rulesets_detail',
      classicEndpointStatus: classicResponse.status,
      rulesetId: preferred.id ?? null,
      rulesetName: preferred.name ?? null
    });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (!detailResponse.ok) {
    const status = detailResponse.status === 401 || detailResponse.status === 403
      ? 'UNVERIFIED_PERMISSION_DENIED'
      : 'BLOCKED_RULESET_DETAILS_NOT_VISIBLE';
    const report = await finish(status, blockedChecks('The active ruleset was listed but its detailed rule definitions could not be read.'), detailResponse.status, {
      verificationEndpoint: 'repository_rulesets_detail',
      classicEndpointStatus: classicResponse.status,
      rulesetListStatus: rulesetsResponse.status,
      rulesetId: preferred.id ?? null,
      rulesetName: preferred.name ?? null
    });
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const detailedRuleset = await detailResponse.json();
  if (!rulesetAppliesToMain(detailedRuleset)) {
    const report = await finish(
      'BLOCKED_RULESET_NOT_FOUND_OR_NOT_VISIBLE',
      { ...blockedChecks('The selected ruleset detail does not confirm active enforcement on refs/heads/main.'), rulesetActiveForMain: false },
      detailResponse.status,
      {
        verificationEndpoint: 'repository_rulesets_detail',
        classicEndpointStatus: classicResponse.status,
        rulesetId: detailedRuleset.id ?? preferred.id ?? null,
        rulesetName: detailedRuleset.name ?? preferred.name ?? null,
        applicableActiveRulesetCount: candidates.length
      }
    );
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
  const evaluation = evaluateMainBranchProtection(detailedRuleset);
  const report = await finish(
    evaluation.passed ? 'VERIFIED_REQUIRED_PROTECTION_ACTIVE' : 'BLOCKED_PROTECTION_INCOMPLETE',
    {
      ...evaluation.checks,
      verificationEndpoint: 'repository_rulesets_detail',
      classicEndpointStatus: classicResponse.status,
      rulesetListStatus: rulesetsResponse.status,
      applicableActiveRulesetCount: candidates.length
    },
    detailResponse.status,
    {
      verificationEndpoint: 'repository_rulesets_detail',
      classicEndpointStatus: classicResponse.status,
      rulesetListStatus: rulesetsResponse.status,
      rulesetId: detailedRuleset.id ?? preferred.id ?? null,
      rulesetName: detailedRuleset.name ?? preferred.name ?? null,
      applicableActiveRulesetCount: candidates.length
    }
  );
  console.log(JSON.stringify(report, null, 2));
  if (!evaluation.passed) process.exitCode = 1;
} else {
  const status = classicResponse.status === 401 || classicResponse.status === 403
    ? 'UNVERIFIED_PERMISSION_DENIED'
    : 'BLOCKED_GITHUB_API_ERROR';
  const report = await finish(status, blockedChecks('Classic branch protection could not be verified; inspect workflow permissions and repository settings.'), classicResponse.status, {
    verificationEndpoint: 'classic_branch_protection'
  });
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}
