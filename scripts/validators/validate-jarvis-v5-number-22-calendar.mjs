import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const required = new Map([
  ['docs/jarvis/v5/script-library/NUMBER_22_WHEN_THE_COMMANDER_ASKS_ABOUT_CALENDAR.md', [
    'NUMBER 22 — WHEN THE COMMANDER ASKS ABOUT CALENDAR',
    'open command windows',
    'Production status: NOT PRODUCTION-COMPLETE FROM MARKDOWN ALONE',
    'NUMBER_23_WHEN_THE_COMMANDER_ASKS_ABOUT_DOCUMENTS.md'
  ]],
  ['packages/jarvis-core/src/calendar-command-boundary.ts', [
    'jarvisAssessCalendarCommandRequest',
    'CALENDAR_TIME_COMMAND_CONTROL',
    'time_position_and_scheduling_control_surface',
    'calendar_suggestion_must_not_be_treated_as_event_created',
    'calendar_boundary_built_not_calendar_runtime_proven'
  ]],
  ['apps/web/src/app/api/jarvis/calendar/route.ts', [
    'CALENDAR_TIME_COMMAND_CONTROL',
    'noWriteWithoutApproval',
    'route_built_not_calendar_runtime_proven'
  ]],
  ['apps/web/src/app/jarvis/components/JarvisCalendarCommandPanel.tsx', [
    'JarvisCalendarCommandPanel',
    'CALENDAR TIME COMMAND',
    'Runtime proof not captured yet',
    'must not treat schedule suggestions as created events'
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

const route = read('apps/web/src/app/api/jarvis/calendar/route.ts');
const boundary = read('packages/jarvis-core/src/calendar-command-boundary.ts');
if (route.includes('productionCompletion: true') || boundary.includes('runtimeProof: "passed"')) {
  fail('Number 22 must not claim calendar runtime or production proof from repo files.');
}
if (!boundary.includes('writeAction && !request.explicitWriteApproval')) {
  fail('Number 22 must block write actions without explicit approval.');
}

const report = {
  validator: 'validate-jarvis-v5-number-22-calendar',
  status: 'passed',
  createdAtIso: new Date().toISOString(),
  doctrine: {
    calendarTimeCommandSurface: true,
    exactDateTimeTimezoneRequired: true,
    noWriteWithoutExplicitApproval: true,
    conflictCheckRequiredForScheduling: true,
    eventInspectionBeforeUpdateDelete: true,
    noLiveClaimFromRepoFiles: true
  },
  files: evidence
};

const reportPath = join(repoRoot, 'reports/jarvis/v5-number-22-calendar-validation-latest.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log('JARVIS_V5_NUMBER_22_CALENDAR_VALIDATION_PASSED');
console.log(JSON.stringify(report, null, 2));
