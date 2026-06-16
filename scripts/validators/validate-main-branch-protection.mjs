#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/repo/main-branch-protection-validation-latest.json');

function rel(path) {
  return join(repoRoot, path);
}

function read(path) {
  return readFileSync(rel(path), 'utf8');
}

function exists(path) {
  return existsSync(rel(path));
}

const requiredTokens = new Map([
  ['package.json', ['repo:prove:branch-protection', 'repo:validate:branch-protection']],
  ['manifests/repo/main-branch-protection-v1.json', ['main-branch-protection-v1', 'foundation_built_pending_github_apply', 'source-guard', 'preventForcePush']],
  ['docs/repo/KINGSMEN_BRANCH_PROTECTION.md', ['source-guard', 'force push blocked', 'npm run repo:validate:branch-protection']],
  ['.github/workflows/kingsmen-source-guard.yml', ['name: Kingsmen Source Guard', 'source-guard', 'npm run backup:validate:restore', 'npm run kingsmen:launch:audit']],
  ['scripts/github/Set-KingsmenMainBranchProtection.ps1', ['gh api', 'allow_force_pushes = $false', 'allow_deletions = $false', 'MAIN_BRANCH_PROTECTION_APPLIED']],
  ['scripts/proof/prove-main-branch-protection-boundary.mjs', ['MAIN_BRANCH_PROTECTION_SOURCE_PROOF_PASSED', 'githubProtectionApplied: false']],
  ['manifests/launch/kingsmen-launch-readiness-v1.json', ['repo_protection', 'main-branch-protection-v1', 'foundation_built_pending_github_apply']],
  ['scripts/validators/validate-kingsmen-launch-readiness.mjs', ['repo:validate:branch-protection', 'MAIN_BRANCH_PROTECTION_APPLY_REQUIRED']]
]);

const checks = [];
const failed = [];

function check(name, passed, detail, path = '') {
  const item = { name, passed, detail, path };
  checks.push(item);
  if (!passed) failed.push(item);
}

for (const [path, tokens] of requiredTokens.entries()) {
  const found = exists(path);
  check(`file_exists:${path}`, found, found ? 'found' : 'missing', path);
  if (!found) continue;

  const text = read(path);
  for (const token of tokens) {
    check(`token:${path}:${token}`, text.includes(token), text.includes(token) ? 'found' : 'missing', path);
  }
}

if (exists('manifests/repo/main-branch-protection-v1.json')) {
  const manifest = JSON.parse(read('manifests/repo/main-branch-protection-v1.json'));
  check('manifest_production_ready_false', manifest.productionReady === false, String(manifest.productionReady), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_public_launch_false', manifest.publicLaunchAllowed === false, String(manifest.publicLaunchAllowed), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_requires_status_checks', manifest.requiredProtections?.requiresStatusChecks === true, String(manifest.requiredProtections?.requiresStatusChecks), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_requires_source_guard', manifest.requiredProtections?.requiredStatusCheckContexts?.includes('source-guard') === true, JSON.stringify(manifest.requiredProtections?.requiredStatusCheckContexts), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_prevents_force_push', manifest.requiredProtections?.preventForcePush === true, String(manifest.requiredProtections?.preventForcePush), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_prevents_delete', manifest.requiredProtections?.preventDeletion === true, String(manifest.requiredProtections?.preventDeletion), 'manifests/repo/main-branch-protection-v1.json');
}

if (exists('.github/workflows/kingsmen-source-guard.yml')) {
  const workflow = read('.github/workflows/kingsmen-source-guard.yml');
  check('workflow_no_launch_gate', !workflow.includes('kingsmen:launch:gate'), 'source guard must not run final gate while staging evidence remains pending', '.github/workflows/kingsmen-source-guard.yml');
  check('workflow_runs_launch_audit', workflow.includes('kingsmen:launch:audit'), 'launch audit should run as non-blocking evidence report', '.github/workflows/kingsmen-source-guard.yml');
}

if (exists('reports/repo/main-branch-protection-proof-latest.json')) {
  const proof = JSON.parse(read('reports/repo/main-branch-protection-proof-latest.json'));
  check('proof_status_passed', proof.status === 'MAIN_BRANCH_PROTECTION_SOURCE_PROOF_PASSED', proof.status, 'reports/repo/main-branch-protection-proof-latest.json');
  check('proof_not_production_ready', proof.productionReady === false, String(proof.productionReady), 'reports/repo/main-branch-protection-proof-latest.json');
  check('proof_github_apply_false', proof.githubProtectionApplied === false, String(proof.githubProtectionApplied), 'reports/repo/main-branch-protection-proof-latest.json');
}

const validation = {
  schema: 'kingsmen.validation-report.v1',
  module: 'Kingsmen Main Branch Protection',
  status: failed.length === 0 ? 'MAIN_BRANCH_PROTECTION_VALIDATED' : 'MAIN_BRANCH_PROTECTION_VALIDATION_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  githubProtectionApplied: false,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed_checks: failed,
  nextAction: failed.length === 0
    ? 'Run scripts/github/Set-KingsmenMainBranchProtection.ps1 with GitHub admin permissions, then verify settings through GitHub UI or gh api.'
    : 'Repair branch protection proof files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(validation, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(validation, null, 2));
if (!validation.passed) process.exitCode = 1;
