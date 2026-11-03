#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { evaluateMainBranchProtection } from "./main-branch-protection-policy.mjs";

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
const branch = "main";
const outputPath = "reports/repo/main-branch-protection-apply-latest.json";
const checkedAt = new Date().toISOString();

async function writeReport(status, httpStatus, checks, error = null) {
  const base = {
    schema: "kingsmen.branch-protection-evidence.v2",
    evidenceType: "read_only_effective_branch_rules_verification",
    status,
    repository: repository ?? null,
    branch,
    checkedAt,
    httpStatus,
    reviewed: false,
    redacted: true,
    error,
    checks,
    note: "Read-only observation of effective GitHub rules. This report does not apply or modify branch protection."
  };
  const sha256 = createHash("sha256").update(JSON.stringify(base)).digest("hex");
  const report = { ...base, sha256 };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return report;
}

const emptyChecks = {
  effectiveRulesPresent: false,
  requiredStatusChecksEnabled: false,
  candidateBuildRequired: false,
  validationRequired: false,
  strictStatusChecksEnabled: false,
  pullRequestRulePresent: false,
  pullRequestReviewRequired: false,
  requiredApprovingReviewCount: 0,
  forcePushDisabled: false,
  branchDeletionDisabled: false,
  requiredDeploymentEnvironments: [],
  noUnrelatedDeploymentPrerequisites: false
};

if (!repository || !token) {
  const report = await writeReport(
    "BLOCKED_MISSING_GITHUB_CONTEXT_OR_TOKEN",
    null,
    emptyChecks,
    "GITHUB_REPOSITORY and GITHUB_TOKEN are required."
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let response;
try {
  response = await fetch(
    `${apiUrl}/repos/${repository}/rules/branches/${encodeURIComponent(branch)}`,
    {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28"
      }
    }
  );
} catch {
  const report = await writeReport(
    "BLOCKED_GITHUB_API_UNREACHABLE",
    null,
    emptyChecks,
    "The effective branch-rules API request could not be completed."
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

if (!response.ok) {
  const report = await writeReport(
    response.status === 401 || response.status === 403
      ? "UNVERIFIED_PERMISSION_DENIED"
      : response.status === 404
        ? "BLOCKED_BRANCH_RULES_NOT_FOUND"
        : "BLOCKED_GITHUB_API_ERROR",
    response.status,
    emptyChecks,
    `GitHub returned HTTP ${response.status} while reading effective rules for main.`
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

let effectiveRules;
try {
  effectiveRules = await response.json();
} catch {
  const report = await writeReport(
    "BLOCKED_INVALID_GITHUB_RESPONSE",
    response.status,
    emptyChecks,
    "The effective branch-rules response was not valid JSON."
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(1);
}

const evaluation = evaluateMainBranchProtection(effectiveRules);
const report = await writeReport(
  evaluation.passed
    ? "VERIFIED_STREAM_SCOPED_PROTECTION_ACTIVE"
    : "BLOCKED_PROTECTION_INCOMPLETE",
  response.status,
  evaluation.checks
);
console.log(JSON.stringify(report, null, 2));
if (!evaluation.passed) process.exitCode = 1;
