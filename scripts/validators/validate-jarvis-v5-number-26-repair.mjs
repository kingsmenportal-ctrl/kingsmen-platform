import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_26_WHEN_THE_COMMANDER_ASKS_FOR_REPAIR.md', [
    'NUMBER 26 — WHEN THE COMMANDER ASKS FOR REPAIR',
    'Repair mode engaged, Sir',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md'
  ]],
  ['packages/jarvis-core/src/repair-mode-boundary.ts', [
    'JARVIS_REPAIR_MODE_BOUNDARY',
    'REPAIR_FAULT_ISOLATION_CONTROL',
    'fault_isolation_and_restoration_not_blind_rewrite',
    'patch_text_must_not_be_treated_as_repair_success',
    'repair_boundary_built_not_repair_execution_proven'
  ]],
  ['apps/web/src/app/api/jarvis/repair/route.ts', [
    'REPAIR_FAULT_ISOLATION_CONTROL',
    'preserveSoundMaterial',
    'route_built_not_repair_execution_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisRepairModePanel.tsx', [
    'JarvisRepairModePanel',
    'REPAIR MODE',
    'Runtime proof not captured yet',
    'must not treat patch text as repair success'
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

const route = read('apps/web/src/app/api/jarvis/repair/route.ts');
const boundary = read('packages/jarvis-core/src/repair-mode-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 26 must not claim repair runtime or production proof from repo files.');
}
for (const step of ['fault_isolated', 'source_inspected', 'sound_material_preserved', 'corrected_path_restored', 'validation_or_evidence_captured']) {
  if (!boundary.includes(step)) fail(`Repair boundary missing required step: ${step}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-26-repair',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    repairIsFaultIsolationNotBlindRewrite: true,
    soundMaterialMustBePreserved: true,
    validationRequiredBeforeSuccessClaim: true,
    noUselessLayers: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-26-repair-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_26_REPAIR_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
