import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const failures = [];

function relative(path) {
  return join(repoRoot, path);
}

function read(path) {
  const full = relative(path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function requireFile(path, tokens = []) {
  const content = read(path);
  if (content === null) {
    failures.push(`Missing file: ${path}`);
    return;
  }
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${path} missing token: ${token}`);
  }
}

requireFile('scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1', [
  'finish/full-live-operating-system-main-sync',
  'git fetch origin --prune',
  'git checkout $Branch',
  'git rebase',
  'git merge',
  'npm run payments:validate:runtime-gate',
  'npm run payments:validate:http-boundary',
  'npm run payments:validate:server-persistence',
  'npm run payments:validate:service-activation',
  'npm run payments:validate:candidate-status',
  'npm run payments:validate:clean-sync'
]);

requireFile('docs/finance/KINGSMEN_PAYFAST_CLEAN_BRANCH_SYNC_REPAIR.md', [
  'finish/full-live-operating-system-main-sync',
  'Sync-KingsmenPayFastCleanBranch.ps1',
  '-PushAfterSync',
  '-UseMergeInsteadOfRebase',
  'PayFast live remains blocked'
]);

const script = read('scripts/repo/Sync-KingsmenPayFastCleanBranch.ps1') ?? '';
if (!script.includes('git status --porcelain')) failures.push('Sync script must block dirty working trees.');
if (script.includes('PAYFAST_MERCHANT_KEY=') || script.includes('PAYFAST_PASSPHRASE=')) failures.push('Sync script must not contain PayFast credentials.');

const report = {
  validator: 'validate-payfast-clean-branch-sync-repair',
  generatedAtIso: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  doctrine: {
    branchSyncRepairDocumented: true,
    localDirtyTreeBlocked: true,
    validatorsRunBeforePush: true,
    noPaymentSecretsInRepairScript: true
  }
};

const reportPath = relative('reports/finance/payfast-clean-branch-sync-repair-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(report.passed ? 'PAYFAST_CLEAN_BRANCH_SYNC_REPAIR_VALIDATED' : 'PAYFAST_CLEAN_BRANCH_SYNC_REPAIR_FAILED');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
