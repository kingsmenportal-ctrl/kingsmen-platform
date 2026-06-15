import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'jarvis');
fs.mkdirSync(reportDir, { recursive: true });

const required = [
  {
    path: 'packages/contracts/src/jarvis/patch-plan.ts',
    tokens: ['JarvisPatchPlanContract', 'JarvisChangedFilesReport', 'JarvisValidatorResultLedger', 'JarvisHudReadModel']
  },
  {
    path: 'packages/contracts/src/jarvis/app-route-plan.ts',
    tokens: ['JarvisAppRoutePlanV1', 'founderApprovalRequired', 'evidenceRequired']
  },
  {
    path: 'packages/contracts/src/jarvis/live-contracts.ts',
    tokens: ['JarvisChangedFilesReport', 'JarvisConnectorGatewayPlan']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-patch-plan-contract.ts',
    tokens: ['jarvisCreatePatchPlanContract', 'jarvisAssertPatchPlanContract']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-changed-files-reporter.ts',
    tokens: ['jarvisCreateChangedFilesReport', 'blockedFiles']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validator-result-ledger.ts',
    tokens: ['jarvisCreateValidatorResultLedger', 'jarvisResolveValidatorStatus', 'overallStatus']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-ui-read.ts',
    tokens: ['jarvisCreateHudReadModel', 'founderApprovalRequired']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-app-route-planner.ts',
    tokens: ['jarvisCreateAppRoutePlan', 'jarvisEvaluatePolicy', 'jarvisRequireTool']
  },
  {
    path: 'packages/jarvis-core/src/live-index.ts',
    tokens: ['jarvisCreatePatchPlanContract', 'jarvisCreateValidatorResultLedger', 'jarvisCreateAppRoutePlan']
  }
];

const failures = [];
const checked = [];

for (const item of required) {
  const full = path.join(root, item.path);
  if (!fs.existsSync(full)) {
    failures.push(`${item.path}: missing file`);
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  checked.push(item.path);
  for (const token of item.tokens) {
    if (!text.includes(token)) failures.push(`${item.path}: missing token ${token}`);
  }
}

const report = {
  validatorRef: 'validate-jarvis-live-pass-02',
  status: failures.length === 0 ? 'passed' : 'failed',
  checked,
  failures,
  createdAtIso: new Date().toISOString()
};

fs.writeFileSync(
  path.join(reportDir, 'validate-jarvis-live-pass-02.json'),
  `${JSON.stringify(report, null, 2)}\n`
);

if (failures.length > 0) {
  console.error('Jarvis live pass 02 validation failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Jarvis live pass 02 validation passed');
