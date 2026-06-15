import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportDir = path.join(root, 'reports', 'jarvis');
fs.mkdirSync(reportDir, { recursive: true });

const required = [
  {
    path: 'packages/contracts/src/jarvis/ops.ts',
    tokens: ['JarvisPatchWriterDryRunResult', 'JarvisHudTimelineEntry', 'JarvisLocalCommandPlan']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-patch-writer-dry-run.ts',
    tokens: ['jarvisCreatePatchWriterDryRunResult', 'readyForReview']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-validator-checklist.ts',
    tokens: ['jarvisCreateValidatorChecklist', 'JarvisValidatorChecklist']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-hud-timeline-store.ts',
    tokens: ['jarvisCreateHudTimelineEntry', 'jarvisAppendHudTimelineEntry']
  },
  {
    path: 'packages/jarvis-core/src/jarvis-repo-change-summary.ts',
    tokens: ['JarvisRepoChangeSummary', 'jarvisCreateRepoChangeSummary']
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
  validatorRef: 'validate-jarvis-live-pass-03',
  status: failures.length === 0 ? 'passed' : 'failed',
  checked,
  failures,
  createdAtIso: new Date().toISOString()
};

fs.writeFileSync(
  path.join(reportDir, 'validate-jarvis-live-pass-03.json'),
  `${JSON.stringify(report, null, 2)}\n`
);

if (failures.length > 0) {
  console.error('Jarvis live pass 03 validation failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Jarvis live pass 03 validation passed');
