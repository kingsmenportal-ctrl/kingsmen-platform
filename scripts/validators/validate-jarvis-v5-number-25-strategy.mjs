import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md', [
    'NUMBER 25 — WHEN THE COMMANDER ASKS FOR STRATEGY',
    'Strategy mode engaged, Commander',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_26_WHEN_THE_COMMANDER_ASKS_FOR_REPAIR.md'
  ]],
  ['packages/jarvis-core/src/strategy-command-boundary.ts', [
    'jarvisAssessStrategyCommandRequest',
    'STRATEGY_COMMAND_ASSESSMENT_CONTROL',
    'disciplined_command_assessment_not_execution_proof',
    'strategy_text_must_not_be_treated_as_execution_proof',
    'strategy_boundary_built_not_strategy_execution_proven'
  ]],
  ['apps/web/src/app/api/jarvis/strategy/route.ts', [
    'STRATEGY_COMMAND_ASSESSMENT_CONTROL',
    'noUselessLayers',
    'route_built_not_strategy_execution_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisStrategyCommandPanel.tsx', [
    'JarvisStrategyCommandPanel',
    'STRATEGY COMMAND MODE',
    'Runtime proof not captured yet',
    'must not treat strategy text as execution proof'
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

const route = read('apps/web/src/app/api/jarvis/strategy/route.ts');
const boundary = read('packages/jarvis-core/src/strategy-command-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 25 must not claim strategy execution or production proof from repo files.');
}
for (const lens of ['operational_value', 'national_scope', 'revenue_protection', 'candidate_safety', 'compliance', 'capacity', 'command_control']) {
  if (!boundary.includes(lens)) fail(`Strategy boundary missing required lens: ${lens}`);
}
if (!boundary.includes('new_layers_must_not_be_added_without_necessity_and_validator_proof')) {
  fail('Number 25 must enforce the no-useless-layers rule.');
}

const report = {
  validator: 'validate-jarvis-v5-number-25-strategy',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    strategyIsCommandAssessmentNotExecutionProof: true,
    operationalValueNationalScopeRevenueProtectionRequired: true,
    candidateSafetyComplianceCapacityCommandControlRequired: true,
    noUselessLayers: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-25-strategy-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_25_STRATEGY_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
