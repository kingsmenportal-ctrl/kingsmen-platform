import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts',
  'apps/web/src/lib/public-repos/live/public-repo-adapter-contracts.ts',
  'apps/web/src/app/api/jarvis/public-repos/route.ts',
  'apps/web/src/lib/jarvis/runtime/types.ts',
  'apps/web/src/lib/jarvis/runtime/intent-router.ts',
  'apps/web/src/lib/jarvis/runtime/command-registry.ts',
  'apps/web/src/lib/jarvis/runtime/adapter-selector.ts',
  'docs/N21-LIVE-PUBLIC-REPOS/N21_1_PUBLIC_REPO_LIVE_INTEGRATION_BOARD.md'
];

const requiredContent = [
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'DoclingAdapter'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'PlaywrightScoutGateway'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'JarvisWakeWordService'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'JarvisSpeechToTextService'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'LangfuseTraceGateway'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'GitleaksSecurityGate'],
  ['apps/web/src/lib/public-repos/live/public-repo-integration-registry.ts', 'TrivySecurityGate'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'public_repo_integration'],
  ['apps/web/src/lib/jarvis/runtime/types.ts', 'PUBLIC_REPO_INTEGRATION_BOARD'],
  ['apps/web/src/lib/jarvis/runtime/intent-router.ts', 'public_repo_integration'],
  ['apps/web/src/lib/jarvis/runtime/command-registry.ts', 'public_repo_registry_adapter'],
  ['apps/web/src/lib/jarvis/runtime/adapter-selector.ts', 'public_repo_registry_adapter'],
  ['apps/web/src/app/api/jarvis/public-repos/route.ts', 'getLivePublicRepoIntegrations']
];

const results = [];
let passed = true;

for (const file of requiredFiles) {
  const full = path.join(root, file);
  const ok = fs.existsSync(full);
  results.push({ check: 'file_exists', file, ok });
  if (!ok) passed = false;
}

for (const [file, needle] of requiredContent) {
  const full = path.join(root, file);
  const content = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
  const ok = content.includes(needle);
  results.push({ check: 'content_contains', file, needle, ok });
  if (!ok) passed = false;
}

const report = {
  validator: 'validate-n21-live-public-repos',
  passed,
  checkedAt: new Date().toISOString(),
  summary: {
    files: requiredFiles.length,
    contentChecks: requiredContent.length
  },
  results
};

const reportDir = path.join(root, 'reports', 'validation');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'n21-live-public-repos-latest.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
process.exit(passed ? 0 : 1);
