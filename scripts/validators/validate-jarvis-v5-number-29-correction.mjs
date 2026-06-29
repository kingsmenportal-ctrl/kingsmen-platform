import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_29_WHEN_THE_COMMANDER_CORRECTS_YOU.md', [
    'NUMBER 29 — WHEN THE COMMANDER CORRECTS YOU',
    'Correction accepted, Commander',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md'
  ]],
  ['packages/jarvis-core/src/correction-command-boundary.ts', [
    'jarvisAssessCorrectionCommandRequest',
    'CORRECTION_OPERATING_RULE_UPDATE_CONTROL',
    'commander_correction_updates_operating_standard_not_argument',
    'apology_must_not_be_treated_as_material_repair',
    'correction_boundary_built_not_correction_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/correction/route.ts', [
    'CORRECTION_OPERATING_RULE_UPDATE_CONTROL',
    'acceptCommanderCorrection',
    'route_built_not_correction_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisCorrectionCommandPanel.tsx', [
    'JarvisCorrectionCommandPanel',
    'CORRECTION MODE',
    'Runtime proof not captured yet',
    'must not treat apology as material repair'
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

const route = read('apps/web/src/app/api/jarvis/correction/route.ts');
const boundary = read('packages/jarvis-core/src/correction-command-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 29 must not claim correction runtime or production proof from repo files.');
}
for (const step of ['correction_received', 'correction_accepted', 'corrected_standard_defined', 'operating_rule_updated', 'next_correct_command_set']) {
  if (!boundary.includes(step)) fail(`Correction boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-29-correction',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    commanderCorrectionAccepted: true,
    operatingRuleUpdatedImmediately: true,
    noMinimisingKingsmenScope: true,
    apologyIsNotMaterialRepair: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-29-correction-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_29_CORRECTION_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
