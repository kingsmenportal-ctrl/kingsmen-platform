import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md', [
    'NUMBER 34 — WHEN COMMAND IS COMPLETE',
    'Command completed, Commander',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_35_MORNING_COMMAND_BRIEF.md'
  ]],
  ['packages/jarvis-core/src/command-complete-boundary.ts', [
    'jarvisAssessCommandCompleteRequest',
    'COMMAND_COMPLETE_CLOSEOUT_CONTROL',
    'evidence_backed_closeout_not_casual_done',
    'done_must_not_be_claimed_without_verified_output',
    'command_complete_boundary_built_not_live_completion_proven'
  ]],
  ['apps/web/src/app/api/jarvis/command-complete/route.ts', [
    'COMMAND_COMPLETE_CLOSEOUT_CONTROL',
    'noDoneWithoutProof',
    'route_built_not_live_completion_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisCommandCompletePanel.tsx', [
    'JarvisCommandCompletePanel',
    'COMMAND COMPLETE',
    'Runtime proof not captured yet',
    'must not treat “done” as proof'
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

const route = read('apps/web/src/app/api/jarvis/command-complete/route.ts');
const boundary = read('packages/jarvis-core/src/command-complete-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 34 must not claim live command completion or production proof from repo files.');
}
for (const step of ['command_identified', 'result_status_declared', 'verified_output_named', 'remaining_matter_stated', 'risk_stated_or_none_marked', 'recommended_next_command_set']) {
  if (!boundary.includes(step)) fail(`Command-complete boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-34-command-complete',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    noDoneWithoutProof: true,
    verifiedOutputRequired: true,
    partialAndBlockedStatesMustRemainVisible: true,
    remainingMatterAndRiskRequired: true,
    nextCommandRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-34-command-complete-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_34_COMMAND_COMPLETE_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
