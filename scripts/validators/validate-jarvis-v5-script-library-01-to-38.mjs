import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const scriptLibraryPaths = [
  'docs/jarvis/v5/script-library/NUMBER_01_COMMAND_RECEIVED.md',
  'docs/jarvis/v5/script-library/NUMBER_02_GENERAL_QUESTION_ANSWERING.md',
  'docs/jarvis/v5/script-library/NUMBER_03_WHEN_THE_COMMANDER_ASKS_ANYTHING_CURRENT.md',
  'docs/jarvis/v5/script-library/NUMBER_04_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENING_DATES_OR_DEADLINES.md',
  'docs/jarvis/v5/script-library/NUMBER_05_WHEN_THE_COMMANDER_ASKS_ABOUT_WEATHER.md',
  'docs/jarvis/v5/script-library/NUMBER_06_WHEN_THE_COMMANDER_ASKS_ABOUT_NEWS.md',
  'docs/jarvis/v5/script-library/NUMBER_07_WHEN_THE_COMMANDER_ASKS_ABOUT_JOBS.md',
  'docs/jarvis/v5/script-library/NUMBER_08_WHEN_THE_COMMANDER_ASKS_ABOUT_BUSINESS.md',
  'docs/jarvis/v5/script-library/NUMBER_09_WHEN_THE_COMMANDER_ASKS_ABOUT_TECHNOLOGY.md',
  'docs/jarvis/v5/script-library/NUMBER_10_WHEN_THE_COMMANDER_ASKS_ABOUT_CODING.md',
  'docs/jarvis/v5/script-library/NUMBER_11_WHEN_THE_COMMANDER_ASKS_ABOUT_AI_OR_AGENTS.md',
  'docs/jarvis/v5/script-library/NUMBER_12_WHEN_THE_COMMANDER_ASKS_ABOUT_OPENCLAW.md',
  'docs/jarvis/v5/script-library/NUMBER_13_WHEN_THE_COMMANDER_ASKS_ABOUT_PLAYWRIGHT.md',
  'docs/jarvis/v5/script-library/NUMBER_14_WHEN_THE_COMMANDER_ASKS_ABOUT_N8N.md',
  'docs/jarvis/v5/script-library/NUMBER_15_WHEN_THE_COMMANDER_ASKS_ABOUT_AIRTABLE.md',
  'docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md',
  'docs/jarvis/v5/script-library/NUMBER_17_WHEN_THE_COMMANDER_ASKS_ABOUT_SUPABASE.md',
  'docs/jarvis/v5/script-library/NUMBER_18_WHEN_THE_COMMANDER_ASKS_ABOUT_GITHUB.md',
  'docs/jarvis/v5/script-library/NUMBER_19_WHEN_THE_COMMANDER_ASKS_ABOUT_POWER_SHELL_CREATOR.md',
  'docs/jarvis/v5/script-library/NUMBER_20_WHEN_THE_COMMANDER_ASKS_ABOUT_PAYFAST.md',
  'docs/jarvis/v5/script-library/NUMBER_21_WHEN_THE_COMMANDER_ASKS_ABOUT_EMAILS.md',
  'docs/jarvis/v5/script-library/NUMBER_22_WHEN_THE_COMMANDER_ASKS_ABOUT_CALENDAR.md',
  'docs/jarvis/v5/script-library/NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md',
  'docs/jarvis/v5/script-library/NUMBER_24_WHEN_THE_COMMANDER_ASKS_ABOUT_REPORTS.md',
  'docs/jarvis/v5/script-library/NUMBER_25_WHEN_THE_COMMANDER_ASKS_FOR_STRATEGY.md',
  'docs/jarvis/v5/script-library/NUMBER_26_WHEN_THE_COMMANDER_ASKS_FOR_REPAIR.md',
  'docs/jarvis/v5/script-library/NUMBER_27_WHEN_THE_COMMANDER_ASKS_FOR_INSPECTION.md',
  'docs/jarvis/v5/script-library/NUMBER_28_WHEN_THE_COMMANDER_ASKS_FOR_DEPLOYMENT.md',
  'docs/jarvis/v5/script-library/NUMBER_29_WHEN_THE_COMMANDER_CORRECTS_YOU.md',
  'docs/jarvis/v5/script-library/NUMBER_30_WHEN_EVIDENCE_IS_MISSING.md',
  'docs/jarvis/v5/script-library/NUMBER_31_WHEN_THE_SYSTEM_IS_STABLE.md',
  'docs/jarvis/v5/script-library/NUMBER_32_WHEN_RISK_IS_RISING.md',
  'docs/jarvis/v5/script-library/NUMBER_33_WHEN_THERE_IS_A_CRITICAL_INCIDENT.md',
  'docs/jarvis/v5/script-library/NUMBER_34_WHEN_COMMAND_IS_COMPLETE.md',
  'docs/jarvis/v5/script-library/NUMBER_35_MORNING_COMMAND_BRIEF.md',
  'docs/jarvis/v5/script-library/NUMBER_36_MIDDAY_COMMAND_BRIEF.md',
  'docs/jarvis/v5/script-library/NUMBER_37_EVENING_COMMAND_CLOSEOUT.md',
  'docs/jarvis/v5/script-library/NUMBER_38_SIGNATURE_CLOSING_LINES.md'
];

function fail(message) { throw new Error(message); }
function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

if (scriptLibraryPaths.length !== 38) fail(`Expected 38 script library paths, found ${scriptLibraryPaths.length}`);

const files = [];
for (let i = 0; i < scriptLibraryPaths.length; i += 1) {
  const expectedNumber = String(i + 1).padStart(2, '0');
  const path = scriptLibraryPaths[i];
  if (!path.includes(`NUMBER_${expectedNumber}_`)) fail(`Number sequence mismatch at ${i + 1}: ${path}`);
  const content = read(path);
  if (!content.includes('KINGSMEN JARVIS V5')) fail(`Missing V5 doctrine header in ${path}`);
  files.push({ number: i + 1, path, bytes: content.length });
}

const index = read('packages/jarvis-core/src/index.ts');
for (const token of [
  'jarvis-v5-script-library-runtime-38',
  'closing-lines-boundary',
  'jarvis-v5-script-library-final-sequence'
]) {
  if (!index.includes(token)) fail(`Index export missing token: ${token}`);
}

const pkg = read('package.json');
for (const token of [
  'jarvis:validate:v5:number-38',
  'jarvis:validate:v5:01-to-38'
]) {
  if (!pkg.includes(token)) fail(`package.json missing validation script: ${token}`);
}

const finalRegistry = read('packages/jarvis-core/src/jarvis-v5-script-library-final-sequence.ts');
if (!finalRegistry.includes('totalExpected: 38') || !finalRegistry.includes('01_to_38')) {
  fail('Final sequence registry missing expected 01-to-38 status.');
}

const report = {
  validator: 'validate-jarvis-v5-script-library-01-to-38',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    expectedCount: 38,
    allScriptLibraryDoctrineFilesPresent: true,
    indexExportsFinalRuntime: true,
    packageScriptsIncludeFinalValidators: true,
    runtimeProof: null,
    productionCompletion: 'not_claimed_from_repo_material_alone'
  },
  files
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-script-library-01-to-38-final-closeout-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_SCRIPT_LIBRARY_01_TO_38_FINAL_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
