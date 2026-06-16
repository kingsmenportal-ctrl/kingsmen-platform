import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const checks = [
  {
    file: 'packages/jarvis-core/src/live-pass-12-index.ts',
    tokens: ['JARVIS_LIVE_PASS_12_INDEX', 'jarvisCreateConsoleApiRouteIntegration']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-backend-provider-bridge.ts',
    tokens: ['JarvisConsoleBackendProviderBridge', 'jarvisCreateConsoleBackendProviderBridge', 'readOnly: true']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-route-handler-with-fixture-provider.ts',
    tokens: ['jarvisCreateConsoleRouteHandlerWithFixtureProvider', "method: 'GET'", 'readOnly']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-response-fixture.ts',
    tokens: ['JarvisConsoleResponseFixture', 'jarvisCreateConsoleResponseFixture', 'Fixture data is for smoke validation only']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-cache-hydrator.ts',
    tokens: ['JARVIS_CONSOLE_CACHE_HYDRATOR', 'jarvisHydrateConsoleReadModelCache', 'jarvisAddConsoleReadModelCacheEntry']
  },
  {
    file: 'packages/jarvis-core/src/jarvis-console-readonly-api-smoke-validator.ts',
    tokens: ['JarvisConsoleReadOnlyApiSmokeValidator', 'jarvisValidateConsoleReadOnlyApiSmoke', 'method:GET']
  }
];

const results = checks.map((check) => {
  const exists = existsSync(check.file);
  const content = exists ? readFileSync(check.file, 'utf8') : '';
  const missingTokens = check.tokens.filter((token) => !content.includes(token));
  return { file: check.file, exists, missingTokens, passed: exists && missingTokens.length === 0 };
});

const passed = results.every((result) => result.passed);
const report = {
  validator: 'JarvisLivePass13Validator',
  status: passed ? 'passed' : 'failed',
  generatedAtIso: new Date().toISOString(),
  checks: results,
  authorityBoundary: [
    'Pass 13 validates read-only founder console provider bridge and fixture route files only.',
    'Fixture provider is deterministic smoke data only.',
    'Backend state machine, PostgreSQL Truth Vault, validators, evidence, and founder approval remain authoritative.'
  ]
};

const reportPath = 'reports/jarvis/validate-jarvis-live-pass-13.json';
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

if (!passed) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(report, null, 2));
