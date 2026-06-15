import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const checks = [
  {
    file: 'packages/jarvis-core/src/jarvis-founder-console-route-mount.ts',
    tokens: ['JarvisFounderConsoleRouteMount', 'jarvisCreateFounderConsoleRouteMount', 'readOnly: true'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-fixture-composer.ts',
    tokens: ['JarvisConsoleFixtureComposer', 'jarvisComposeConsoleFixtures', 'jarvisCreateHudPanelDataFixture'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-static-smoke-page.ts',
    tokens: ['JarvisConsoleStaticSmokePage', 'jarvisCreateConsoleStaticSmokePage', 'readOnly: true'],
  },
  {
    file: 'packages/jarvis-core/src/live-pass-08-index.ts',
    tokens: ['jarvisCreateFounderConsoleStaticHtml', 'jarvisCreateValidationReportFixture'],
  },
  {
    file: 'packages/contracts/src/jarvis/console-style-contract.ts',
    tokens: ['JarvisConsoleStyleContract', 'single-column-mobile-first', 'minimumTouchTargetPx'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-accessibility-check.ts',
    tokens: ['JarvisConsoleAccessibilityCheck', 'jarvisRunConsoleAccessibilityCheck', 'keyboard-navigation'],
  },
];

const results = checks.map((check) => {
  const path = join(root, check.file);
  const exists = existsSync(path);
  const content = exists ? readFileSync(path, 'utf8') : '';
  const missingTokens = check.tokens.filter((token) => !content.includes(token));

  return {
    file: check.file,
    exists,
    missingTokens,
    passed: exists && missingTokens.length === 0,
  };
});

const passed = results.every((result) => result.passed);
const report = {
  validator: 'validate-jarvis-live-pass-09',
  passed,
  generatedAt: new Date().toISOString(),
  results,
};

const reportPath = join(root, 'reports', 'jarvis', 'validate-jarvis-live-pass-09.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
