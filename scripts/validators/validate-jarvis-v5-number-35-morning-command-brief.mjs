import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_35_MORNING_COMMAND_BRIEF.md', [
    'NUMBER 35 — MORNING COMMAND BRIEF',
    'Good morning, Commander',
    'NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_36_MIDDAY_COMMAND_BRIEF.md'
  ]],
  ['packages/jarvis-core/src/morning-command-brief-boundary.ts', [
    'jarvisAssessMorningBriefRequest',
    'MORNING_COMMAND_BRIEF_CONTROL',
    'daily_command_opening_position_report_not_live_proof',
    'morning_brief_must_not_invent_current_fields',
    'morning_brief_boundary_built_not_live_brief_proven'
  ]],
  ['apps/web/src/app/api/jarvis/morning-command-brief/route.ts', [
    'MORNING_COMMAND_BRIEF_CONTROL',
    'noInventedCurrentFields',
    'route_built_not_live_morning_brief_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisMorningCommandBriefPanel.tsx', [
    'JarvisMorningCommandBriefPanel',
    'MORNING COMMAND BRIEF',
    'Runtime proof not captured yet',
    'must not invent current fields'
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

const route = read('apps/web/src/app/api/jarvis/morning-command-brief/route.ts');
const boundary = read('packages/jarvis-core/src/morning-command-brief-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 35 must not claim live morning brief or production proof from repo files.');
}
for (const section of ['greeting_and_jarvis_online', 'date_time_location_weather_calendar', 'command_status', 'kingsmen_position', 'matters_requiring_attention', 'recommended_first_command']) {
  if (!boundary.includes(section)) fail(`Morning brief boundary missing required section: ${section}`);
}

const report = {
  validator: 'validate-jarvis-v5-number-35-morning-command-brief',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    morningBriefRequiresCommandContext: true,
    noInventedCurrentFields: true,
    kingsmenPositionRequired: true,
    attentionMattersRequired: true,
    recommendedFirstCommandRequired: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-35-morning-command-brief-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_35_MORNING_COMMAND_BRIEF_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
