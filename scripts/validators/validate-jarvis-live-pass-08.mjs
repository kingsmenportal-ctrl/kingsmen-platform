import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const checks = [
  ['packages/jarvis-core/src/jarvis-founder-console-static-html.ts', 'jarvisCreateFounderConsoleStaticHtml'],
  ['packages/jarvis-core/src/jarvis-founder-console-client-state.ts', 'jarvisCreateFounderConsoleClientState'],
  ['packages/jarvis-core/src/jarvis-hud-panel-data-fixture.ts', 'jarvisCreateHudPanelDataFixture'],
  ['packages/jarvis-core/src/jarvis-review-queue-fixture.ts', 'jarvisCreateReviewQueueFixture'],
  ['packages/jarvis-core/src/jarvis-validation-report-fixture.ts', 'jarvisCreateValidationReportFixture'],
];

const results = checks.map(([path, token]) => {
  const fullPath = join(root, path);
  const exists = existsSync(fullPath);
  const content = exists ? readFileSync(fullPath, 'utf8') : '';
  return {
    path,
    token,
    exists,
    hasToken: content.includes(token),
    status: exists && content.includes(token) ? 'pass' : 'fail',
  };
});

const failed = results.filter((item) => item.status !== 'pass');
const report = {
  validator: 'validate-jarvis-live-pass-08',
  status: failed.length === 0 ? 'pass' : 'fail',
  generatedAtIso: new Date().toISOString(),
  results,
};

const reportPath = join(root, 'reports/jarvis/validate-jarvis-live-pass-08.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
