import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const doctrineFiles = [
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
  'docs/jarvis/v5/script-library/NUMBER_16_WHEN_THE_COMMANDER_ASKS_ABOUT_POSTGRESQL.md'
];

const runtimeFiles = new Map([
  ['packages/jarvis-core/src/jarvis-v5-script-library-runtime.ts', [
    'JARVIS_V5_SCRIPT_LIBRARY_01_TO_16',
    'jarvisClassifyV5ScriptCommand',
    'jarvisSummarizeV5ScriptRuntime',
    'Command Received',
    'General Question Answering',
    'When the Commander Asks About PostgreSQL',
    'live_runtime_not_proven'
  ]],
  ['apps/web/src/app/api/jarvis/v5/script-library/route.ts', [
    'range: \'01_to_16\'',
    'runtimeRegistry',
    'repo_material_built_not_live_runtime_proven',
    'postgresqlTruthVault',
    'repoProofIsNotRuntimeProof'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisV5ScriptLibraryPanel.tsx', [
    'JarvisV5ScriptLibraryPanel',
    'Numbers 01–16',
    'Not proven until deployed and executed',
    'postgresql_truth_vault'
  ]],
  ['packages/jarvis-core/src/index.ts', [
    './jarvis-v5-script-library-runtime',
    './postgresql-truth-vault-boundary'
  ]],
  ['package.json', [
    'jarvis:validate:v5:01-to-16',
    'validate-jarvis-v5-numbers-01-to-16-runtime.mjs'
  ]]
]);

function fail(message) {
  throw new Error(message);
}

function read(relativePath) {
  const fullPath = join(repoRoot, relativePath);
  if (!existsSync(fullPath)) fail(`Missing required file: ${relativePath}`);
  return readFileSync(fullPath, 'utf8');
}

const evidence = [];

for (const file of doctrineFiles) {
  const content = read(file);
  if (!content.includes('KINGSMEN JARVIS V5 — SCRIPT LIBRARY')) {
    fail(`Doctrine file missing script-library header: ${file}`);
  }
  if (!content.includes('Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE')) {
    fail(`Doctrine file must not claim production from markdown: ${file}`);
  }
  evidence.push({ file, type: 'doctrine', bytes: content.length });
}

for (const [file, tokens] of runtimeFiles.entries()) {
  const content = read(file);
  for (const token of tokens) {
    if (!content.includes(token)) {
      fail(`Required token not found in ${file}: ${token}`);
    }
  }
  evidence.push({ file, type: 'runtime', bytes: content.length, checkedTokens: tokens.length });
}

const registry = read('packages/jarvis-core/src/jarvis-v5-script-library-runtime.ts');
const numberMatches = registry.match(/number: /g) ?? [];
if (numberMatches.length !== 16) {
  fail(`Runtime registry must contain exactly 16 script number entries. Found ${numberMatches.length}.`);
}

const requiredBoundaries = [
  'emailPrimary',
  'whatsappUrgentOnly',
  'noUselessLayers',
  'postgresqlTruthVault',
  'airtableMirrorOnly',
  'n8nThinWorkerOnly',
  'playwrightScoutOnly',
  'openclawGatewayOnly',
  'repoProofIsNotRuntimeProof'
];
const apiRoute = read('apps/web/src/app/api/jarvis/v5/script-library/route.ts');
for (const boundary of requiredBoundaries) {
  if (!apiRoute.includes(boundary)) fail(`API route missing boundary: ${boundary}`);
}

if (registry.includes('productionCompletion: true') || apiRoute.includes('liveRuntime: \'proven\'')) {
  fail('Runtime files must not claim live production proof.');
}

const report = {
  validator: 'validate-jarvis-v5-numbers-01-to-16-runtime',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  range: '01_to_16',
  doctrineFilesChecked: doctrineFiles.length,
  runtimeFilesChecked: runtimeFiles.size,
  doctrine: {
    noUselessLayers: true,
    emailPrimaryWhatsappUrgentOnly: true,
    postgresqlTruthVault: true,
    airtableMirrorOnly: true,
    n8nThinWorkerOnly: true,
    playwrightScoutOnly: true,
    openclawGatewayOnly: true,
    repoProofIsNotRuntimeProof: true,
    noProductionClaimWithoutRuntimeExecution: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-numbers-01-to-16-runtime-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

console.log('JARVIS_V5_NUMBERS_01_TO_16_RUNTIME_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
