import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_36_MIDDAY_COMMAND_BRIEF.md', [
    'NUMBER 36 — MIDDAY COMMAND BRIEF',
    'Midday command brief, Commander',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_37_EVENING_COMMAND_CLOSEOUT.md'
  ]],
  ['packages/jarvis-core/src/midday-command-brief-boundary.ts', [
    'jarvisAssessMiddayBriefRequest',
    'MIDDAY_COMMAND_BRIEF_CONTROL',
    'operational_checkpoint_not_live_progress_proof',
    'midday_brief_must_not_invent_progress',
    'midday_brief_boundary_built_not_live_brief_proven'
  ]],
  ['apps/web/src/app/api/jarvis/midday-command-brief/route.ts', [
    'MIDDAY_COMMAND_BRIEF_CONTROL',
    'noInventedProgress',
    'route_built_not_live_midday_brief_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisMiddayCommandBriefPanel.tsx', [
    'JarvisMiddayCommandBriefPanel',
    'MIDDAY COMMAND BRIEF',
    'Runtime proof not captured yet',
    'must not invent progress'
  ]]
]);

function fail(message) { throw new Error(message); }
function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];
for (const [file, tokens] of required.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) fail(`Required token not found in ${file}: ${token}`);
  }
  evidence.push({ file, bytes: content.length, checkedTokens: tokens.length });
}

const route = read('apps/web/src/app/api/jarvis/midday-command-brief/route.ts');
const boundary = read('packages/jarvis-core/src/midday-command-brief-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 36 must not claim live midday brief or production proof from repo files.');
}
for (const section of ['midday_opening', 'morning_baseline_or_requires_review', 'progress_since_morning', 'completed_work', 'delayed_matters', 'recommended_afternoon_command']) {
  if (!boundary.includes(section)) fail(`Midday brief boundary missing required section: ${section}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-36-midday-command-brief',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    middayBriefRequiresOperationalCheckpoint: true,
    noInventedProgress: true,
    completedWorkRequiresEvidence: true,
    delaysBlocksAndRisksVisible: true,
    recommendedAfternoonCommandRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-36-midday-command-brief-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_36_MIDDAY_COMMAND_BRIEF_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
