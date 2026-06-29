import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_37_EVENING_COMMAND_CLOSEOUT.md', [
    'NUMBER 37 — EVENING COMMAND CLOSEOUT',
    'Good evening, Commander',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_38_SIGNATURE_CLOSING_LINES.md'
  ]],
  ['packages/jarvis-core/src/evening-command-closeout-boundary.ts', [
    'jarvisAssessEveningCloseoutRequest',
    'EVENING_COMMAND_CLOSEOUT_CONTROL',
    'end_of_day_command_seal_not_live_completion_proof',
    'evening_closeout_must_not_invent_completed_work',
    'evening_closeout_boundary_built_not_live_closeout_proven'
  ]],
  ['apps/web/src/app/api/jarvis/evening-command-closeout/route.ts', [
    'EVENING_COMMAND_CLOSEOUT_CONTROL',
    'noInventedCompletedWork',
    'route_built_not_live_evening_closeout_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisEveningCommandCloseoutPanel.tsx', [
    'JarvisEveningCommandCloseoutPanel',
    'EVENING COMMAND CLOSEOUT',
    'Runtime proof not captured yet',
    'must not invent completed work'
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

const route = read('apps/web/src/app/api/jarvis/evening-command-closeout/route.ts');
const boundary = read('packages/jarvis-core/src/evening-command-closeout-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 37 must not claim live evening closeout or production proof from repo files.');
}
for (const section of ['evening_opening', 'completed_today', 'unresolved_matters', 'risks_carried_forward', 'tomorrow_command_queue', 'closeout_decision']) {
  if (!boundary.includes(section)) fail(`Evening closeout boundary missing required section: ${section}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-37-evening-command-closeout',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    eveningCloseoutRequiresEndOfDaySeal: true,
    noInventedCompletedWork: true,
    unresolvedMattersVisible: true,
    risksCarriedForward: true,
    tomorrowQueueRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-37-evening-command-closeout-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_37_EVENING_COMMAND_CLOSEOUT_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
