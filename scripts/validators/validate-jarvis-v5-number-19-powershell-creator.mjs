import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_19_WHEN_THE_COMMANDER_ASKS_ABOUT_POWER_SHELL_CREATOR.md', [
    'NUMBER 19 — WHEN THE COMMANDER ASKS ABOUT POWER SHELL CREATOR',
    'PowerShell Creator',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md'
  ]],
  ['packages/jarvis-core/src/powershell-creator-boundary.ts', [
    'jarvisAssessPowerShellCreatorRequest',
    'POWERSHELL_CREATOR_BUILD_HELPER',
    'windows_build_scribe_and_local_execution_helper_not_doctrine_or_truth',
    'script_text_must_not_be_treated_as_command_execution_proof',
    'powershell_boundary_built_not_local_execution_proven'
  ]],
  ['apps/web/src/app/api/jarvis/powershell/route.ts', [
    'POWERSHELL_CREATOR_BUILD_HELPER',
    'scriptTextIsNotExecutionProof',
    'route_built_not_local_execution_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisPowerShellCreatorPanel.tsx', [
    'JarvisPowerShellCreatorPanel',
    'POWERSHELL CREATOR',
    'Runtime proof not captured yet',
    'terminal output, validator output, and GitHub traceability'
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

const route = read('apps/web/src/app/api/jarvis/powershell/route.ts');
const boundary = read('packages/jarvis-core/src/powershell-creator-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 19 must not claim local execution or production proof from repo files.');
}

const report = {
  validator: 'validate-jarvis-v5-number-19-powershell-creator',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    powershellCreatorIsBuildHelperOnly: true,
    scriptTextIsNotExecutionProof: true,
    noBlindOverwrite: true,
    noSecretPrinting: true,
    validationOutputRequired: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-19-powershell-creator-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_19_POWERSHELL_CREATOR_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
