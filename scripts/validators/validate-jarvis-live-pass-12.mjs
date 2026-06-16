import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const checks = [
  {
    file: 'packages/jarvis-core/src/live-pass-11-index.ts',
    tokens: ['JARVIS_LIVE_PASS_11_INDEX', 'jarvisCreateConsoleApiReadHandler']
  },
  {
    file: 'packages/contracts/src/jarvis/console-response-contract.ts',
    tokens: ['JarvisConsoleResponseContract', 'jarvisCreateConsoleResponseContract']
  },
  {
    file: 'packages/contracts/src/jarvis/console-data-provider-port.ts',
    tokens: ['JarvisConsoleDataProviderPort', 'jarvisCreateConsoleDataProviderPort']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-backend-read-adapter-real.ts',
    tokens: ['JarvisConsoleBackendReadAdapterReal', 'jarvisCreateConsoleBackendReadAdapterReal', 'readOnly: true']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-api-route-integration.ts',
    tokens: ['JarvisConsoleApiRouteIntegration', 'jarvisCreateConsoleApiRouteIntegration', '/founder/jarvis/console']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-read-model-cache.ts',
    tokens: ['JarvisConsoleReadModelCache', 'jarvisCreateConsoleReadModelCache', 'jarvisAddConsoleReadModelCacheEntry']
  }
];

const results = checks.map((check) => {
  const exists = existsSync(check.file);
  const content = exists ? readFileSync(check.file, 'utf8') : '';
  const missingTokens = check.tokens.filter((token) => !content.includes(token));
  return {
    file: check.file,
    exists,
    missingTokens,
    passed: exists && missingTokens.length === 0
  };
});

const passed = results.every((result) => result.passed);
const report = {
  validator: 'JarvisLivePass12Validator',
  status: passed ? 'passed' : 'failed',
  generatedAtIso: new Date().toISOString(),
  checks: results,
  authorityBoundary: [
    'Pass 12 validates read-only console API/data layer files only.',
    'It does not replace backend state machine authority.',
    'It does not approve production-risk paths.'
  ]
};

const reportPath = 'reports/jarvis/validate-jarvis-live-pass-12.json';
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
