import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

const checks = [
  {
    file: 'packages/jarvis-core/src/live-pass-10-index.ts',
    tokens: ['jarvis-founder-console-real-route-file', 'jarvis-console-ui-snapshot-validator'],
  },
  {
    file: 'packages/contracts/src/jarvis/console-backend-read-contract.ts',
    tokens: ['JarvisConsoleBackendReadContract', 'read_model_only_not_truth_source'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-api-read-handler.ts',
    tokens: ['jarvisConsoleApiReadHandler', 'readOnly: true'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-data-provider-fixture-adapter.ts',
    tokens: ['jarvisConsoleDataProviderFixtureAdapter', 'Fixture-backed read model'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-route-smoke-test.ts',
    tokens: ['JarvisConsoleRouteSmokeTest', 'data-jarvis-console'],
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-view-model-fixture.ts',
    tokens: ['jarvisConsoleViewModelFixture', 'Kingsmen Jarvis Founder Console'],
  },
];

const results = checks.map((check) => {
  const absolute = join(root, check.file);
  const exists = existsSync(absolute);
  const content = exists ? readFileSync(absolute, 'utf8') : '';
  const missingTokens = check.tokens.filter((token) => !content.includes(token));
  return {
    file: check.file,
    exists,
    missingTokens,
    ok: exists && missingTokens.length === 0,
  };
});

const passed = results.every((result) => result.ok);
const report = {
  validator: 'validate-jarvis-live-pass-11',
  generatedAtIso: new Date().toISOString(),
  passed,
  results,
};

const reportPath = join(root, 'reports/jarvis/validate-jarvis-live-pass-11.json');
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
