#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const reportPath = join(repoRoot, 'reports/repo/main-branch-protection-proof-latest.json');

function rel(path) {
  return join(repoRoot, path);
}

function read(path) {
  return readFileSync(rel(path), 'utf8');
}

const requiredFiles = [
  'manifests/repo/main-branch-protection-v1.json',
  'docs/repo/KINGSMEN_BRANCH_PROTECTION.md',
  '.github/workflows/kingsmen-source-guard.yml',
  'scripts/github/Set-KingsmenMainBranchProtection.ps1'
];

const checks = [];
const failed = [];

function check(name, passed, detail, evidencePath) {
  const result = { name, passed, detail, evidencePath };
  checks.push(result);
  if (!passed) failed.push(result);
}

for (const file of requiredFiles) {
  check(`file_exists:${file}`, existsSync(rel(file)), file, file);
}

if (existsSync(rel('manifests/repo/main-branch-protection-v1.json'))) {
  const manifest = JSON.parse(read('manifests/repo/main-branch-protection-v1.json'));
  check('manifest_key', manifest.manifestKey === 'main-branch-protection-v1', manifest.manifestKey, 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_status_pending_apply', manifest.status === 'foundation_built_pending_github_apply', manifest.status, 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_production_ready_false', manifest.productionReady === false, String(manifest.productionReady), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_requires_no_force_push', manifest.requiredProtections?.preventForcePush === true, String(manifest.requiredProtections?.preventForcePush), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_requires_no_delete', manifest.requiredProtections?.preventDeletion === true, String(manifest.requiredProtections?.preventDeletion), 'manifests/repo/main-branch-protection-v1.json');
  check('manifest_requires_source_guard', manifest.requiredProtections?.requiredStatusCheckContexts?.includes('source-guard') === true, JSON.stringify(manifest.requiredProtections?.requiredStatusCheckContexts), 'manifests/repo/main-branch-protection-v1.json');
}

if (existsSync(rel('.github/workflows/kingsmen-source-guard.yml'))) {
  const workflow = read('.github/workflows/kingsmen-source-guard.yml');
  for (const token of [
    'name: Kingsmen Source Guard',
    'source-guard',
    'npm run api:validate:truth-vault',
    'npm run web:validate:backend-boundary',
    'npm run payments:validate:sandbox',
    'npm run security:validate:rls',
    'npm run backup:validate:restore',
    'npm run kingsmen:launch:audit'
  ]) {
    check(`workflow_token:${token}`, workflow.includes(token), token, '.github/workflows/kingsmen-source-guard.yml');
  }
  check('workflow_does_not_run_launch_gate', !workflow.includes('kingsmen:launch:gate'), 'launch gate must not block all merges while staging evidence is pending', '.github/workflows/kingsmen-source-guard.yml');
}

if (existsSync(rel('scripts/github/Set-KingsmenMainBranchProtection.ps1'))) {
  const script = read('scripts/github/Set-KingsmenMainBranchProtection.ps1');
  for (const token of [
    'source-guard',
    'allow_force_pushes = $false',
    'allow_deletions = $false',
    'required_pull_request_reviews',
    'required_approving_review_count = 1',
    'gh api',
    'MAIN_BRANCH_PROTECTION_APPLIED'
  ]) {
    check(`apply_script_token:${token}`, script.includes(token), token, 'scripts/github/Set-KingsmenMainBranchProtection.ps1');
  }
}

const report = {
  schema: 'kingsmen.main-branch-protection-source-proof.v1',
  module: 'Kingsmen Main Branch Protection',
  status: failed.length === 0 ? 'MAIN_BRANCH_PROTECTION_SOURCE_PROOF_PASSED' : 'MAIN_BRANCH_PROTECTION_SOURCE_PROOF_FAILED',
  passed: failed.length === 0,
  productionReady: false,
  publicLaunchAllowed: false,
  githubProtectionApplied: false,
  requiresFounderAdminApply: true,
  generatedAtIso: new Date().toISOString(),
  checks,
  failed,
  nextAction: failed.length === 0
    ? 'Run Set-KingsmenMainBranchProtection.ps1 with GitHub admin permissions, then validate applied GitHub protection.'
    : 'Repair branch protection files.'
};

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
